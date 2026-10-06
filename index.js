/**
 * DeepSeek Harness skin plugin — host half.
 *
 * The browser cannot read a file from disk, so this half exists for one job:
 * expose any bundled artwork as same-origin HTTP resources. Everything
 * visual happens in ./client.js.
 *
 *   GET /deepseek-harness-skin/art/<skin>   the artwork bytes (revalidated by ETag)
 *   GET /deepseek-harness-skin/manifest.json  the skin list, with per-skin status
 *   GET /deepseek-harness-skin/status      JSON diagnostics for the panel footer
 *
 * This half succeeds on its own even when NO artwork file exists at all: the
 * routes then answer 404, the client falls back to "palette and texture", and
 * the panel footer names the exact directory to drop pictures into. A missing
 * picture is a degraded skin, never a broken one.
 */
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'deepseek-harness-skin'

/**
 * The Web server is a hard requirement, and it is declared rather than probed.
 *
 * The first revision read it with `ctx.get('webServer')` and returned quietly
 * when it was missing, on the theory that a skin should never hold the Web shell
 * pending. That theory cost the artwork entirely: the profile patch layer is
 * hot-reloaded, so every recomposition tears this row down and builds it again,
 * and on those rebuilds the service is not always reachable from the fresh
 * context yet. The row stayed composed — its browser half kept being served —
 * while its host route was simply never registered, so `art/<id>` answered 404
 * and the skin painted its palette with no character in it.
 *
 * Declaring the dependency is what makes activation wait for the service instead
 * of racing it. `apply` below still re-checks before registering, because a
 * self-healing route costs three lines and a silently dead one costs an evening.
 */
export const inject = ['webServer']

const ROUTE = '/deepseek-harness-skin'
const HERE = dirname(fileURLToPath(import.meta.url))
const ASSETS = join(HERE, 'assets')

/**
 * Bumped whenever this file changes, and reported by `/status`.
 *
 * It exists to answer one question that is otherwise unanswerable from outside:
 * a running DSH caches modules, so "did my edit to the host half take effect?"
 * has no observable answer. With this, `curl .../status | grep revision` does.
 */
const HOST_REVISION = 5

/** Extensions probed for a skin whose declared artwork file is absent. */
const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

/**
 * Resolve an image media type from the file's own magic bytes.
 *
 * The extension lookup alone is not enough: the Harness stores attachments
 * content-addressed and WITHOUT an extension, and a perfectly good PNG served
 * as `application/octet-stream` is a picture Chromium refuses to decode. People
 * point `config.json` at those files, so the bytes get the final say.
 * @param {Buffer} body - the file's bytes.
 * @returns {string | undefined} the media type, or undefined when unrecognised.
 */
function sniffMime(body) {
  if (body.length >= 12) {
    if (body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47) return 'image/png'
    if (body[0] === 0x47 && body[1] === 0x49 && body[2] === 0x46) return 'image/gif'
    if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return 'image/jpeg'
    if (body.toString('latin1', 0, 4) === 'RIFF' && body.toString('latin1', 8, 12) === 'WEBP') return 'image/webp'
    if (body.toString('latin1', 4, 8) === 'ftyp') {
      const brand = body.toString('latin1', 8, 12)
      if (brand === 'avif' || brand === 'avis') return 'image/avif'
    }
  }
  const head = body.toString('utf8', 0, 256).trimStart().toLowerCase()
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml'
  return undefined
}

/**
 * Read `config.json` beside this module.
 *
 * Deliberately re-read on every request rather than cached: pointing a skin at
 * a different picture is meant to be a one-file edit that takes effect on the
 * next page refresh, not a Host restart.
 * @returns {Promise<object>} the config, or an empty object.
 */
