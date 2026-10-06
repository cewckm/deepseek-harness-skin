/**
 * Assemble client.js from styles, skin metadata, artwork and the launcher icon.
 *
 *     node ./build.mjs           rewrite the generated blocks
 *     node ./build.mjs --check   verify they are current, exit 1 if not
 *
 * ── WHY A BUILD STEP AT ALL ──────────────────────────────────────────────────
 *
 * The DSH client module system loads one browser artifact per package. A skin is
 * mostly CSS, and CSS written as a JS template literal is CSS nobody wants to
 * edit: no syntax highlighting, no linting, and every backtick or `${` a trap.
 *
 * So the stylesheets live in src/*.css as ordinary CSS, the skin list lives in
 * assets/skins.json as ordinary JSON, and this script pastes them into the four
 * marked blocks in client.js. Everything else in client.js is hand-written and
 * survives a rebuild untouched.
 *
 * `--check` exists so the drift is catchable: a repository whose client.js no
 * longer matches its sources is a repository where editing the CSS appears to
 * do nothing.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const CLIENT = join(here, 'client.js')
const SERIES_FILE = join(here, 'assets', 'skins.json')
const SHEETS = ['skins.css', 'panel.css']

const CSS_START = '/* @build:css:start */'
const CSS_END = '/* @build:css:end */'
const SERIES_START = '/* @build:series:start */'
const SERIES_END = '/* @build:series:end */'
const ART_START = '/* @build:art:start */'
const ART_END = '/* @build:art:end */'
const ICON_START = '/* @build:icon:start */'
const ICON_END = '/* @build:icon:end */'

/** Media types for the artwork formats the Host can serve. */
const ART_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

/**
 * Inline every skin's artwork as a data URL.
 *
 * The alternative — serving the pictures from a Host HTTP route — was the
 * single least reliable part of this plugin. It needs the route registered, the
 * page's carrier to forward to it, and that carrier's origin to line up; get any
 * of those wrong and the skin paints its palette perfectly with no character in
 * it, which is the hardest possible failure to notice.
 *
 * A data URL needs no route, no carrier, no origin and no network. It is also
 * the only form that works identically on `dsh-app://`, `http://` and `file://`.
 * User-uploaded images take priority; the Host route is only a fallback when
 * an image is absent from the bundle. Editing bundled assets needs a rebuild.
 * @param {object[]} skins - the manifest's skin entries.
 * @returns {Promise<string>} the JS object literal for the generated block.
 */
async function inlineArt(skins) {
  const entries = []
  for (const skin of skins) {
    let url
    try {
      const bytes = await readFile(join(here, 'assets', skin.art))
      const mime = ART_MIME[skin.art.slice(skin.art.lastIndexOf('.')).toLowerCase()] ?? 'application/octet-stream'
      url = `data:${mime};base64,${bytes.toString('base64')}`
    } catch {
      // A skin with no picture is a supported state, not a build failure.
      url = null
    }
    entries.push(`      ${JSON.stringify(skin.id)}: ${url === null ? 'null' : JSON.stringify(url)},`)
  }
  return entries.join('\n')
}

/**
 * Make arbitrary text safe to paste inside a JS template literal.
 *
 * Backslashes must be doubled FIRST: doing it after would also escape the
 * backslashes this function itself introduces for backticks and `${`.
 * @param {string} text - raw CSS.
 * @returns {string} escaped CSS.
 */
function escapeForTemplate(text) {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')
    // The CSS is authored with CRLF on Windows and LF elsewhere; normalising
    // keeps a rebuild from rewriting every line of client.js on the other OS.
    .replaceAll('\r\n', '\n')
}

/**
 * Replace everything between two markers, keeping the markers themselves.
 * @param {string} source - file body.
 * @param {string} start - opening marker.
 * @param {string} end - closing marker.
 * @param {string} body - replacement, placed on its own lines between them.
 * @returns {string} the rewritten body.
 */
