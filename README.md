# deepseek-harness-skin

Local wallpapers and per-region colours for DeepSeek Harness. The black whale in
the bottom-right corner opens the panel; colour, picture and framing changes take
effect immediately.

Drag the panel by its `外观设置` (Appearance settings) title bar to move it out of
the way. The position is saved on the machine when you let go, and the panel
reopens where you left it; it stays inside the visible window when the window or
the panel changes size. The whale keeps its corner, and the close button, the
colour strip and the other controls keep working while you drag.

The official look is the default. Selecting it keeps DSH's own background, region
colours and theme tokens — wallpaper, dimming and region overrides are all off,
and only the settings entry point remains. The official look comes back pixel for
pixel, and so does uninstalling.

The package bundles **no skins and no artwork**: every skin in the gallery is one
you create from a picture on your machine.

This is an unofficial community plugin. It is not affiliated with, endorsed by or
supported by DeepSeek.

- Repository: <https://github.com/cewckm/deepseek-harness-skin>
- Package and plugin id: `deepseek-harness-skin`
- License: MIT

## Requirements

| Requirement | Version |
|---|---|
| DeepSeek Harness | `>=0.2.0-rc.2 <0.3.0` (the `dsh` field of `engines` in `package.json`) |
| Node.js | `>=20` |

Install into the `desktop` profile, which the Electron application manages, or
into another profile such as `web`.

## Install

```powershell
git clone https://github.com/cewckm/deepseek-harness-skin
cd deepseek-harness-skin
node .\install.mjs
```

The installer defaults to the `desktop` profile. Refresh the page afterwards,
then click the black whale in the bottom-right corner to open the panel.

```powershell
node .\install.mjs --profile web    # install into another profile
node .\install.mjs --dry-run        # report what would be done, change nothing
node .\install.mjs --uninstall      # remove the plugin
```

`--home` picks the DSH home directory the profile lives in; it defaults to
`$DSH_HOME`, or to `~/.dsh` when that is unset.

The `desktop` profile is managed by the Electron application, so the `dsh` CLI
will not manage it. The installer therefore does the work itself: it copies the
package into the profile's `node_modules`, then appends a managed block to the
profile's `cordis.patch.yml` holding the `- insert:` entry that adds the row, and
keeps the previous patch file as `cordis.patch.yml.bak`. The entry must be an
`insert`: a patch with a bare `- id:` and no `insert` is an *override* for a row
that already exists, so it would be skipped with a warning and install nothing.

For a `web` profile you installed with `dsh plugin --profile web add`, you can
instead add `deepseek-harness-skin` to `dsh.profile.bundles` in that profile's
`package.json`; the launcher then applies this package's `cordis.patch.yml`
itself.

The profile patch layer is hot-reloaded, so adding or removing the row needs no
restart — a page refresh is enough.

## Check that the host half is loaded

```powershell
curl http://127.0.0.1:19387/deepseek-harness-skin/status
```

`19387` is the local DSH port; use whichever port your DSH web server listens on.
A JSON response means the host half is loaded. Among other things it reports
`hostRevision` (bumped whenever `index.js` changes, which is how you tell whether
an edit to the host half is live), the artwork directory and the client module
graph.

Pictures you upload are stored in the browser, so they never appear in the host's
list of artwork resources.

## Create and manage skins

1. Click `＋ 添加皮肤` (Add skin) and give the skin a name (`皮肤名称`).
2. Pick a colour on the strip (`皮肤颜色`), or use the colour picker, or type an
   exact colour as `#RRGGBB`.
3. Click `选择图片并添加` (Choose a picture and add) and choose a picture from
   your machine. PNG, JPEG, WebP, AVIF and GIF are supported.

A new picture starts as contain (whole picture), centred, at 100% zoom. From
there you can click `上传图片替换` (Upload a picture to replace) to swap the
picture, or add more skins — each one keeps its own picture, colours and framing.
Deleting the current skin with `删除皮肤` (Delete skin) returns to the official
look; selecting the official look never deletes the skins you created.

## Colour settings

| Setting | What it does |
|---|---|
| Workspace colour (`工作区颜色`) | Adjusts the left-hand workspace colour on its own; text switches between light and dark to stay readable. Saved per skin. |
| Region colours (`区域颜色`) | Adjusts the window title bar, the conversation header, the chat background, the message bubble, the code block, the message composer, the right-hand tool panel, and menus and dialogs separately. Colour strip, colour picker and hex input are all available. |
| Colour strength (`颜色浓度`) | 0% is transparent, 100% is the solid colour, in 1% steps. Lower it to let the wallpaper show through. |
| Text colour (`文字颜色`) | Chooses light or dark automatically, or takes a manual colour; `自动` (Auto) restores the automatic text colour. |
| `恢复当前区域` (Reset this region) / `恢复本皮肤所有区域颜色` (Reset every region colour for this skin) | Clears the region overrides and keeps the picture, the framing, the workspace colour and the picture effects. |

Automatic text colour over a semi-transparent background is estimated from the
background and the dimming layer, so a busy wallpaper may need a manual text
colour. Setting a custom text colour for the code block unifies the code text and
the block banner text. Region settings describe the DSH shell: embedded pages,
terminals and system file pickers keep their own colours.

