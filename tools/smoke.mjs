/**
 * Execute the client half outside a browser.
 *
 *     node ./tools/smoke.mjs
 *
 * This is not a browser and does not pretend to be one: it is a DOM stub just
 * complete enough to materialize the bundle, run `apply()`, and drive the panel
 * the way a person would. That is enough to catch the failures that actually
 * happen in a hand-written client half — a misspelled identifier, a method that
 * does not exist, a node that is queried before it is built, a listener that
 * throws on the first click — none of which the Host half can detect, and all of
 * which would otherwise be discovered by the user staring at an unchanged UI.
 *
 * What it does NOT check: layout, colour, or anything about the cascade. Those
 * need a real engine and a real window.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const CLIENT = join(here, '..', 'client.js')

const failures = []
const checks = []

/**
 * Record one assertion.
 * @param {string} label - what was asserted.
 * @param {boolean} ok - the outcome.
 * @param {string} [detail] - extra context printed on failure.
 */
function check(label, ok, detail) {
  checks.push({ label, ok })
  if (!ok) failures.push(detail === undefined ? label : `${label} — ${detail}`)
}

/* ══════════════════════════ minimal DOM ══════════════════════════════════ */

/** Parse a selector subset: `tag`, `[attr]`, `[attr="v"]`, `tag[attr="v"]`. */
function parseSelector(selector) {
  const match = /^([a-zA-Z]*)(?:\[([a-zA-Z-]+)(?:=["']?([^"'\]]*)["']?)?\])?$/.exec(selector.trim())
  if (match === null) throw new Error(`smoke harness: unsupported selector ${selector}`)
  return { tag: match[1].toLowerCase(), attr: match[2], value: match[3] }
}

/** Parse the small HTML subset used by mountPanel into real stub nodes. */
function parseHTML(html) {
  const root = new StubElement('#fragment')
  const stack = [root]
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? []
  for (const token of tokens) {
    if (token.startsWith('</')) {
      stack.pop()
      continue
    }
    if (token.startsWith('<')) {
      const name = /^<([a-zA-Z0-9]+)/.exec(token)?.[1]
      if (name === undefined) continue
      const element = new StubElement(name)
      const attrs = token.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)
      for (const [, key, value] of attrs) element.setAttribute(key, value)
      stack[stack.length - 1].append(element)
      if (!token.endsWith('/>') && !['input', 'img', 'br'].includes(name.toLowerCase())) stack.push(element)
      continue
    }
    const text = token.trim()
    if (text !== '') stack[stack.length - 1].append(text)
  }
  return root
}

