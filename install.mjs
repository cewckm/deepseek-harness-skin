/**
 * Install (or uninstall) the DeepSeek Harness skin plugin into a DSH profile.
 *
 *     node ./install.mjs                                  # the desktop profile
 *     node ./install.mjs --profile web
 *     node ./install.mjs --home C:\Users\you\.dsh --profile desktop
 *     node ./install.mjs --uninstall
 *     node ./install.mjs --dry-run
 *
 * ── THREE THINGS THIS SCRIPT EXISTS TO GET RIGHT ─────────────────────────────
 *
 * 1. THE PATCH ENTRY MUST BE AN `insert`.
 *
 *    A profile's cordis.patch.yml is a list of *patches*, and the two kinds are
 *    not interchangeable:
 *
 *        - id: some-row          # OVERRIDES an existing row. When no row has
 *          config: {...}         # that id, the patch is skipped with a warning.
 *
 *        - insert:               # ADDS a row. `insert` with no outer id appends
 *            - id: some-row      # to the top-level entry list.
 *              name: some-pkg
 *
 *    Writing the first form to install a plugin looks like it works — the file
 *    is valid YAML, the package lands in node_modules, nothing errors — and the
 *    row is silently dropped, so the plugin never loads. That failure is
 *    invisible unless you already know to look for it.
 *
 * 2. THE PACKAGE MUST BE A REAL RESOLVABLE PACKAGE.
 *
 *    The loader resolves the row's `name` as a package specifier out of the
 *    profile directory, and only a package — with its own package.json carrying
 *    `dsh.client` and `exports["./client"]` — lets the client module system find
 *    the browser half. So this copies the package into the profile's
 *    node_modules rather than pointing a row at a loose file path.
 *
 *    The specifier must be the bare package name. A subpath (`pkg/sub`) resolves
 *    fine for Node but is not accepted for a Loader row, and the row simply
 *    never activates.
 *
 * 3. ARTWORK IS READ FROM THE CHECKOUT, NOT THE COPY.
 *
 *    `config.json` points the Host half at this folder's `assets/`, which is
 *    tried before the copy inside the profile. That makes "drop in a new
 *    picture, refresh the page" work with no reinstall — and it means a picture
 *    replaced here is picked up even by a Host that started before it existed.
 *    The copied assets stay as the fallback for when this folder is gone.
 *
 * The profile patch layer is hot-reloaded, so a running DSH picks up a newly
 * added or removed row without a restart. A page refresh is enough. Changes to
 * the *contents* of the host half are a different matter: Node never re-reads an
 * already-imported module, so those need a restart.
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const PKG = 'deepseek-harness-skin'
const ROW_ID = 'deepseek-harness-skin'

/**
 * Block delimiters.
 *
 * Deliberately pure ASCII. An earlier revision put an em dash in the opening
 * marker, and one round trip through a Windows console that read the file as
 * ANSI turned those bytes into mojibake — after which the marker no longer
 * matched, the old block was never stripped, and every install appended another
 * copy until the patch layer stopped parsing. A marker that cannot survive a bad
 * encoding is not a marker.
 */
const MARK_OPEN = `# >>> ${PKG} managed block - do not edit inside`
const MARK_CLOSE = `# <<< ${PKG}`

/** Copied into the profile. Source and tooling stay behind. */
const SHIPPED = ['package.json', 'index.js', 'client.js', 'assets', 'README.md']

/**
 * Parse `--flag value` pairs and bare `--flags`.
 * @param {string[]} argv - process arguments after the script name.
 * @returns {Record<string, string | boolean>} the parsed flags.
 */
function parseArgs(argv) {
  const flags = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[index + 1]
    if (next === undefined || next.startsWith('--')) flags[key] = true
    else {
      flags[key] = next
      index += 1
    }
  }
  return flags
}

const flags = parseArgs(process.argv.slice(2))
const home = typeof flags.home === 'string' ? flags.home : (process.env.DSH_HOME ?? join(homedir(), '.dsh'))
const profile = typeof flags.profile === 'string' ? flags.profile : 'desktop'
const profileDir = join(home, 'profiles', profile)
const patchPath = join(profileDir, 'cordis.patch.yml')
const target = join(profileDir, 'node_modules', PKG)
const dryRun = flags['dry-run'] === true

if (!existsSync(profileDir)) {
  console.error(`profile not found: ${profileDir}`)
  console.error('pass the right one with --profile <name>, or --home <dsh home>')
  process.exit(1)
}

/**
 * Strip this package's contribution out of a patch file.
 *
 * Two passes, because the first is not guaranteed to be there: the marker block
 * is the normal case, and the `- insert:` entry is the fallback for a file whose
 * markers were lost to an encoding mishap or a hand edit. Without the fallback,
 * a damaged marker turns every install into one more duplicate row.
 * @param {string} text - current file body.
 * @returns {string} the body without this package.
 */
function stripBlock(text) {
  let next = text
  for (;;) {
    const from = next.indexOf(MARK_OPEN)
    if (from < 0) break
    const to = next.indexOf(MARK_CLOSE, from)
    const after = to < 0 ? next.length : next.indexOf('\n', to)
    next = next.slice(0, from) + (after < 0 ? '' : next.slice(after + 1))
  }
  // An insert entry naming this row, with any run of indented lines under it.
  next = next.replace(
    new RegExp(`- insert:\\n(?:[ \\t]+- id: ${ROW_ID}\\n(?:[ \\t]+[^\\n]*\\n)*)+`, 'g'),
    '',
  )
  // Rows left behind by an earlier revision that stamped the entry id or the
  // module specifier; without this they linger as dead entries forever.
  next = next.replace(new RegExp(`- insert:\\n(?:[ \\t]+- id: ${ROW_ID}-\\d+\\n(?:[ \\t]+[^\\n]*\\n)*)+`, 'g'), '')
  return next.replace(/\n{3,}/g, '\n\n').trimEnd()
}