## Picture placement and effects

| Setting | What it does |
|---|---|
| Cover (`铺满屏幕`) / Contain (`完整显示`) | Cover may crop the edges; contain keeps the whole picture. |
| Picture zoom (`图片缩放`) | Scales 50%–200% on top of the fitted size; switching the fit mode returns to 100%. |
| Horizontal position (`横向位置`) / Vertical position (`纵向位置`) | Moves the picture's alignment inside the window. A direction with no crop and no slack does not move, so zoom in or switch to contain first. |
| Reset placement (`还原位置`) | Returns the current skin to contain, centred, 100%. |
| Picture opacity (`立绘浓度`) | Ordinary opacity only, 0%–100%. 0% hides the picture, 100% paints the uploaded bytes; the filter stays `none` and never boosts contrast, saturation or brightness. |
| Backdrop dimming (`画面压暗`) | A separate black veil: 0% dims nothing, 100% is nearly black. It defaults to 0% and does not change picture opacity. |

Both effect sliders step in 1%. A picture opacity above 100% saved by an older
revision is clamped to 100%. Even at 100% picture opacity, a custom region
background or the dimming layer can still cover the picture — set backdrop
dimming to 0% to see the original colours.

## Local storage, privacy and shortcuts

Original image bytes are kept in the IndexedDB database
`deepseek-harness-skin:pictures`, under the origin the DSH page is served from.
Skin names, colours, framing and the panel position are kept in the localStorage
key `deepseek-harness-skin:state`. Both survive a refresh or a restart and nothing is
uploaded to a server. Storage is per browser, per profile and per origin, so two
setups do not share skins, and clearing that origin's site data clears the custom
content. A failed upload keeps the previous picture.

| Action | Shortcut |
|---|---|
| Toggle the panel | `Ctrl + Alt + Q` (`Cmd + Alt + Q` on macOS) |
| Return to the official look | `Ctrl + Alt + 0` |
| Collapse the panel | `Esc`, or click outside the panel |

## How the look is applied

The client half marks `<body data-dsh-skin="<skin>">`, adds one
`data-skin-region-*` marker per overridden region and `data-skin-sidebar-custom`
for a custom workspace colour, and publishes its private `--skin-*` custom
properties. Everything the skin paints hangs off those markers and properties,
which is why dropping them restores the official UI exactly. Selecting the
official look and uninstalling both clear this plugin's token layer, its caption
injection and its runtime styles; the picture layers stay hidden while the
official look is selected.

## Development and verification

```powershell
node .\build.mjs
node .\build.mjs --check
node .\tools\smoke.mjs
node .\tools\probe-bundle.mjs
node .\install.mjs
```

`client.js` carries generated blocks written by `build.mjs` from `src/*.css`,
`assets/skins.json` and `assets/whale.svg`; everything else in `client.js` is
hand-written and survives a rebuild. `build.mjs --check` fails when `client.js`
no longer matches those sources, which is the state in which editing the CSS
appears to do nothing. Day-to-day uploading, colour picking and framing need no
build.

`tools/smoke.mjs` drives the client half in a DOM stub (131 checks) and checks
that it loads, that the panel can be interacted with and dragged — a
secondary-button drag, a lost pointer capture, a cancelled drag and an
out-of-range saved position included — that a failed save adds neither a skin nor
a picture, that settings persist across a reload, that the official look stays
untouched and that teardown removes what the plugin added. It does not check the
real CSS cascade or window rendering, so a Windows acceptance run uses the real
Electron window and looks at the official look, the wallpaper and the region
transparency. `tools/probe-bundle.mjs` asks the running DSH's HMR module graph
whether the browser half is loaded; it accepts `--port` and `--id`.

After changing CSS or client-side logic, run `build.mjs`, then `install.mjs`,
then refresh the page. **Editing `index.js` (the host half) requires a DSH
restart instead**: Node never re-reads a module it has already imported, and
re-installing is not a substitute for the restart.

`assets/skins.json` must keep an empty skin catalogue — the build fails
otherwise, and it also fails if any of the four internal palettes (`studio`,
`neon`, `sakura`, `film`) is missing, because skins users already created inherit
them. After a DSH update, re-check the window structure, the region markers and
the theme-service compatibility.

## Troubleshooting

| Symptom | What to do |
|---|---|
| No whale button | Refresh the page, then check `/deepseek-harness-skin/status` and which profile the plugin was installed into. |
| The picture is not visible | Make sure one of your skins is selected, then check picture opacity, backdrop dimming, the region colour strength and the picture placement; start from contain at 100%. |
| Text is hard to read | Adjust the colour strength or the text colour of the region, and add a little backdrop dimming if needed. |
| Upload fails | Use a picture that opens normally and check that IndexedDB is writable for this page; the previous picture is kept. |
| A CSS change does not take effect | Run `build.mjs`, then `install.mjs`, then refresh the page. |
| A host change does not take effect | Restart DSH. |
| Back to the official look | Select `官方外观` (Official look) in the panel, or press `Ctrl + Alt + 0`. |

## License

MIT — see [LICENSE](LICENSE). You choose which pictures to upload.
