#!/usr/bin/env python
"""
Turn raw harvested pictures into the four assets the skin ships.

    python ./tools/prepare-art.py --from <raw dir> --map studio=sample-01.jpg ...
    python ./tools/prepare-art.py --from <raw dir> --auto
    python ./tools/prepare-art.py --report          # describe what is already in assets/

Why this exists rather than "just copy the files in":

* Phone-camera and screenshot sources are 3:4 or taller; the skins paint with
  `background-size: cover`, so the file that gets shipped is not the composition
  the browser ends up showing. Shrinking first means the browser is not decoding
  a 4000px JPEG to display a 1080px band.
* Harvested files carry EXIF orientation, alpha, and CMYK profiles. A JPEG that
  renders sideways, or a PNG with a transparent ground, would put a hole in the
  middle of the wallpaper.
* The panel footer reports byte sizes, so the shipped weight should be a
  deliberate number rather than whatever the source happened to be.

Output is always progressive JPEG at quality 86 — visually lossless at wallpaper
scale, and roughly a quarter the size of the PNGs it replaces.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from statistics import mean

try:
    from PIL import Image, ImageChops, ImageFilter, ImageOps
except ImportError:  # pragma: no cover - the bundled runtime always has Pillow
    print("Pillow is required (it ships with the DSH runtime)", file=sys.stderr)
    raise SystemExit(2)

HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parent
ASSETS = PACKAGE / "assets"
SERIES = ASSETS / "skins.json"

#: Long edge of the shipped file. Wide enough that a crop to a 4K wallpaper stays
#: sharp, small enough that four skins inlined into the bundle stay near 1 MB.
TARGET_LONG_EDGE = 1600

#: WebP rather than JPEG. These bytes are base64'd into the client bundle, so
#: every kilobyte is paid again on every page load. At matched quality WebP is
#: roughly a third smaller, and — unlike JPEG — it also carries the alpha channel
#: the cut-out skin needs, so one format covers both cases instead of two.
QUALITY = 84


def load_manifest() -> dict:
    """Read the skin manifest, which owns the file each skin expects."""
    with SERIES.open(encoding="utf-8") as handle:
        return json.load(handle)


def normalise(path: Path) -> Image.Image:
    """
    Open a harvested file as an upright, opaque, RGB image.

    EXIF orientation is applied first because a rotated source would otherwise
    be cropped on the wrong axis; alpha is flattened onto white rather than
    black, since a black ground behind a cut-out character reads as a hole.
    """
    image = Image.open(path)
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA", "P"):
        image = image.convert("RGBA")
        canvas = Image.new("RGB", image.size, (255, 255, 255))
        canvas.paste(image, mask=image.split()[-1])
        image = canvas
    elif image.mode != "RGB":
        image = image.convert("RGB")
    return image


def fit(image: Image.Image) -> Image.Image:
    """Downscale so the long edge is TARGET_LONG_EDGE; never upscale."""
    longest = max(image.size)
    if longest <= TARGET_LONG_EDGE:
        return image
    scale = TARGET_LONG_EDGE / longest
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.LANCZOS)


def describe(image: Image.Image) -> dict:
    """
    Summarise an image well enough to choose a veil strength without opening it.

    `mean_luma` decides whether a skin's light or dark veil will do the heavy
    lifting; `top_luma` and `bottom_luma` say where the busy half is, which is
    what the vertical crop anchor has to avoid.
    """
    small = image.resize((64, 64), Image.LANCZOS)
    grey = small.convert("L")
    # `tobytes()` rather than `getdata()`: row-major bytes for an "L" image, and
    # the accessor Pillow is steering callers towards.
    pixels = list(grey.tobytes())
    rows = [pixels[row * 64:(row + 1) * 64] for row in range(64)]
    return {
        "width": image.width,
        "height": image.height,
        "mean_luma": round(mean(pixels), 1),
        "top_luma": round(mean([value for row in rows[:16] for value in row]), 1),
        "bottom_luma": round(mean([value for row in rows[-16:] for value in row]), 1),
    }


def cutout(image: Image.Image, tolerance: int = 26, feather: int = 2) -> Image.Image:
    """
    Drop a flat near-white studio ground, returning RGBA.

    A full-body character on a white sheet is the best artwork a skin can get
    and the worst thing to paint with: laid over a tinted backdrop it becomes a
    visible white rectangle. Keying the ground out lets the character float on
    the skin's own colour instead.

    Deliberately conservative. Only pixels close to white go fully transparent;
    everything else keeps its alpha, and the boundary is softened over
    `feather` levels of luminance so the silhouette does not turn into a jagged
    staircase. A tolerance that is too generous eats white clothing, which is a
    far worse failure than a faint halo — so the default errs low.
    """
    rgba = image.convert("RGBA")
    red, green, blue, _ = rgba.split()
    # "Whiteness" is the darkest channel: a warm cream ground fails the test and
    # survives, which is what keeps off-white clothing intact.
    darkest = ImageChops.darker(ImageChops.darker(red, green), blue)
    alpha = darkest.point(lambda value: 0 if value >= 255 - tolerance else 255)
    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))
    rgba.putalpha(alpha)
    return rgba


def write_asset(image: Image.Image, target: Path) -> int:
    """Save one shipped asset as WebP and report its size. Alpha is preserved."""
    target = target.with_suffix(".webp")
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=QUALITY, method=6)
    return target.stat().st_size


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--from", dest="source", type=Path, help="directory holding the harvested pictures")
    parser.add_argument("--map", nargs="*", default=[], metavar="SKIN=FILE",
                        help="explicit assignment, e.g. studio=sample-01.jpg")
    parser.add_argument("--auto", action="store_true",
                        help="assign the harvested pictures to skins in manifest order")
    parser.add_argument("--cutout", nargs="*", default=[], metavar="SKIN",
                        help="key the near-white ground out of these skins' artwork (writes PNG)")
    parser.add_argument("--report", action="store_true", help="describe what assets/ currently holds")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    manifest = load_manifest()
    skins = manifest["skins"]

    if args.report or (args.source is None and not args.map):
        print(f"assets: {ASSETS}")
        for skin in skins:
            target = next((ASSETS / f"{skin['id']}{ext}" for ext in (".jpg", ".png")
                           if (ASSETS / f"{skin['id']}{ext}").exists()), None)
            if target is None:
                print(f"  {skin['id']:<8} {skin['name']:<6} - MISSING ({skin['id']}.jpg)")
                continue
            with Image.open(target) as image:
                info = describe(image.convert("RGB"))
                alpha = "alpha" if "A" in image.getbands() else "     "
            print(f"  {skin['id']:<8} {skin['name']:<6} "
                  f"{info['width']}x{info['height']} {alpha} {target.stat().st_size / 1024:6.0f} KB  "
                  f"luma {info['mean_luma']:5.1f} (top {info['top_luma']:5.1f} / bottom {info['bottom_luma']:5.1f})")
        return 0

    if args.source is None:
        print("--map needs --from <dir>", file=sys.stderr)
        return 2
    if not args.source.is_dir():
        print(f"not a directory: {args.source}", file=sys.stderr)
        return 2

    assignments: list[tuple[str, Path]] = []
    if args.map:
        for pair in args.map:
            if "=" not in pair:
                print(f"expected SKIN=FILE, got {pair!r}", file=sys.stderr)
                return 2
            skin_id, name = pair.split("=", 1)
            if skin_id not in {skin["id"] for skin in skins}:
                print(f"unknown skin {skin_id!r}", file=sys.stderr)
                return 2
            source = args.source / name
            if not source.is_file():
                print(f"missing source file: {source}", file=sys.stderr)
                return 2
            assignments.append((skin_id, source))
    else:
        candidates = sorted(
            path for path in args.source.iterdir()
            if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp"}
        )
        if len(candidates) < len(skins):
            print(f"--auto needs at least {len(skins)} pictures, found {len(candidates)}", file=sys.stderr)
            return 2
        assignments = [(skin["id"], path) for skin, path in zip(skins, candidates)]
        print(f"auto-assigned {len(assignments)} of {len(candidates)} candidates "
              f"(edit assets/skins.json order or use --map to override)")

    total = 0
    for skin_id, source in assignments:
        image = fit(normalise(source))
        keyed = skin_id in set(args.cutout)
        if keyed:
            image = cutout(image)
        info = describe(image.convert("RGB"))
        target = ASSETS / f"{skin_id}.jpg"
        if args.dry_run:
            print(f"  {skin_id:<8} <- {source.name}  {info['width']}x{info['height']}"
                  f"{'  [cutout]' if keyed else ''}")
            continue
        size = write_asset(image, target)
        total += size
        print(f"  {skin_id:<8} <- {source.name:<24} {info['width']}x{info['height']}  "
              f"{size / 1024:6.0f} KB  luma {info['mean_luma']:5.1f}{'  [cutout]' if keyed else ''}")

    if not args.dry_run:
        print(f"\nwrote {len(assignments)} assets, {total / 1024:.0f} KB total")
        print("next: node ./install.mjs   (the profile holds a copy, not a link)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