function replaceBlock(source, start, end, body) {
  const from = source.indexOf(start)
  const to = source.indexOf(end)
  if (from < 0 || to < 0 || to < from) {
    throw new Error(`markers not found or out of order: ${start} … ${end}`)
  }
  // Whatever indentation the closing marker already carries is preserved, so a
  // hand-formatted client.js survives a rebuild byte for byte. Emitting a fixed
  // layout here instead would make every build rewrite those two lines.
  const lineStart = source.lastIndexOf('\n', to) + 1
  const indent = source.slice(lineStart, to)
  return `${source.slice(0, from + start.length)}\n${body}\n${indent}${source.slice(to)}`
}

/**
 * Structural check on the authored CSS.
 *
 * A single unbalanced brace does not degrade a stylesheet, it deletes the rest
 * of it — every rule after the mistake is swallowed as part of an invalid block.
 * The symptom is a skin that applies "mostly", which is far more confusing than
 * one that does not apply at all, so this fails the build instead.
 *
 * The undefined-variable pass is a warning rather than an error because several
 * of the `--skin-*` properties are legitimately written by client.js at runtime
 * (`--skin-user-*`) or inherit from an ancestor.
 * @param {string} css - the concatenated stylesheets.
 * @returns {{ defined: Set<string>, used: Set<string> }} the report.
 */