const existing = existsSync(patchPath)
  ? await readFile(patchPath, 'utf8')
  : '# Your patch layer for this dsh profile.\n[]\n'
const cleaned = stripBlock(existing.replace(/^\uFEFF/, ''))

if (flags.uninstall === true || flags.remove === true) {
  if (!dryRun) {
    await rm(target, { recursive: true, force: true })
    await writeFile(patchPath, `${cleaned}\n`, 'utf8')
  }
  console.log(`uninstalled ${PKG} from profile "${profile}"`)
  console.log(`  removed : ${target}`)
  console.log(`  patch   : ${patchPath}`)
  console.log('Refresh the page to return to the official look.')
  process.exit(0)
}

// ── 1. the package ──────────────────────────────────────────────────────────
if (!dryRun) {
  // NEVER unlink the package directory, even for the moment a copy takes.
  //
  // The running DSH holds this path: the client-modules registry stat-polls
  // `client.js` inside it to derive bundle revisions, and the Loader resolves the
  // row through it. Deleting the tree under a live process is enough to leave the
  // row composed but dead — the browser half stays in the module graph while the
  // host route starts answering 404, and the skin silently stops existing until
  // the row is removed and re-added. Overwriting in place has none of that.
  await mkdir(target, { recursive: true })
  for (const entry of SHIPPED) {
    const from = join(here, entry)
    if (!existsSync(from)) continue
    await cp(from, join(target, entry), { recursive: true })
  }
  // Files an earlier revision shipped and this one does not. Scoped to a pattern
  // only this package ever produced, so nothing else in the tree is at risk.
  for (const stale of await readdir(target)) {
    if (/^host(\.[0-9a-f]+)?\.js$/.test(stale)) await rm(join(target, stale), { force: true })
  }
  // Explicitly retired bundled artwork; preserve all user-created files.
  for (const stale of ['studio.webp', 'neon.webp', 'sakura.webp', 'film.webp']) {
    await rm(join(target, 'assets', stale), { force: true })
  }
  // The installed manifest must not claim files that were not copied.
  const manifest = JSON.parse(await readFile(join(here, 'package.json'), 'utf8'))
  delete manifest.dependencies
  delete manifest.devDependencies
  delete manifest.files
  manifest.private = true
  await writeFile(join(target, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

// ── 2. the artwork source of truth ──────────────────────────────────────────
// Points the Host half at this checkout's assets/ so a picture replaced here is
// live on the next refresh, without reinstalling and without restarting.
const artDir = join(here, 'assets')
if (!dryRun) {
  const config = {
    $comment: 'Written by install.mjs. artDir is tried before the copy inside the profile, so replacing a file here takes effect on the next page refresh. Delete this file to fall back to the profile copy.',
    artDir: artDir.split('\\').join('/'),
  }
  await writeFile(join(target, 'config.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

// ── 3. the patch row ────────────────────────────────────────────────────────
const block = [
  MARK_OPEN,
  '#',
  `# Authored in  ${here}`,
  `# Installed to ${target}`,
  '#',
  '# The row names the PACKAGE, not a file path: the loader resolves it out of',
  "# this profile's node_modules, and only a name lets the client module system",
  '# find the package manifest it needs for `dsh.client` / `exports["./client"]`.',
  '#',
  '# `insert:` is what makes this ADD a row. A bare `- id:` entry would only be an',
  '# override for an existing row, and would be skipped with a warning instead.',
  '#',
  '# Delete this block (or run `node install.mjs --uninstall`) to remove the skin.',
  '- insert:',
  `    - id: ${ROW_ID}`,
  `      name: ${PKG}`,
  MARK_CLOSE,
].join('\n')

let next
if (/^\s*\[\s*\]\s*$/m.test(cleaned)) {
  // The stock template is a bare empty array; leaving it in place would make the
  // document a scalar followed by a sequence, which YAML rejects outright.
  next = `${cleaned.replace(/^\s*\[\s*\]\s*$/m, '').trimEnd()}\n\n${block}\n`
} else {
  next = `${cleaned}\n\n${block}\n`
}

if (!dryRun) {
  await writeFile(`${patchPath}.bak`, existing, 'utf8')
  await writeFile(patchPath, next, 'utf8')
}

// ── 4. the report ───────────────────────────────────────────────────────────
console.log(`${dryRun ? '[dry run] would install' : 'installed'} ${PKG} into profile "${profile}"`)
console.log(`  package : ${target}`)
console.log(`  artwork : ${artDir}  (live source; the profile copy is the fallback)`)
console.log(`  patch   : ${patchPath}   (previous copy kept as cordis.patch.yml.bak)`)
console.log('')
console.log('The profile patch layer is hot-reloaded, so adding or removing the skin')
console.log('needs no restart. REFRESH the page, then open the whale button bottom-right.')
console.log('')
console.log('Verify the host half loaded, without opening the page:')
console.log(`  curl http://127.0.0.1:19387/${PKG}/status`)
console.log('')
console.log('Editing the host half (index.js) DOES need a DSH restart: Node never')
console.log('re-reads a module it has already imported. Editing client.js does not.')