async function readConfig() {
  try {
    const parsed = JSON.parse(await readFile(join(HERE, 'config.json'), 'utf8'))
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Read the skin series manifest that ships with the package.
 * @returns {Promise<{ series: object, defaults: object, skins: object[] }>} the manifest.
 */
async function readSeries() {
  try {
    const parsed = JSON.parse(await readFile(join(ASSETS, 'skins.json'), 'utf8'))
    const skins = Array.isArray(parsed.skins) ? parsed.skins : []
    return { series: parsed.series ?? {}, defaults: parsed.defaults ?? {}, skins }
  } catch {
    return { series: {}, defaults: {}, skins: [] }
  }
}

/**
 * Where a skin's artwork may live, most specific first.
 *
 * The three tiers exist so that "ship a default, let the user override it"
 * needs no rebuild: config.json beats the environment, which beats the file
 * that ships in assets/.
 * @param {object} skin - one entry from skins.json.
 * @param {object} config - resolved config.json.
 * @returns {string[]} absolute paths to try, in order.
 */
function candidates(skin, config) {
  const list = []
  const push = (value) => {
    if (typeof value === 'string' && value.trim() !== '') {
      const absolute = resolve(value.trim())
      if (!list.includes(absolute)) list.push(absolute)
    }
  }

  const perSkin = config.art !== null && typeof config.art === 'object' ? config.art : {}
  push(perSkin[skin.id])
  push(process.env[`DSH_SKIN_ART_${skin.id.toUpperCase()}`])
  if (typeof config.artDir === 'string') push(join(config.artDir, skin.art))
  if (typeof process.env.DSH_SKIN_ART_DIR === 'string') {
    push(join(process.env.DSH_SKIN_ART_DIR, skin.art))
  }

  push(join(ASSETS, skin.art))

  // A drop-in replacement that keeps the id but not the extension is the most
  // common way to swap a picture, so the stem is probed across formats too.
  const stem = String(skin.art).replace(/\.[^.]+$/, '')
  for (const extension of EXTENSIONS) push(join(ASSETS, `${stem}${extension}`))
  for (const extension of EXTENSIONS) push(join(ASSETS, `${skin.id}${extension}`))

  return list
}

/** Loaded artwork, keyed by absolute path. */
const cache = new Map()

/**
 * Read one file, consulting the cache only when the bytes cannot have changed.
 *
 * The first revision cached by path and never looked again. That is correct
 * exactly once: after the picture on disk is replaced — which is the single most
 * likely thing a user does — the route keeps serving the OLD bytes until the
 * Host is restarted, and "replace the file and refresh" silently does nothing.
 * A `stat` per request is the whole cost of not having that bug.
 * @param {string} path - absolute path.
 * @returns {Promise<{ path: string, body: Buffer, mediaType: string, mtimeMs: number, size: number } | undefined>} the artwork.
 */
async function load(path) {
  try {
    const info = await stat(path)
    if (!info.isFile()) {
      cache.delete(path)
      return undefined
    }
    const cached = cache.get(path)
    if (cached !== undefined && cached.mtimeMs === info.mtimeMs && cached.size === info.size) {
      return cached
    }
    const body = await readFile(path)
    const entry = {
      path,
      body,
      // Bytes first, extension second: attachments have no extension at all.
      mediaType: sniffMime(body) ?? MIME[extname(path).toLowerCase()] ?? 'application/octet-stream',
      mtimeMs: info.mtimeMs,
      size: info.size,
    }
    cache.set(path, entry)
    return entry
  } catch {
    cache.delete(path)
    return undefined
  }
}

/**
 * Resolve one skin's artwork.
 * @param {object} skin - one entry from skins.json.
 * @param {object} config - resolved config.json.
 * @returns {Promise<{ entry: object | undefined, tried: string[] }>} the artwork and what was tried.
 */
async function resolveArt(skin, config) {
  const tried = candidates(skin, config)
  for (const path of tried) {
    const entry = await load(path)
    if (entry !== undefined) return { entry, tried }
  }
  return { entry: undefined, tried }
}

/**
 * Locate the running DSH runtime's version.
 *
 * The Host process is launched as `… <dsh root> <profile dir> …`, so the root is
 * on the command line. This is best-effort by design: the panel simply omits the
 * version line when it cannot be determined, and nothing else depends on it.
 * @returns {Promise<string | null>} the version, or null.
 */
async function detectDshVersion() {
  for (const argument of process.argv) {
    if (typeof argument !== 'string' || !/[\\/]dsh$/.test(argument)) continue
    try {
      const manifest = JSON.parse(await readFile(join(argument, 'package.json'), 'utf8'))
      if (typeof manifest.version === 'string') return manifest.version
    } catch {
      /* keep looking */
    }
  }
  return null
}

/**
 * Summarise what the client module system composed for this plugin.
 *
 * The browser half is only reachable through a `/plugins/??…&rev=…` URL whose
 * revision is a hash of file metadata, which makes "is my bundle actually being
 * served?" almost impossible to answer from outside. The registry that owns that
 * answer is a sibling service, so this half asks it directly. Read-only,
 * best-effort, and small: when the service is absent the report says so.
 * @param {import('@deepseek-ai/cordis').Context} ctx - host context.
 * @returns {object} a compact description of this entry's place in the graph.
 */
function describeClientGraph(ctx) {
  let registry
  try {
    registry = ctx.get('clientModules')
  } catch {
    registry = undefined
  }
  if (registry === undefined || typeof registry.graph !== 'function') {
    return { available: false, reason: 'clientModules service not reachable from this row' }
  }
  try {
    const graph = registry.graph()
    const rows = Array.isArray(graph) ? graph : (Array.isArray(graph?.entries) ? graph.entries : [])
    // The whole table, not just this package's row. "My entry is missing" and
    // "my entry is filed under a name I did not predict" are different problems
    // with different fixes, and only the full listing tells them apart.
    const listing = []
    for (const row of rows.slice(0, 60)) {
      if (row === null || typeof row !== 'object') continue
      listing.push({
        id: typeof row.id === 'string' ? row.id : null,
        name: typeof row.name === 'string' ? row.name : null,
      })
    }
    const mentionsUs = listing.filter((row) => JSON.stringify(row).includes('deepseek-harness-skin'))
    return {
      available: true,
      rows: rows.length,
      shape: Array.isArray(graph) ? 'array' : typeof graph,
      keys: rows[0] !== undefined && rows[0] !== null && typeof rows[0] === 'object'
        ? Object.keys(rows[0]).sort()
        : [],
      mentionsUs,
      listing,
    }
  } catch (error) {
    return { available: false, reason: String(error && error.message ? error.message : error) }
  }
}

/**
 * Host plugin body: publish the artwork routes when a Web server exists.
 * @param {import('@deepseek-ai/cordis').Context} ctx - host context.
 */
export function apply(ctx) {
  // One line of startup evidence: the only way to tell "the row never
  // activated" from "the browser half never loaded" without a log file.
  console.log('[deepseek-harness-skin] host half active', {
    route: `${ROUTE}/status`,
    webServer: ctx.get('webServer') !== undefined,
    assets: ASSETS,
  })

  ctx.effect(() => {
    let disposeRoute = () => {}
    let retry

    /**
     * Register the routes, once, if the service is reachable yet.
     * @returns {boolean} whether the route is now registered.
     */
    const bind = () => {
      const webServer = ctx.get('webServer')
      if (webServer === undefined || typeof webServer.register !== 'function') return false
      disposeRoute = webServer.register({
    kind: 'prefix',
    path: ROUTE,
    handler: async (req, res) => {
      const method = (req.method ?? 'GET').toUpperCase()
      if (method !== 'GET' && method !== 'HEAD') {
        res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' })
        res.end('method not allowed')
        return
      }

      const json = (status, payload) => {
        res.writeHead(status, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        })
        res.end(method === 'HEAD' ? undefined : JSON.stringify(payload))
      }
      const missing = (message) => {
        // Deliberately uncached: dropping the picture in place must work on the
        // next refresh, without restarting the Host.
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
        res.end(method === 'HEAD' ? undefined : message)
      }

      const pathname = decodeURIComponent((req.url ?? '/').split('?')[0])
      const config = await readConfig()
      const { series, skins } = await readSeries()

      if (pathname === `${ROUTE}/status` || pathname === `${ROUTE}/manifest.json`) {
        const resolved = []
        for (const skin of skins) {
          const { entry, tried } = await resolveArt(skin, config)
          resolved.push({
            id: skin.id,
            name: skin.name,
            found: entry !== undefined,
            bytes: entry?.body.length ?? 0,
            mediaType: entry?.mediaType ?? null,
            path: entry?.path ?? null,
            tried,
          })
        }
        json(200, {
          ok: true,
          hostRevision: HOST_REVISION,
          dshVersion: await detectDshVersion(),
          testedDsh: series.testedDsh ?? null,
          artDir: ASSETS,
          found: resolved.filter((item) => item.found).length,
          total: resolved.length,
          client: describeClientGraph(ctx),
          skins: resolved,
        })
        return
      }

      const artMatch = /^\/deepseek-harness-skin\/art\/([A-Za-z0-9_-]+)$/.exec(pathname)
      if (artMatch === null) {
        missing('not found')
        return
      }

      const skin = skins.find((entry) => entry.id === artMatch[1])
      if (skin === undefined) {
        missing(`unknown skin: ${artMatch[1]}`)
        return
      }

      const { entry, tried } = await resolveArt(skin, config)
      if (entry === undefined) {
        missing(`artwork not found for "${skin.id}". Tried:\n${tried.join('\n')}`)
        return
      }

      res.writeHead(200, {
        'content-type': entry.mediaType,
        'content-length': String(entry.body.length),
        'cache-control': 'no-cache',
        etag: `"${entry.body.length}-${Math.trunc(entry.mtimeMs)}"`,
      })
      res.end(method === 'HEAD' ? undefined : entry.body)
    },
      })
      return true
    }

    if (!bind()) {
      // Reached only if a hot recomposition built this row before the service
      // was reachable from its fresh context. Retrying beats staying dead: the
      // failure is otherwise completely silent — the row reads as active, the
      // browser half keeps loading, and only the pictures never arrive.
      retry = setInterval(() => {
        if (bind() && retry !== undefined) clearInterval(retry)
      }, 500)
    }

    return () => {
      if (retry !== undefined) clearInterval(retry)
      disposeRoute()
    }
  }, 'deepseek-harness-skin: artwork routes')
}