function validateCss(css) {
  let depth = 0
  let parens = 0
  let line = 1
  let quote = null
  let inComment = false
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index]
    const next = css[index + 1]
    if (char === '\n') line += 1
    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false
        index += 1
      }
      continue
    }
    if (quote !== null) {
      if (char === '\\') index += 1
      else if (char === quote) quote = null
      continue
    }
    if (char === '/' && next === '*') {
      inComment = true
      index += 1
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth < 0) throw new Error(`src css: unmatched "}" at line ${line}`)
    } else if (char === '(') parens += 1
    else if (char === ')') {
      parens -= 1
      if (parens < 0) throw new Error(`src css: unmatched ")" at line ${line}`)
    }
  }
  if (inComment) throw new Error('src css: unterminated /* comment')
  if (quote !== null) throw new Error(`src css: unterminated ${quote} string`)
  if (depth !== 0) throw new Error(`src css: ${depth} unclosed "{" block(s)`)
  if (parens !== 0) throw new Error(`src css: ${parens} unclosed "(" group(s)`)

  const defined = new Set([...css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((match) => match[1]))
  const used = new Set([...css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((match) => match[1]))
  return { defined, used }
}

/**
 * Build the generated blocks for the current sources.
 * @returns {Promise<{ css: string, series: string, bytes: { css: number, series: number }, warnings: string[] }>} the blocks.
 */
async function compose() {
  const parts = []
  for (const sheet of SHEETS) {
    const text = await readFile(join(here, 'src', sheet), 'utf8')
    parts.push(`/* ── src/${sheet} ${'─'.repeat(Math.max(0, 62 - sheet.length))} */\n${text.trimEnd()}`)
  }
  const cssText = parts.join('\n\n')

  const { defined, used } = validateCss(cssText)
  // Set at runtime by client.js, or inherited from an ancestor, so "undefined"
  // here is expected rather than suspicious.
  const runtime = new Set([
    '--skin-user-art',
    '--skin-user-surface',
    '--skin-user-veil',
    '--skin-user-decor',
    '--skin-art',
    '--skin-art-size',
    '--skin-art-position',
    '--skin-art-filter',
    '--skin-thumb',
    '--skin-hue-thumb',
    '--skin-sidebar-fill', '--skin-sidebar-fg', '--skin-sidebar-muted',
    '--skin-sidebar-hover', '--skin-sidebar-active', '--skin-sidebar-button',
    '--skin-default-fg', '--skin-default-muted',
    ...['titlebar', 'header', 'chat', 'bubble', 'code', 'input', 'rightbar', 'menu']
      .flatMap((region) => ['fill', 'fg', 'muted'].map((suffix) => `--skin-region-${region}-${suffix}`)),
  ])
  const warnings = [...used]
    .filter((name) => !defined.has(name) && !runtime.has(name))
    .map((name) => `${name} is read but never defined in src/`)

  const rawSeries = await readFile(SERIES_FILE, 'utf8')
  const series = JSON.parse(rawSeries)
  if (!Array.isArray(series.skins) || series.skins.length !== 0) {
    throw new Error('assets/skins.json must have an empty skin catalog; users add their own pictures')
  }
  if (series.defaults?.skin !== 'off' || !Array.isArray(series.palettes) || !series.palettes.length) {
    throw new Error('assets/skins.json must default to off and provide internal palettes')
  }
  const paletteIds = new Set()
  for (const palette of series.palettes) {
    if (!['studio', 'neon', 'sakura', 'film'].includes(palette.id) || paletteIds.has(palette.id)
      || !/^#[0-9a-f]{6}$/i.test(palette.accent ?? '')) {
      throw new Error('assets/skins.json: invalid internal palette')
    }
    paletteIds.add(palette.id)
  }
  if (paletteIds.size !== 4) {
    throw new Error('Keep all four internal palettes so existing user skins retain their styling')
  }
  const ids = new Set()
  for (const skin of series.skins) {
    for (const field of ['id', 'name', 'tagline', 'art']) {
      if (typeof skin[field] !== 'string' || skin[field].trim() === '') {
        throw new Error(`assets/skins.json: skin ${JSON.stringify(skin.id ?? '?')} is missing "${field}"`)
      }
    }
    if (ids.has(skin.id)) throw new Error(`assets/skins.json: duplicate skin id "${skin.id}"`)
    ids.add(skin.id)
  }

  const art = await inlineArt(series.skins)
  const artBytes = art.length
  const whale = await readFile(join(here, 'assets', 'whale.svg'), 'utf8')

  return {
    // The bodies deliberately exclude the markers: replaceBlock keeps those, and
    // a body that re-emitted them would duplicate them on every run.
    css: `    const CSS = \`\n${escapeForTemplate(cssText)}\n\``,
    series: `    const SERIES = ${JSON.stringify(series, null, 2).replaceAll('\n', '\n    ')}`,
    art: `    const INLINE_ART = {\n${art}\n    }`,
    icon: `    const WHALE_ICON = ${JSON.stringify(`data:image/svg+xml,${encodeURIComponent(whale.trim())}`)}`,
    bytes: { css: cssText.length, series: rawSeries.length, art: artBytes },
    warnings,
  }
}

const check = process.argv.includes('--check')
const source = await readFile(CLIENT, 'utf8')

let blocks
try {
  blocks = await compose()
} catch (error) {
  // A malformed stylesheet is a build error, not a crash: the message is the
  // whole value here, and a stack trace buries it.
  console.error(`build failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

for (const warning of blocks.warnings) console.warn(`warning: ${warning}`)

// The block bodies are rebuilt from scratch, so the markers must be located in
// the ORIGINAL source before any replacement shifts the text.
let next = replaceBlock(source, CSS_START, CSS_END, blocks.css)
next = replaceBlock(next, SERIES_START, SERIES_END, blocks.series)
next = replaceBlock(next, ART_START, ART_END, blocks.art)
next = replaceBlock(next, ICON_START, ICON_END, blocks.icon)

const summary = `css ${blocks.bytes.css} B, series ${blocks.bytes.series} B, art ${(blocks.bytes.art / 1024).toFixed(0)} KB`

if (check) {
  if (next === source) {
    console.log(`up to date — ${summary}`)
    process.exit(0)
  }
  console.error('client.js is STALE: src/*.css, assets/skins.json or assets/*.{jpg,png} changed. Run: node ./build.mjs')
  process.exit(1)
}

if (next === source) {
  console.log(`already up to date — ${summary}`)
  process.exit(0)
}

await writeFile(CLIENT, next, 'utf8')
console.log(`wrote client.js — ${summary}`)
