---
name: deepseek-harness-skin
description: Install, configure, repair or uninstall the deepseek-harness-skin plugin for DeepSeek Harness, and diagnose a missing whale launcher button, a wallpaper that does not appear, or CSS that did not take effect.
---

# deepseek-harness-skin

An unofficial community plugin that adds local wallpapers and per-region colours
to DeepSeek Harness. The official look is the default, it comes back pixel for
pixel, and every skin is created by the user from a picture on their machine —
the package bundles no skins and no artwork.

## Where it lives

- Package root: the checkout of `deepseek-harness-skin`. `package.json` has
  `main: index.js` (host half, registers the HTTP routes) and
  `exports["./client"]: client.js` (browser half, all the visuals).
- Installed copy: `<dsh home>/profiles/<profile>/node_modules/deepseek-harness-skin`,
  with the profile's `cordis.patch.yml` carrying the managed `- insert:` row.
- Profiles: `desktop` by default — managed by the Electron application, so the
  `dsh` CLI will not manage it — or another profile such as `web`. DSH home is
  `--home <dir>`, else `$DSH_HOME`, else `~/.dsh`.
- Requirements: Node.js `>=20`, `dsh >=0.2.0-rc.2 <0.3.0`.
- The panel's UI text is Chinese. `外观设置` is the panel title (Appearance
  settings) and `立绘浓度` is picture opacity; quote the labels as they are.
- The panel can be dragged by its `外观设置` title bar. The position lives in the
  same localStorage state key as `panelPosition: { x, y }`, is written only when
  the pointer is released and is clamped 8px inside the viewport; the whale
  launcher stays in its corner.

## Commands

Run all of them from the package root:

```powershell
node .\install.mjs                  # install into the desktop profile
node .\install.mjs --profile web    # install into another profile
node .\install.mjs --dry-run        # report the actions, change nothing
node .\install.mjs --uninstall      # remove the plugin
node .\build.mjs                    # rewrite the generated blocks in client.js
node .\build.mjs --check            # exit 1 when client.js is stale
node .\tools\smoke.mjs              # client-half checks in a DOM stub
node .\tools\probe-bundle.mjs       # ask the running DSH what it is serving
```

`install.mjs` copies the package into the profile's `node_modules` and appends a
managed `- insert:` block to that profile's `cordis.patch.yml`, keeping the
previous file as `cordis.patch.yml.bak`. Overwrite in place — never delete the
installed package directory while DSH is running, because the live process holds
that path for bundle revisions and module resolution.

`build.mjs` writes the generated blocks in `client.js` from `src/*.css`,
`assets/skins.json` and `assets/whale.svg`. `assets/skins.json` must keep an
empty skin catalogue and all four internal palettes (`studio`, `neon`, `sakura`,
`film`); the build fails otherwise.

## The two rules

1. **Installing or uninstalling needs no restart.** The profile patch layer is
   hot-reloaded, so a page refresh is enough. Editing `client.js` also only needs
   a refresh — after `node .\build.mjs` and `node .\install.mjs` whenever the
   change came from `src/*.css`, `assets/skins.json` or `assets/whale.svg`,
   because the profile copy is what DSH loads.
2. **Editing `index.js` (the host half) requires a DSH restart.** Node never
   re-reads a module it has already imported, and re-running `install.mjs` is not
   a substitute for the restart.

## Verify

```powershell
curl http://127.0.0.1:19387/deepseek-harness-skin/status
```

`19387` is the local DSH port; substitute whichever port the DSH web server
listens on. A JSON response proves the host half loaded. `hostRevision` in the
payload is bumped whenever `index.js` changes, so it answers "did my host edit
take effect?"; the payload also reports the artwork directory and the client
module graph. Bundled artwork appears under `/deepseek-harness-skin/art/<skin>`;
pictures the user uploaded never do, because they live in the browser.

`smoke.mjs` (131 checks) covers loading, panel interaction and dragging, a failed
save, persistence, the official look and teardown, but never the real CSS cascade
or window rendering — send Windows acceptance work to the real Electron window and
look at the official look, the wallpaper and the region transparency.

## Safety rules

- Uploaded pictures never leave the machine. Original bytes go to the page
  origin's IndexedDB database `deepseek-harness-skin:pictures`; names, colours
  and framing go to the localStorage key `deepseek-harness-skin:state`. Nothing
  is uploaded and no route serves user pictures.
- A skin is opt-in. Selecting the official look drops `<body data-dsh-skin>`,
  every `data-skin-region-*` marker, `data-skin-sidebar-custom`, the private
  `--skin-*` custom properties, the token layer, the caption injection and the
  runtime styles, so DSH's own background, region colours and theme tokens
  return unchanged.
- `--uninstall` removes the installed copy and strips the managed patch block.
  Follow it with a page refresh to return to the official look.
- The user's skins are their data: do not clear the IndexedDB database or the
  localStorage key to fix a rendering problem, and do not re-encode or replace
  an uploaded picture.
- The panel toggles with `Ctrl + Alt + Q` (`Cmd + Alt + Q` on macOS) and
  `Ctrl + Alt + 0` returns to the official look.
