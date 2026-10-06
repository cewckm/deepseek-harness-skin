/**
 * Ask the running DSH what it is actually serving for this plugin's browser half.
 *
 *     node ./tools/probe-bundle.mjs                 # the desktop/web default
 *     node ./tools/probe-bundle.mjs --port 19387
 *     node ./tools/probe-bundle.mjs --id deepseek-harness-skin
 *
 * ── WHY THIS READS THE HMR CHANNEL ───────────────────────────────────────────
 *
 * The `/plugins` route addresses a bundle by a revision hash derived from file
 * metadata, so it cannot be reached from a hand-written URL. An earlier revision
 * of this tool recomputed that hash from `stat()` — and it does not work: the
 * advertised revision belongs to the *combo* the entry was batched into, not to
 * the file, and files inside `app.asar` have no usable `stat()` at all.
 *
 * The graph is already published: `@deepseek-ai/dsh-client-hmr` streams it over
 * Server-Sent Events at `/plugins/events`, which needs no authentication. Reading
 * it answers the only question worth asking — "is my browser half in the module
 * graph, and does the URL it advertises return my code?" — with the running
 * process's own answer rather than a reconstruction of it.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const PACKAGE = join(here, '..')

/**
 * Parse `--flag value` pairs.
 * @param {string[]} argv - arguments after the script name.
 * @returns {Record<string, string>} the parsed flags.
 */
function parseArgs(argv) {
  const flags = {}
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith('--')) continue
    const key = argv[index].slice(2)
    flags[key] = argv[index + 1]
    index += 1
  }
  return flags
}

/**
 * Read the SSE channel for a fixed window, then hang up.
 *
 * The stream is long-lived and mostly idle, so it is the abort — not end-of-body
 * — that terminates this loop.
 * @param {string} url - the events endpoint.
 * @param {number} milliseconds - how long to listen.
 * @returns {Promise<string>} everything received.
 */
async function readEvents(url, milliseconds) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), milliseconds)
  let text = ''
  let reader
  try {
    const response = await fetch(url, {
      headers: { accept: 'text/event-stream' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`)
    reader = response.body.getReader()
    const decoder = new TextDecoder()
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
  } catch (error) {
    if (error?.name !== 'AbortError') throw error
  } finally {
    clearTimeout(timer)
    // Releasing the reader before the process unwinds keeps libuv from tearing
    // down a handle the stream still owns, which on Windows aborts the process
    // with a UV assertion instead of a clean exit.
    await reader?.cancel().catch(() => {})
  }
  return text
}

const flags = parseArgs(process.argv.slice(2))
const port = flags.port ?? '19387'
const id = flags.id ?? 'deepseek-harness-skin'
const origin = `http://127.0.0.1:${port}`

const graph = await readEvents(`${origin}/plugins/events`, 3500)
if (graph === '') {
  console.error(`no frames from ${origin}/plugins/events — is DSH running on that port?`)
  process.exitCode = 2
} else {
  const entry = new RegExp(`\\{"id":"${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}","url":"([^"]+)","rev":"([^"]+)"`).exec(graph)
  if (entry === null) {
    console.error(`"${id}" is NOT in the live client module graph.`)
    console.error('The host row may not be active, or the package manifest may lack dsh.client.')
    const ids = [...new Set([...graph.matchAll(/"id":"([^"]+)"/g)].map((m) => m[1]))]
    console.error(`graph holds ${ids.length} entries, e.g. ${ids.slice(0, 6).join(', ')}`)
    process.exitCode = 1
  } else {
    const [, url, rev] = entry
    console.log(`graph entry : ${id}`)
    console.log(`revision    : ${rev}`)
    console.log(`bundle url  : ${origin}/${url}`)

    const response = await fetch(`${origin}/${url}`)
    const body = await response.text()
    console.log(`served      : HTTP ${response.status} ${response.headers.get('content-type')} ${body.length} bytes`)

    let authored
    try {
      authored = (await readFile(join(PACKAGE, 'client.js'), 'utf8')).trim()
    } catch {
      authored = undefined
    }

    const checks = [
      ['HTTP 200', response.status === 200],
      ['served as JavaScript', (response.headers.get('content-type') ?? '').includes('javascript')],
      ['served bytes are the authored client.js', authored === undefined ? false : body.includes(authored)],
      ['registers itself with the module loader', body.includes('__ModuleLoader__.load')],
    ]
    console.log('')
    for (const [label, ok] of checks) console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}`)
    if (!checks.every(([, ok]) => ok)) process.exitCode = 1
  }
}