/** `data-role` -> `role`, and back again for camelCase keys. */
const dataKeyToAttribute = (key) => `data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
const attributeToDataKey = (name) => name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

class StubElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase()
    this.children = []
    this.parentElement = null
    this.attributes = new Map()
    this.listeners = new Map()
    this.hidden = false
    this.value = ''
    this.type = ''
    this.textContent = ''
    const self = this
    this.style = {
      setProperty(name, value) {
        self.attributes.set(`style:${name}`, value)
      },
      removeProperty(name) {
        self.attributes.delete(`style:${name}`)
      },
      getPropertyValue(name) {
        return self.attributes.get(`style:${name}`) ?? ''
      },
      get cssText() {
        return ''
      },
    }
    // A real `dataset` IS the data-* attributes, in both directions. Modelling it
    // as a plain object would let the harness pass code that a browser rejects,
    // which is the one thing a stub must never do.
    this.dataset = new Proxy({}, {
      get: (_, key) => self.getAttribute(dataKeyToAttribute(String(key))) ?? undefined,
      set: (_, key, value) => {
        self.setAttribute(dataKeyToAttribute(String(key)), value)
        return true
      },
      has: (_, key) => self.hasAttribute(dataKeyToAttribute(String(key))),
      deleteProperty: (_, key) => {
        self.removeAttribute(dataKeyToAttribute(String(key)))
        return true
      },
      ownKeys: () => [...self.attributes.keys()].filter((name) => name.startsWith('data-')),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    })
  }

  get id() {
    return this.attributes.get('id') ?? ''
  }

  set id(value) {
    this.attributes.set('id', value)
  }

  /**
   * Aggregate text the way the DOM does.
   *
   * A plain `textContent` field would only ever hold this element's own text, so
   * any assertion about rendered copy would silently see '' for content built
   * from child elements — and would therefore pass whatever it was asked.
   */
  get textContent() {
    let text = this._ownText ?? ''
    for (const child of this.children) {
      text += typeof child === 'string' ? child : child.textContent
    }
    return text
  }

  set textContent(value) {
    this._ownText = String(value)
    this.children = []
  }

  get innerHTML() {
    return ''
  }

  set innerHTML(html) {
    this.children = []
    for (const node of parseHTML(html).children) {
      node.parentElement = this
      this.children.push(node)
    }
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value))
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null
  }

  removeAttribute(name) {
    this.attributes.delete(name)
  }

  hasAttribute(name) {
    return this.attributes.has(name)
  }

  append(...nodes) {
    for (const node of nodes) {
      if (typeof node === 'string') {
        this._ownText = (this._ownText ?? '') + node
        continue
      }
      node.parentElement = this
      this.children.push(node)
    }
  }

  prepend(...nodes) {
    for (const node of nodes) {
      node.parentElement = this
      this.children.unshift(node)
    }
  }

  replaceChildren(...nodes) {
    this.children = []
    this.textContent = ''
    this.append(...nodes)
  }

  remove() {
    if (this.parentElement === null) return
    const index = this.parentElement.children.indexOf(this)
    if (index >= 0) this.parentElement.children.splice(index, 1)
    this.parentElement = null
  }

  contains(node) {
    if (node === this) return true
    return this.children.some((child) => child instanceof StubElement && child.contains(node))
  }

  closest(selector) {
    const want = parseSelector(selector)
    let node = this
    while (node instanceof StubElement) {
      if (node.matches(want)) return node
      node = node.parentElement
    }
    return null
  }

  matches(want) {
    if (want.tag !== '' && this.tagName.toLowerCase() !== want.tag) return false
    if (want.attr === undefined) return true
    const actual = this.getAttribute(want.attr)
    if (actual === null) return false
    return want.value === undefined || actual === want.value
  }

  descendants(out = []) {
    for (const child of this.children) {
      if (child instanceof StubElement) {
        out.push(child)
        child.descendants(out)
      }
    }
    return out
  }

  /** Geometry, faked: every stub is a full-viewport rectangle at the origin. */
  getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, left: 0, right: 1280, bottom: 800, width: 1280, height: 800 }
  }

  querySelectorAll(selector) {
    const want = parseSelector(selector)
    return this.descendants().filter((node) => node.matches(want))
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type).add(handler)
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler)
  }

  /** Fire a listener set, exactly as a browser would dispatch it. */
  fire(type, event = {}) {
    const payload = { type, target: this, preventDefault() {}, ...event }
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler(payload)
    return payload
  }

  click() { return this.fire('click') }
}

const documentElement = new StubElement('html')
const body = new StubElement('body')
const head = new StubElement('head')
documentElement.append(head, body)

const documentListeners = new Map()
const document = {
  documentElement,
  body,
  head,
  baseURI: 'http://127.0.0.1:19387/',
  activeElement: null,
  createElement: (tag) => new StubElement(tag),
  getElementById: (id) => documentElement.descendants().find((node) => node.id === id) ?? null,
  querySelector: (selector) => documentElement.querySelector(selector),
  querySelectorAll: (selector) => documentElement.querySelectorAll(selector),
  addEventListener(type, handler) {
    if (!documentListeners.has(type)) documentListeners.set(type, new Set())
    documentListeners.get(type).add(handler)
  },
  removeEventListener(type, handler) {
    documentListeners.get(type)?.delete(handler)
  },
}

const storage = new Map()
const windowListeners = new Map()
/** Which way the artwork probes settle. Set to 'missing' for the degraded path. */
let imageVerdict = 'ready'
/** What every `--dsw-*` probe resolves to. Mutated to simulate a palette flip. */
let computedToken = 'rgb(1, 2, 3)'
/** Every MutationObserver the bundle created, so mutations can be delivered. */
const observers = []
/** How many times the token layer was published to the theme service. */
let tokenPublishes = 0
const pictureRecords = new Map()
const blobUrls = new Map()
let blobSequence = 0
let failNextWrite = false
let failNextCommit = false
let rejectImageDecode = false
let holdImageLoads = false
const pendingImageLoads = []
let confirmResult = true
const fakeDatabase = {
  objectStoreNames: { contains: () => true },
  close() {},
  transaction(_name, mode) {
    // A request succeeding is not a committed write. Keep a transaction-local
    // view until oncomplete, including when a later commit fails.
    const draft = new Map(pictureRecords)
    let pending = 0
    let finished = false
    const tx = {
      objectStore: () => ({
        getAll: () => request(() => [...draft.values()]),
        put: (record) => request(() => { draft.set(record.id, record); return record.id }),
        delete: (id) => request(() => draft.delete(id)),
      }),
    }
    const abort = () => {
      finished = true
      tx.error = new Error('storage aborted')
      tx.onabort?.()
    }
    const request = (operation) => {
      const req = {}
      pending += 1
      queueMicrotask(() => {
        if (finished) return
        if (mode === 'readwrite' && failNextWrite) {
          failNextWrite = false
          abort()
          return
        }
        req.result = operation()
        req.onsuccess?.()
        pending -= 1
        queueMicrotask(() => {
          if (finished || pending > 0) return
          if (mode === 'readwrite' && failNextCommit) {
            failNextCommit = false
            abort()
            return
          }
          finished = true
          if (mode === 'readwrite') {
            pictureRecords.clear()
            for (const [id, record] of draft) pictureRecords.set(id, record)
          }
          tx.oncomplete?.()
        })
      })
      return req
    }
    return tx
  },
}
const window = {
  document,
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  indexedDB: {
    open() {
      const request = {}
      queueMicrotask(() => { request.result = fakeDatabase; request.onsuccess?.() })
      return request
    },
  },
  URL: {
    createObjectURL(blob) {
      const url = `blob:smoke-${++blobSequence}`
      blobUrls.set(url, blob)
      return url
    },
    revokeObjectURL: (url) => blobUrls.delete(url),
  },
  confirm: () => confirmResult,
  // A real cascade resolves these from the skin's palette. Reporting a value for
  // every `--dsw-*` probe is what exercises the token-mirroring path at all; a
  // stub that returned '' everywhere would silently skip it and still pass.
  getComputedStyle: () => ({ getPropertyValue: (name) => (name.startsWith('--dsw-') ? computedToken : '') }),
  innerWidth: 1280,
  innerHeight: 800,
  devicePixelRatio: 1,
  /** No layout in a stub, so the topmost element is simply the document body. */
  elementFromPoint: () => body,
  MutationObserver: class {
    constructor(callback) {
      this.callback = callback
      this.targets = []
      observers.push(this)
    }
    observe(target, options) {
      this.targets.push({ target, options })
    }
    disconnect() {
      this.targets = []
    }
    /** Deliver one attribute mutation, the way the engine would. */
    deliver(attributeName) {
      for (const { target, options } of this.targets) {
        const filter = options?.attributeFilter
        if (Array.isArray(filter) && !filter.includes(attributeName)) continue
        this.callback([{ type: 'attributes', attributeName, target }], this)
      }
    }
  },
  Image: class {
    naturalWidth = 501
    naturalHeight = 651
    set src(value) {
      this._src = value
      // Probes settle on a microtask, the way a real load does. The verdict is
      // switchable so the suite can drive BOTH the "artwork present" and the
      // "artwork missing" paths — testing only the one that is easiest to
      // simulate is how a skin that never painted its character passed 39 checks.
      queueMicrotask(() => {
        const finish = () => {
          if (!rejectImageDecode && (value.startsWith('blob:') || imageVerdict === 'ready')) this.onload?.()
          else this.onerror?.()
        }
        if (holdImageLoads) pendingImageLoads.push(finish)
        else finish()
      })
    }
  },
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  addEventListener(type, handler) {
    if (!windowListeners.has(type)) windowListeners.set(type, new Set())
    windowListeners.get(type).add(handler)
  },
  removeEventListener(type, handler) {
    windowListeners.get(type)?.delete(handler)
  },
  setTimeout,
  clearTimeout,
  location: { href: 'http://127.0.0.1:19387/' },
}

globalThis.window = window
globalThis.document = document
globalThis.MutationObserver = window.MutationObserver
globalThis.Image = window.Image
globalThis.getComputedStyle = window.getComputedStyle

/* ══════════════════════════ run the bundle ══════════════════════════════ */

let registration
window.__ModuleLoader__ = { load: (entry) => { registration = entry } }

const source = await readFile(CLIENT, 'utf8')
// eslint-disable-next-line no-new-func -- the point IS to execute the bundle
new Function('window', 'document', 'MutationObserver', 'Image', 'getComputedStyle', source)(
  window, document, window.MutationObserver, window.Image, window.getComputedStyle,
)

check('bundle registers a factory', registration !== undefined && typeof registration.factory === 'function')
check('bundle registers under the package id', registration?.id === 'deepseek-harness-skin', String(registration?.id))

const exportsObject = registration.factory(() => { throw new Error('unexpected require') })
check('factory exports apply()', typeof exportsObject.apply === 'function')
check('factory exports name', exportsObject.name === 'deepseek-harness-skin')

/* ── a context that behaves like the client one ─────────────────────────── */

const effects = []
let tokensPushed = null
let tokenReleases = 0
const activeTokenLayers = new Set()
const ctx = {
  get(serviceName) {
    if (serviceName === 'theme') {
      return {
        overrideTokens: (source_, tokens) => {
          tokensPushed = { source: source_, count: Object.keys(tokens).length }
          tokenPublishes += 1
          const layer = {}
          activeTokenLayers.add(layer)
          return () => {
            if (activeTokenLayers.delete(layer)) tokenReleases += 1
          }
        },
      }
    }
    return undefined
  },
  effect(callback) {
    effects.push(callback())
  },
}

const STORAGE_KEY = 'deepseek-harness-skin:state'
const ATTR = 'data-dsh-skin'
const settle = () => new Promise((resolve) => setTimeout(resolve, 15))
const stored = () => JSON.parse(storage.get(STORAGE_KEY) ?? '{}')
const art = () => documentElement.style.getPropertyValue('--skin-art')
const pluginVariables = (element) => [...element.attributes.keys()].filter((key) => key.startsWith('style:--skin-'))
const ownedMarkers = () => [...body.attributes.keys()].filter((key) => key === ATTR || key.startsWith('data-skin-'))
const untouchedOfficial = () => pluginVariables(body).length === 0 && pluginVariables(documentElement).length === 0
  && ownedMarkers().length === 0 && activeTokenLayers.size === 0
const layerIds = ['backdrop', 'art', 'veil', 'decor'].map((role) => `deepseek-harness-skin-${role}`)

// Deliberately give the host an official theme before the plugin starts. Going
// OFF must preserve it, including the host's own dark-mode attribute and token.
body.setAttribute('data-ds-dark-theme', '')
body.style.setProperty('--dsw-official-sentinel', '#123456')
documentElement.style.setProperty('color-scheme', 'dark')
const officialStylesSurvive = () => body.hasAttribute('data-ds-dark-theme')
  && body.style.getPropertyValue('--dsw-official-sentinel') === '#123456'
  && documentElement.style.getPropertyValue('color-scheme') === 'dark'

exportsObject.apply(ctx)
await settle()

check('one owned effect was registered', effects.length === 1)
check('the panel stylesheet is installed', head.children.length === 1 && head.children[0].textContent.length > 1000)
check('the first startup uses official appearance without publishing a token layer', untouchedOfficial() && tokenPublishes === 0)
check('the host official appearance is preserved', officialStylesSurvive())
check('a fresh catalog is persisted as version 2 with no default skins',
  stored().catalogVersion === 2 && stored().skin === 'off' && stored().customSkins.length === 0)
check('no bundled raster wallpaper remains in the client', !/data:image\/(?:png|jpeg|jpg|webp|avif);base64,/.test(source))
check('an inactive client publishes no wallpaper source', art() === '')

let dock = document.getElementById('deepseek-harness-skin-dock')
let handle = document.getElementById('deepseek-harness-skin-handle')
const cards = () => dock.querySelectorAll('[data-role="card"]')
const clickSkin = (id) => {
  const card = cards().find((item) => item.dataset.skin === id)
  if (!card) throw new Error(`Skin card not found: ${id}`)
  card.parentElement.fire('click', { target: card })
}
const input = (role) => dock.querySelector(`[data-role="${role}"]`)
const range = (key) => dock.querySelectorAll('input[type="range"]').find((item) => item.dataset.key === key)
const setRange = (key, value) => { const target = range(key); target.value = String(value); target.fire('input') }
const frame = (key, value) => {
  const target = dock.querySelectorAll('input[type="range"]').find((item) => item.dataset.frame === key)
  target.value = String(value)
  target.fire('input')
}
const imageSize = () => body.style.getPropertyValue('--skin-art-size').split(' ').map(parseFloat)
const centered = () => ['center', '50% 50%'].includes(body.style.getPropertyValue('--skin-art-position'))
const shortcut = (code) => {
  for (const handler of windowListeners.get('keydown') ?? []) {
    handler({ code, ctrlKey: true, altKey: true, preventDefault() {} })
  }
}
const chooseRegion = (id) => { input('region-select').value = id; input('region-select').fire('change') }
const setRegionColor = (color) => { input('region-color').value = color; input('region-color').fire('input') }
const setRegionOpacity = (value) => { input('region-opacity').value = String(value); input('region-opacity').fire('input') }
const file = (name, content = name, type = 'image/png') => Object.assign(new Blob([content], { type }), { name })
const firstFile = file('portrait.png', 'original portrait bytes')
const secondFile = file('other.png', 'another original picture')
const addSkin = async (name, color, picture) => {
  input('new-name').value = name
  input('new-color').value = color
  input('new-color').fire('input')
  input('add-skin').fire('click')
  input('new-file').files = [picture]
  input('new-file').fire('change')
  await settle()
}

check('only the official card is initially available', cards().length === 1 && cards()[0].dataset.skin === 'off')
check('the launcher remains an accessible black whale',
  handle?.getAttribute('aria-label') === '外观设置' && handle.querySelector('[data-role="label"]') === null
  && handle.querySelector('[data-role="whale"]')?.getAttribute('src')?.startsWith('data:image/svg+xml,'))
check('the panel starts collapsed', dock.dataset.open === 'false')
check('customization controls are hidden while official appearance is selected', input('controls').hidden === true)
check('users can add skins with a rainbow strip instead of a preset selector',
  input('add-skin') !== null && input('new-palette') === null && input('new-hue') !== null)
check('image strength is limited to 100 percent with one-percent steps',
  range('artOpacity').getAttribute('max') === '100' && range('artOpacity').getAttribute('step') === '1')
check('only picture opacity and shading effect controls remain',
  dock.querySelectorAll('input[type="range"]').filter((item) => item.dataset.key).length === 2
  && range('decor') === undefined && range('veil').getAttribute('step') === '1')

handle.fire('click')
check('opening the settings does not alter official appearance', dock.dataset.open === 'true' && untouchedOfficial())
input('sidebar-color').value = '#abcdef'
input('sidebar-color').fire('input')
chooseRegion('input')
setRegionColor('#abcdef')
frame('x', 80)
setRange('artOpacity', 75)
check('hidden customization events cannot paint official appearance', untouchedOfficial() && officialStylesSurvive())
setRange('artOpacity', 100)

const initialNewColor = input('new-color').value
input('new-hue').value = '120'
input('new-hue').fire('input')
check('the rainbow strip changes the new skin color', input('new-color').value !== initialNewColor)

failNextWrite = true
await addSkin('Custom <img>', '#d9748f', firstFile)
check('a failed image write adds neither a skin nor a saved picture', stored().customSkins.length === 0 && pictureRecords.size === 0)
check('a failed addition preserves official appearance and reports the error',
  untouchedOfficial() && input('message').dataset.tone === 'error' && input('add-skin').disabled === false)
check('failed additions release their decoded Blob URLs', blobUrls.size === 0)

failNextCommit = true
await addSkin('Custom <img>', '#d9748f', firstFile)
check('a successful request followed by an aborted commit still adds no skin',
  stored().customSkins.length === 0 && pictureRecords.size === 0 && blobUrls.size === 0 && untouchedOfficial())

rejectImageDecode = true
await addSkin('Bad picture', '#d9748f', file('broken.png'))
rejectImageDecode = false
check('an undecodable picture cannot create a skin', stored().customSkins.length === 0 && pictureRecords.size === 0 && blobUrls.size === 0)

await addSkin('Custom <img>', '#d9748f', firstFile)
const firstId = stored().customSkins[0]?.id
check('a committed addition creates and selects a user skin',
  firstId?.startsWith('custom-') && stored().skin === firstId && cards().length === 2)
check('the original uploaded Blob is stored without re-encoding', pictureRecords.get(firstId)?.blob === firstFile)
check('the active wallpaper points to that same original Blob',
  art().startsWith('url("blob:') && [...blobUrls].some(([url, blob]) => art() === `url("${url}")` && blob === firstFile))
check('the gallery renders a user-provided name as text',
  cards().find((card) => card.dataset.skin === firstId)?.querySelector('[data-role="name"]').textContent === 'Custom <img>'
  && cards().find((card) => card.dataset.skin === firstId)?.querySelector('img') === null)
check('the selected rainbow color belongs to the new skin', stored().sidebarColors[firstId] === '#d9748f' && body.style.getPropertyValue('--skin-sidebar-fill') === '#d9748f')
check('100 percent keeps the original picture filter and opacity',
  body.style.getPropertyValue('--skin-user-art') === '1' && body.style.getPropertyValue('--skin-art-filter') === 'none')
check('a new skin starts with no picture shading', body.style.getPropertyValue('--skin-user-veil') === '0')
check('new skins show the whole image centered at 100 percent',
  input('controls').hidden === false && dock.querySelector('[data-fit="contain"]').getAttribute('aria-pressed') === 'true'
  && centered() && stored().framing[firstId]?.zoom === 1)
const [fitWidth, fitHeight] = imageSize()
check('contain uses actual dimensions and preserves the portrait aspect ratio',
  fitWidth <= window.innerWidth && fitHeight === window.innerHeight && Math.abs(fitWidth / fitHeight - 501 / 651) < 0.00001,
  body.style.getPropertyValue('--skin-art-size'))
check('the skin publishes one namespaced theme layer', activeTokenLayers.size === 1 && tokensPushed?.source === 'deepseek-harness-skin' && tokensPushed.count > 0)
check('the current gallery thumbnail uses the uploaded image',
  cards().find((card) => card.dataset.skin === firstId)?.querySelector('[data-role="thumb"]').style.getPropertyValue('--skin-thumb') === art())

frame('zoom', 80)
frame('x', 80)
frame('y', 25)
check('moving and zooming adjusts the picture immediately', body.style.getPropertyValue('--skin-art-position') === '80% 25%' && imageSize()[1] === 640)
check('framing settings persist independently',
  stored().framing[firstId].fit === 'contain' && stored().framing[firstId].zoom === 0.8
  && stored().framing[firstId].x === 0.8 && stored().framing[firstId].y === 0.25)
window.innerHeight = 600
for (const handler of windowListeners.get('resize') ?? []) handler()
check('resizing recomputes fit and zoom', imageSize()[1] === 480)
window.innerHeight = 800
for (const handler of windowListeners.get('resize') ?? []) handler()

setRange('veil', 60)
check('shading updates its independent amount and readout',
  body.style.getPropertyValue('--skin-user-veil') === '0.6' && range('veil').parentElement.querySelector('[data-role="value"]').textContent === '60%')
setRange('veil', 0)
setRange('artOpacity', 75)
check('picture strength controls opacity without changing image colors',
  body.style.getPropertyValue('--skin-user-art') === '0.75' && body.style.getPropertyValue('--skin-art-filter') === 'none')
const visibleSource = art()
setRange('artOpacity', 0)
check('zero picture opacity keeps the saved original source', body.style.getPropertyValue('--skin-user-art') === '0' && art() === visibleSource)
setRange('artOpacity', 200)
check('even an out-of-range strength event is capped at original 100 percent',
  stored().artOpacity === 1 && body.style.getPropertyValue('--skin-user-art') === '1'
  && body.style.getPropertyValue('--skin-art-filter') === 'none' && range('artOpacity').parentElement.querySelector('[data-role="value"]').textContent === '100%')

input('sidebar-color').value = '#102030'
input('sidebar-color').fire('input')
check('sidebar colors choose readable text and save per skin',
  body.style.getPropertyValue('--skin-sidebar-fill') === '#102030' && body.style.getPropertyValue('--skin-sidebar-fg') === '#f5f7fa'
  && stored().sidebarColors[firstId] === '#102030')
input('sidebar-hex').value = '#fff4ee'
input('sidebar-hex').fire('change')
check('light sidebar colors choose dark text', body.style.getPropertyValue('--skin-sidebar-fg') === '#182028')
input('sidebar-hex').value = 'invalid'
input('sidebar-hex').fire('change')
check('invalid sidebar colors preserve the previous choice', body.style.getPropertyValue('--skin-sidebar-fill') === '#fff4ee')

check('eight additional interface regions remain independently selectable', input('region-select').querySelectorAll('option').length === 8)
chooseRegion('input')
setRegionColor('#102030')
setRegionOpacity(100)
check('an input color does not overwrite another region or the sidebar',
  body.style.getPropertyValue('--skin-region-input-fill') === 'rgba(16,32,48,1)'
  && body.style.getPropertyValue('--skin-region-input-fg') === '#f5f7fa'
  && !body.hasAttribute('data-skin-region-titlebar') && body.style.getPropertyValue('--skin-sidebar-fill') === '#fff4ee')
input('region-text').value = '#ffcc00'
input('region-text').fire('input')
check('region text can be selected independently', body.style.getPropertyValue('--skin-region-input-fg') === '#ffcc00')
input('region-auto-text').fire('click')
check('automatic region text contrast can be restored', body.style.getPropertyValue('--skin-region-input-fg') === '#f5f7fa')
input('region-hex').value = 'invalid'
input('region-hex').fire('change')
check('invalid regional colors preserve the saved setting', stored().regionColors[firstId].input.color === '#102030')
setRegionOpacity(0)
check('zero regional opacity is saved as zero', stored().regionColors[firstId].input.opacity === 0)
setRegionOpacity(80)
chooseRegion('titlebar')
setRegionColor('#ffeedd')
check('a second region keeps the first region unchanged',
  body.style.getPropertyValue('--skin-region-titlebar-fill') === 'rgba(255,238,221,1)'
  && body.style.getPropertyValue('--skin-region-input-fill') === 'rgba(16,32,48,0.8)')
input('reset-region').fire('click')
check('resetting one region keeps the other region settings', !body.hasAttribute('data-skin-region-titlebar') && body.hasAttribute('data-skin-region-input'))

await addSkin('Second skin', '#d1e7eb', secondFile)
const secondId = stored().customSkins[1]?.id
check('a second uploaded skin is added in the user creation order',
  secondId?.startsWith('custom-') && stored().skin === secondId && cards().length === 3 && pictureRecords.get(secondId)?.blob === secondFile)
check('new skins inherit neither framing nor region overrides from another skin', centered() && !body.hasAttribute('data-skin-region-input'))
frame('x', 30)
frame('y', 70)
clickSkin(firstId)
check('returning to a user skin restores its picture, framing, sidebar and regions',
  body.style.getPropertyValue('--skin-art-position') === '80% 25%' && imageSize()[1] === 640
  && body.style.getPropertyValue('--skin-sidebar-fill') === '#fff4ee'
  && body.style.getPropertyValue('--skin-region-input-fill') === 'rgba(16,32,48,0.8)')
input('reset-framing').fire('click')
check('reset framing returns to centered contain at 100 percent', centered() && stored().framing[firstId] === undefined)
check('reset framing preserves another skin framing', stored().framing[secondId].x === 0.3 && stored().framing[secondId].y === 0.7)
frame('zoom', 80)
frame('x', 80)
frame('y', 25)
input('reset-regions').fire('click')
check('resetting all regions preserves picture framing and workspace color',
  !body.hasAttribute('data-skin-region-input') && body.style.getPropertyValue('--skin-art-position') === '80% 25%'
  && body.style.getPropertyValue('--skin-sidebar-fill') === '#fff4ee')
chooseRegion('input')
setRegionColor('#102030')
setRegionOpacity(80)

const replacement = file('replacement.png', 'replacement original bytes')
input('replace-art').fire('click')
input('replace-file').files = [replacement]
const originalUrl = art()
const originalBlobCount = blobUrls.size
failNextCommit = true
input('replace-file').fire('change')
await settle()
check('an aborted replacement commit preserves the previous original Blob and wallpaper',
  art() === originalUrl && pictureRecords.get(firstId)?.blob === firstFile && blobUrls.size === originalBlobCount
  && input('message').dataset.tone === 'error' && input('replace-art').disabled === false)
input('replace-file').fire('change')
await settle()
check('a committed replacement switches the picture and its thumbnail',
  art() !== originalUrl && pictureRecords.get(firstId)?.blob === replacement
  && cards().find((card) => card.dataset.skin === firstId).querySelector('[data-role="thumb"]').style.getPropertyValue('--skin-thumb') === art())
check('replacement frees the old Blob URL and starts with whole-image framing',
  ![...blobUrls.keys()].some((url) => originalUrl === `url("${url}")`) && centered()
  && dock.querySelector('[data-fit="contain"]').getAttribute('aria-pressed') === 'true')
input('replace-file').files = [file('notes.txt', 'not an image', 'text/plain')]
const replacementUrl = art()
input('replace-file').fire('change')
await settle()
check('unsupported files cannot replace a saved picture', art() === replacementUrl && pictureRecords.get(firstId).blob === replacement)
frame('zoom', 80)
frame('x', 80)
frame('y', 25)

shortcut('Digit2')
check('Ctrl+Alt+2 selects the second user skin', stored().skin === secondId)
shortcut('Digit1')
check('Ctrl+Alt+1 selects the first user skin', stored().skin === firstId)
shortcut('Digit9')
check('a shortcut with no corresponding user skin leaves the selection intact', stored().skin === firstId)
const beforeOffPublishes = tokenPublishes
const beforeOffReleases = tokenReleases
shortcut('Digit0')
check('official appearance clears every owned marker and body/root variable', untouchedOfficial() && art() === '' && officialStylesSurvive())
check('official appearance releases the active theme override without publishing a new layer',
  tokenReleases > beforeOffReleases && tokenPublishes === beforeOffPublishes)
check('official appearance keeps only the skin metadata and uploaded originals',
  stored().skin === 'off' && stored().customSkins.length === 2 && pictureRecords.size === 2 && input('controls').hidden)
const darkObserver = observers.find((observer) => observer.targets.some((target) =>
  (target.options?.attributeFilter ?? []).includes('data-ds-dark-theme')))
check('the dark theme observer is registered', darkObserver !== undefined)
darkObserver?.deliver('data-ds-dark-theme')
await settle()
check('theme mutations while official stays off cannot publish a skin layer', tokenPublishes === beforeOffPublishes && untouchedOfficial())

shortcut('Digit1')
check('reenabling a user skin restores its original and one theme layer',
  art().startsWith('url("blob:') && activeTokenLayers.size === 1 && tokenPublishes === beforeOffPublishes + 1)
const beforeUnchanged = tokenPublishes
darkObserver?.deliver('data-ds-dark-theme')
await settle()
check('an unchanged skin palette does not republish tokens', tokenPublishes === beforeUnchanged)
computedToken = 'rgb(9, 9, 9)'
darkObserver?.deliver('data-ds-dark-theme')
await settle()
check('a real dark palette change republishes one replacement layer', tokenPublishes === beforeUnchanged + 1 && activeTokenLayers.size === 1)
const afterFlip = tokenPublishes
for (let index = 0; index < 5; index += 1) { darkObserver?.deliver('data-ds-dark-theme'); await settle() }
check('repeated identical dark mutations settle without a feedback loop', tokenPublishes === afterFlip)

const outside = new StubElement('div')
body.append(outside)
for (const handler of documentListeners.get('pointerdown') ?? []) handler({ target: outside })
check('an outside click closes the panel', dock.dataset.open === 'false')
shortcut('KeyQ')
check('Ctrl+Alt+Q opens the panel', dock.dataset.open === 'true')
for (const handler of documentListeners.get('keydown') ?? []) handler({ key: 'Escape' })
check('Escape closes the panel', dock.dataset.open === 'false')

const disposer = effects[0]
check('the client returns an owned disposer', typeof disposer === 'function')
disposer()
check('teardown restores official markers, styles and theme tokens', untouchedOfficial() && officialStylesSurvive())
check('teardown removes every picture layer and the dock', layerIds.every((id) => document.getElementById(id) === null) && document.getElementById('deepseek-harness-skin-dock') === null)
check('teardown removes the stylesheet, listeners and live Blob URLs',
  head.children.length === 0 && (windowListeners.get('resize')?.size ?? 0) === 0
  && (windowListeners.get('keydown')?.size ?? 0) === 0 && blobUrls.size === 0)

// Host artwork routes are intentionally unavailable: all user originals must be
// restored from local storage, with no baked-in default image as a fallback.
imageVerdict = 'missing'
let nextDisposer
const nextCtx = { ...ctx, effect: (callback) => { nextDisposer = callback() } }
exportsObject.apply(nextCtx)
await settle()
dock = document.getElementById('deepseek-harness-skin-dock')
handle = document.getElementById('deepseek-harness-skin-handle')
check('reload restores the selected uploaded original without a Host route',
  art().startsWith('url("blob:') && [...blobUrls].some(([url, blob]) => art() === `url("${url}")` && blob === replacement))
check('reload restores independent picture framing, colors and regions',
  body.style.getPropertyValue('--skin-art-position') === '80% 25%' && imageSize()[1] === 640
  && body.style.getPropertyValue('--skin-sidebar-fill') === '#fff4ee'
  && body.style.getPropertyValue('--skin-region-input-fill') === 'rgba(16,32,48,0.8)')
check('reload keeps original image colors at 100 percent', body.style.getPropertyValue('--skin-art-filter') === 'none' && body.style.getPropertyValue('--skin-user-art') === '1')
check('reload exposes only official plus saved user skins', cards().length === 3 && cards().slice(1).every((card) => card.dataset.skin.startsWith('custom-')))

clickSkin(secondId)
confirmResult = false
input('delete-skin').fire('click')
await settle()
check('canceling deletion leaves the skin and original intact', stored().skin === secondId && pictureRecords.has(secondId))
confirmResult = true
failNextCommit = true
input('delete-skin').fire('click')
await settle()
check('a failed deletion commit leaves metadata, picture and card intact', stored().customSkins.length === 2 && pictureRecords.has(secondId) && cards().length === 3)
input('delete-skin').fire('click')
await settle()
check('deleting a user skin removes its picture, metadata, settings and card',
  !pictureRecords.has(secondId) && stored().customSkins.length === 1 && cards().length === 2 && stored().framing[secondId] === undefined)
clickSkin(firstId)
input('delete-skin').fire('click')
await settle()
check('deleting the final skin returns to completely untouched official appearance',
  stored().skin === 'off' && stored().customSkins.length === 0 && pictureRecords.size === 0 && cards().length === 1
  && untouchedOfficial() && officialStylesSurvive() && blobUrls.size === 0)
nextDisposer()

// Simulate an older installation with stored built-ins and a legitimate user
// catalog. Migration must delete only those obsolete built-in records/settings.
const fixtureSkins = Array.from({ length: 9 }, (_, index) => ({ id: `custom-fixture-${index + 1}`, name: `Saved ${index + 1}`, palette: ['studio', 'neon', 'sakura', 'film'][index % 4] }))
for (const id of ['studio', 'neon', 'sakura', 'film']) pictureRecords.set(id, { id, name: `${id}.png`, blob: firstFile })
for (const skin of fixtureSkins) pictureRecords.set(skin.id, { id: skin.id, name: `${skin.id}.png`, blob: secondFile })
storage.set(STORAGE_KEY, JSON.stringify({
  skin: 'neon', artOpacity: 1.8, veil: 0, decor: 0,
  customSkins: [...fixtureSkins, { id: 'studio', name: 'Invalid preset', palette: 'studio' }, { id: 'custom-bad', name: 'Invalid palette', palette: 'missing' }],
  sidebarColors: { neon: '#112233', [fixtureSkins[0].id]: '#aabbcc', unknown: '#ffffff' },
  regionColors: {
    neon: { chat: { color: '#112233', opacity: 0.5 } },
    [fixtureSkins[0].id]: { input: { color: 'url(bad)', opacity: 0.5 }, code: { color: '#aabbcc', opacity: 9, text: 'bad' } },
    unknown: { chat: { color: '#ffffff', opacity: 1 } },
  },
  framing: {
    neon: { fit: 'cover', zoom: 0.8, x: 0.16, y: 0.16 },
    [fixtureSkins[0].id]: { fit: 'invalid', zoom: 99, x: -1, y: 'invalid' },
    unknown: { fit: 'contain' },
  },
}))
const beforeMigrationPublishes = tokenPublishes
exportsObject.apply(nextCtx)
await settle()
dock = document.getElementById('deepseek-harness-skin-dock')
handle = document.getElementById('deepseek-harness-skin-handle')
const migrated = stored()
check('an old built-in selection migrates to untouched official appearance', migrated.skin === 'off' && untouchedOfficial() && tokenPublishes === beforeMigrationPublishes)
check('migration persists the new catalog version and preserves the valid custom catalog', migrated.catalogVersion === 2 && migrated.customSkins.length === 9 && cards().length === 10)
check('migration deletes all four former built-in picture records only',
  ['studio', 'neon', 'sakura', 'film'].every((id) => !pictureRecords.has(id)) && fixtureSkins.every((skin) => pictureRecords.has(skin.id)) && pictureRecords.size === 9)
check('migration removes former built-in and unknown customization entries',
  migrated.framing.neon === undefined && migrated.sidebarColors.neon === undefined && migrated.regionColors.neon === undefined
  && migrated.framing.unknown === undefined && migrated.sidebarColors.unknown === undefined && migrated.regionColors.unknown === undefined)
check('migration clamps old exaggerated strength to original 100 percent and keeps zero shading', migrated.artOpacity === 1 && migrated.veil === 0)
check('migration preserves valid custom colors and sanitizes unsafe region values',
  migrated.sidebarColors[fixtureSkins[0].id] === '#aabbcc' && migrated.regionColors[fixtureSkins[0].id].input === undefined
  && migrated.regionColors[fixtureSkins[0].id].code.opacity === 1 && migrated.regionColors[fixtureSkins[0].id].code.text === null)

for (let index = 0; index < fixtureSkins.length; index += 1) {
  shortcut(`Digit${index + 1}`)
  check(`Ctrl+Alt+${index + 1} selects saved user skin ${index + 1}`, stored().skin === fixtureSkins[index].id)
}
shortcut('Digit1')
check('malformed custom framing is bounded against centered contain defaults',
  stored().framing[fixtureSkins[0].id].fit === 'contain' && stored().framing[fixtureSkins[0].id].zoom === 2
  && stored().framing[fixtureSkins[0].id].x === 0 && stored().framing[fixtureSkins[0].id].y === 0.5)
check('sanitized custom region colors remain usable after migration',
  !body.hasAttribute('data-skin-region-input') && body.style.getPropertyValue('--skin-region-code-fill') === 'rgba(170,187,204,1)')
shortcut('Digit0')
check('official appearance remains untouched after cycling every saved user skin', untouchedOfficial() && officialStylesSurvive())
nextDisposer()
check('final teardown releases every migrated Blob URL and token layer', blobUrls.size === 0 && activeTokenLayers.size === 0 && untouchedOfficial())

// Hot replacement can dispose an instance while IndexedDB image decoding and a
// theme refresh are still pending. Completing either callback must never revive
// the previous skin or leave an unowned image URL alive.
storage.set(STORAGE_KEY, JSON.stringify({ ...stored(), skin: fixtureSkins[0].id }))
holdImageLoads = true
exportsObject.apply(nextCtx)
await settle()
check('the delayed reload scenario has an unfinished local image decode', pendingImageLoads.length > 0)
const lateObserver = [...observers].reverse().find((observer) => observer.targets.some((target) =>
  (target.options?.attributeFilter ?? []).includes('data-ds-dark-theme')))
computedToken = 'rgb(19, 19, 19)'
lateObserver?.deliver('data-ds-dark-theme')
nextDisposer()
const afterLateDisposePublishes = tokenPublishes
holdImageLoads = false
for (const finish of pendingImageLoads.splice(0)) finish()
await settle()
check('late image and scheme callbacks cannot repaint a disposed skin instance',
  untouchedOfficial() && officialStylesSurvive() && head.children.length === 0
  && document.getElementById('deepseek-harness-skin-dock') === null && tokenPublishes === afterLateDisposePublishes)
check('a decode completing after disposal still releases its temporary Blob URL', blobUrls.size === 0)

/* ── report ─────────────────────────────────────────────────────────────── */
const passed = checks.filter((entry) => entry.ok).length
console.log(`smoke: ${passed}/${checks.length} checks passed`)
if (failures.length > 0) {
  console.error('\nFAILURES:')
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log('official appearance stays untouched; user originals, customization, migration and teardown pass')
