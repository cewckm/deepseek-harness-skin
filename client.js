/**
 * DeepSeek Harness skin plugin — client half.
 *
 * A lazy-CJS factory, the bundle format the DSH client module system loads.
 * Executing this file only REGISTERS the factory; everything below runs at
 * materialization, which is where every side effect belongs.
 *
 * ── WHAT IT DOES ─────────────────────────────────────────────────────────────
 *   1. inserts one owned stylesheet (four palettes, injected at build time);
 *   2. paints four fixed, click-through layers below the shell root:
 *      backdrop wash, artwork, legibility veil, atmosphere;
 *   3. marks <body data-dsh-skin="<skin>"> — the single attribute every
 *      rule hangs off, so dropping it restores the official UI exactly;
 *   4. stacks the same token values a second time through `theme.overrideTokens`
 *      (see pushTokens for why the belt has braces);
 *   5. mounts the gallery panel — a self-drawn surface, not a shell slot;
 *   6. wires a keyboard shortcut, outside-click dismissal and Esc.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ─────────────────────────────────────────
 *   No shell class name is referenced, no shell node is queried or observed.
 *   The only elements touched are `documentElement`, `body`, and nodes this
 *   plugin created. A future layout change therefore degrades the skin to
 *   "palette and wallpaper" instead of breaking the shell.
 *
 * The four generated blocks marked `@build:` contain CSS, skin metadata,
 * bundled artwork and the whale icon. Edit their source files and rebuild;
 * runtime functions outside those blocks are maintained directly here.
 */

window.__ModuleLoader__.load({
  id: 'deepseek-harness-skin',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    /* ── identity ─────────────────────────────────────────────────────────── */

    /** Package identity: module id, body attribute stem, DOM id stem, route. */
    const ID = 'deepseek-harness-skin'
    /** The <body> attribute the whole stylesheet hangs off. */
    const ATTR = 'data-dsh-skin'
    /** Same-origin route the Host half serves artwork and diagnostics on. */
    const ROUTE = `/${ID}`
    /** This plugin's own persistence key. */
    const STORAGE_KEY = `${ID}:state`
    /** The id that means "no skin" — the official look. */
    const OFF = 'off'

    /* @build:series:start */
    const SERIES = {
      "$comment": "No bundled skins or artwork. Palettes are internal styling foundations for user-created skins, never gallery entries. Uploaded original image bytes live only in the user's IndexedDB.",
      "series": {
        "id": "deepseek-harness-skin",
        "title": "Skin settings",
        "testedDsh": "0.2.0-rc.2"
      },
      "defaults": {
        "skin": "off",
        "artOpacity": 1,
        "veil": 0
      },
      "skins": [],
      "palettes": [
        {
          "id": "studio",
          "accent": "#b8563f"
        },
        {
          "id": "neon",
          "accent": "#0e8f9e"
        },
        {
          "id": "sakura",
          "accent": "#d9748f"
        },
        {
          "id": "film",
          "accent": "#6f7f47"
        }
      ]
    }
/* @build:series:end */

    /* @build:css:start */
    const CSS = `
/* ── src/skins.css ───────────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════
   User-created skins — four internal styling foundations, no bundled gallery.

   HOW THIS FILE IS SCOPED
   -----------------------
   Exactly one attribute on <body> carries the state:

       <body data-dsh-skin="studio">        a skin is on
       (attribute absent)                       the official look, untouched

   Every rule below is anchored to that attribute, so removing it — which is
   exactly what switching back to the official look does — restores the shell
   pixel for pixel. Nothing here renames,
   hides or replaces a shell node. Region controls use semantic shell markers
   plus the bubble class fragment and markdown code-block class.

   HOW A SKIN IS BUILT
   -------------------
   1. Four fixed, click-through layers sit at z-index 0..3 below #root at 4.
      The Windows frame's full-window fill is transparent while a skin is on;
      its sidebar and titlebar keep their own fills.
   2. The shell keeps owning its own layout and components; the skin only
      re-points the \`--dsw-*\` design tokens those components already read. That
      is why a skin reaches every panel, chip, border, scrollbar and button
      across the shell; independently chosen region colours use local scopes.
   3. Token overrides carry \`!important\`, and the client half additionally
      stacks them through \`theme.overrideTokens\`. A registered theme writes its
      aliases as INLINE custom properties, which beat any ordinary stylesheet
      rule; the two mechanisms together are what make the override stick.

   ADDING A SKIN
   -------------
   Users add images in the panel. Keep the internal palettes stable for saved
   custom skins; assets/skins.json intentionally has an empty gallery. The
   \`--skin-*\` variables are the skin's private vocabulary; the layers and the
   gallery panel both read them, so a new skin re-skins the panel for free.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Structural layer ───────────────────────────────────────────────────────
   Applies to whichever skin is active. Palette-independent: geometry, layers,
   transitions, scrollbars, motion and contrast preferences.
   ─────────────────────────────────────────────────────────────────────────── */

/* Region backgrounds use local scopes, so a colour never leaks into a sibling. */
html[data-windows-titlebar] body[data-dsh-skin][data-skin-region-titlebar] #root [style*='--dsh-windows-sidebar-width:']::before {
  background: var(--skin-region-titlebar-fill) !important;
}

body[data-dsh-skin][data-skin-region-titlebar] [data-windows-menu] {
  --dsw-alias-label-primary: var(--skin-region-titlebar-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-titlebar-fg) !important;
  color: var(--skin-region-titlebar-fg) !important;
}

/* Desktop caption menus live in a shadow root: inherited tokens cross the
   boundary. The hidden preload probe also controls native caption buttons. */
html[data-windows-titlebar] body[data-dsh-skin][data-skin-region-titlebar] > span[style*='--dsw-specific-sidebar-fill'][style*='visibility: hidden'] {
  background-color: var(--skin-region-titlebar-fill) !important;
  color: var(--skin-region-titlebar-fg) !important;
}

body[data-dsh-skin][data-skin-region-chat]:not([data-skin-region-header]) #root header[data-window-drag]:has([data-conversation-header-leading]) {
  background: var(--dsw-alias-bg-layer-1) !important;
}

body[data-dsh-skin][data-skin-region-header] #root header[data-window-drag]:has([data-conversation-header-leading]) {
  --dsw-alias-label-primary: var(--skin-region-header-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-header-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-region-header-muted) !important;
  --dsw-alias-label-caption: var(--skin-region-header-muted) !important;
  background: var(--skin-region-header-fill) !important;
  color: var(--skin-region-header-fg);
}

/* Remove both inherited reading washes when a custom chat fill is selected.
   Otherwise a fully transparent colour would still have two opaque ancestors. */
body[data-dsh-skin][data-skin-region-chat] #root [data-phase]:has(> [data-conversation-content]),
html[data-windows-titlebar] body[data-dsh-skin][data-skin-region-chat] #root [style*='--dsh-windows-sidebar-width:'] > div:nth-child(2) {
  background: transparent !important;
}

body[data-dsh-skin][data-skin-region-chat] #root [data-conversation-region='chat'] {
  --dsw-alias-label-primary: var(--skin-region-chat-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-chat-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-region-chat-muted) !important;
  background: var(--skin-region-chat-fill) !important;
  color: var(--skin-region-chat-fg);
}

body[data-dsh-skin][data-skin-region-chat] #root [data-composer-seat] {
  background: transparent !important;
}

/* The default input remains readable when only its surroundings are darkened. */
body[data-dsh-skin][data-skin-region-chat] #root [data-composer-card] {
  --dsw-alias-label-primary: var(--skin-default-fg) !important;
  --dsw-alias-label-secondary: var(--skin-default-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-default-muted) !important;
}

body[data-dsh-skin][data-skin-region-bubble] #root [data-conversation-content] [class*='_bubble'] {
  --dsw-specific-bubble: var(--skin-region-bubble-fill) !important;
  --dsw-alias-label-primary: var(--skin-region-bubble-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-bubble-muted) !important;
  background: var(--skin-region-bubble-fill) !important;
  color: var(--skin-region-bubble-fg);
}

body[data-dsh-skin][data-skin-region-code] #root :is(.md-code-block, [data-read], [data-diff]):has(pre) {
  --dsl-code-block-background: var(--skin-region-code-fill) !important;
  --dsl-code-block-banner-background-color: var(--skin-region-code-fill) !important;
  --dsw-alias-bg-base: transparent !important;
  --dsw-alias-markdown-code-block: var(--skin-region-code-fill) !important;
  --dsw-alias-markdown-code-block-banner: var(--skin-region-code-fill) !important;
  --dsw-alias-label-primary: var(--skin-region-code-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-code-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-region-code-muted) !important;
  background: transparent !important;
  color: var(--skin-region-code-fg);
}

body[data-dsh-skin][data-skin-region-code] #root :is(.md-code-block, [data-read], [data-diff]):has(pre) pre {
  background: var(--skin-region-code-fill) !important;
}

body[data-dsh-skin][data-skin-region-code] #root :is(.md-code-block, [data-read], [data-diff]):has(pre) pre,
body[data-dsh-skin][data-skin-region-code] #root :is(.md-code-block, [data-read], [data-diff]):has(pre) pre span {
  color: var(--skin-region-code-fg) !important;
}

body[data-dsh-skin][data-skin-region-code] #root :is(.md-code-block, [data-read], [data-diff]) [data-code-block-banner],
body[data-dsh-skin][data-skin-region-code] #root :is(.md-code-block, [data-read], [data-diff]) [data-code-block-banner] :is(span, button) {
  color: var(--skin-region-code-fg) !important;
}

body[data-dsh-skin][data-skin-region-input] #root [data-composer-card] {
  --dsw-specific-input-major: var(--skin-region-input-fill) !important;
  --dsw-alias-label-primary: var(--skin-region-input-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-input-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-region-input-muted) !important;
  --dsw-alias-label-caption: var(--skin-region-input-muted) !important;
  --dsw-alias-label-disabled: var(--skin-region-input-muted) !important;
  background: var(--skin-region-input-fill) !important;
  color: var(--skin-region-input-fg);
}

html[data-windows-titlebar] body[data-dsh-skin][data-skin-region-rightbar] #root [style*='--dsh-windows-sidebar-width:'] > div:nth-child(3) {
  --dsw-alias-bg-base: var(--skin-region-rightbar-fill) !important;
  --dsw-alias-bg-layer-1: var(--skin-region-rightbar-fill) !important;
  --dsw-alias-bg-layer-2: var(--skin-region-rightbar-fill) !important;
  --dsw-alias-bg-layer-3: var(--skin-region-rightbar-fill) !important;
  --dsw-alias-label-primary: var(--skin-region-rightbar-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-rightbar-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-region-rightbar-muted) !important;
  --dsw-alias-label-caption: var(--skin-region-rightbar-muted) !important;
  --dsw-alias-label-disabled: var(--skin-region-rightbar-muted) !important;
  background: var(--skin-region-rightbar-fill) !important;
  color: var(--skin-region-rightbar-fg);
}

/* Menus and dialogs may be portalled directly into body. The plugin's own
   settings remain outside this rule so an edited menu cannot hide its controls. */
body[data-dsh-skin][data-skin-region-menu] :is([role='dialog'], [role='menu'], [role='listbox']):not(#deepseek-harness-skin-panel):not(#deepseek-harness-skin-panel *) {
  --dsw-specific-menu: var(--skin-region-menu-fill) !important;
  --dsw-alias-bg-base: var(--skin-region-menu-fill) !important;
  --dsw-alias-bg-layer-1: var(--skin-region-menu-fill) !important;
  --dsw-alias-bg-layer-2: var(--skin-region-menu-fill) !important;
  --dsw-alias-label-primary: var(--skin-region-menu-fg) !important;
  --dsw-alias-label-secondary: var(--skin-region-menu-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-region-menu-muted) !important;
  background: var(--skin-region-menu-fill) !important;
  color: var(--skin-region-menu-fg);
}

body[data-dsh-skin][data-skin-region-menu] [data-menu-backing],
body[data-dsh-skin][data-skin-region-menu] [data-menu-material] > [aria-hidden='true'] {
  background: transparent !important;
  backdrop-filter: none !important;
}

body[data-dsh-skin] {
  /* Image strength and black shading are controlled directly by the panel. */
  --skin-decor-opacity: 1;

  /* The shell normally paints its own ground; the artwork above has to be able
     to show through, so the canvas is handed over to the skin's layers. */
  background-color: transparent !important;
}

/* ── The stacking order, built without negative z-index ─────────────────────
   The four layers sit at 0..3 and the shell's own root is lifted to 4, which
   puts the wallpaper above the canvas and below every shell surface.

   The shell surfaces above these layers must allow the picture to show through.
   \`#root\` is the mount id in the static index shell. */
body[data-dsh-skin] #root {
  position: relative;
  z-index: 4;
}

/* DSH 0.2.0-rc.2 AppFrame.module.css gives the Windows frame the SIDEBAR fill,
   including its opaque gradient, across the entire viewport. Translucent chat
   surfaces therefore reveal that gradient rather than our wallpaper. The web
   frame uses the base token instead, which explains the headless/desktop split.

   AppFrame writes this inline width property only on the Windows frame. Use
   that marker instead of its generated CSS-module class (currently BynINW_frame).
   Clear both background colour and image here; the sidebar and titlebar ::before
   still paint their own sidebar fill. Removing the body marker restores DSH's
   original rule without modifying any shell node or token. */
html[data-windows-titlebar] body[data-dsh-skin] #root [style*='--dsh-windows-sidebar-width:'] {
  background: transparent !important;
}

/* AppFrame's first rendered child is the sidebar column (DocumentTitle renders
   null). Keep the user's colour and contrast tokens inside that column, so chat
   and titlebar retain their selected palette. */
html[data-windows-titlebar] body[data-dsh-skin][data-skin-sidebar-custom] #root [style*='--dsh-windows-sidebar-width:'] > div:first-child {
  --dsw-specific-sidebar-fill: var(--skin-sidebar-fill) !important;
  --dsw-alias-label-primary: var(--skin-sidebar-fg) !important;
  --dsw-alias-label-secondary: var(--skin-sidebar-muted) !important;
  --dsw-alias-label-tertiary: var(--skin-sidebar-muted) !important;
  --dsw-alias-label-primary-inverted: var(--skin-sidebar-fill) !important;
  --dsw-alias-interactive-bg-hover: var(--skin-sidebar-hover) !important;
  --dsw-alias-button-elevated-fill: var(--skin-sidebar-button) !important;
  --dsw-alias-button-floating-hover: var(--skin-sidebar-active) !important;
  --dsw-specific-sidebar-nav-item-active: var(--skin-sidebar-active) !important;
  --dsw-specific-sidebar-nav-item-hover: var(--skin-sidebar-hover) !important;
  background: var(--skin-sidebar-fill) !important;
  color: var(--skin-sidebar-fg);
}

html:has(body[data-dsh-skin]) {
  background-color: transparent !important;
}

#deepseek-harness-skin-backdrop,
#deepseek-harness-skin-art,
#deepseek-harness-skin-veil,
#deepseek-harness-skin-decor {
  display: none;
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-repeat: no-repeat;
  /* No transition on the backdrop: it must land in the same frame the attribute
     flips, or switching skins flashes the previous palette's ground. */
}

/* No plugin canvas may paint while the official appearance is selected. */
body[data-dsh-skin] > :is(#deepseek-harness-skin-backdrop, #deepseek-harness-skin-art,
  #deepseek-harness-skin-veil, #deepseek-harness-skin-decor) {
  display: block;
}

/* Base wash. Always present, art or no art — this is what stops a missing
   picture from turning the window into a white or black hole. */
#deepseek-harness-skin-backdrop {
  z-index: 0;
  background-image: var(--skin-backdrop);
  background-size: cover;
}

/* The character. Cross-fades on switch because an abrupt swap of a full-bleed
   image reads as a rendering glitch rather than a deliberate change. */
#deepseek-harness-skin-art {
  z-index: 1;
  background-image: var(--skin-art);
  background-size: var(--skin-art-size, cover);
  background-position: var(--skin-art-position, center);
  filter: var(--skin-art-filter, none);
  /* A normal 0..1 opacity; original uploaded pixels have no colour filter. */
  opacity: var(--skin-user-art, 1);
  transition: opacity 240ms ease, filter 240ms ease;
}

/* Black shading above both the picture and atmosphere, below the UI. Its
   strength does not depend on the skin palette or light/dark mode. The shell's
   own reading surfaces remain above it. */
#deepseek-harness-skin-veil {
  z-index: 3;
  background: #000;
  opacity: calc(0.96 * var(--skin-user-veil, 0));
  transition: opacity 240ms ease;
}

/* Atmosphere: grain, scanlines, petals, sprocket holes. Generated entirely from
   gradients and inline SVG, so a skin costs no extra network request.

   The blend mode is per-skin and only ever \`normal\`, \`multiply\`, \`overlay\` or
   \`screen\`. It was briefly removed while chasing a dark-mode hang that turned
   out to be a token-publishing feedback loop in client.js — the blend was
   innocent, and it is back. It stays a plain custom property so a skin that
   wants to sit flatter can say so without touching this rule. */
#deepseek-harness-skin-decor {
  z-index: 2;
  background-image: var(--skin-decor);
  background-size: var(--skin-decor-size, auto, auto);
  background-position: var(--skin-decor-position, center, center);
  opacity: calc(var(--skin-decor-opacity, 1) * var(--skin-user-decor, 1));
  mix-blend-mode: var(--skin-decor-blend, normal);
  transition: opacity 240ms ease;
}

/* ── Frosted glass off ──────────────────────────────────────────────────────
   A full-bleed wallpaper and a blurred surface cannot both win. The shell
   frosts its panels with \`backdrop-filter\`, which samples everything painted
   behind them — including this skin's picture — and averages it into a flat
   wash. The result is a background that looks like a solid colour, with the
   artwork technically present and completely invisible.

   Nothing is lost by turning it off here: the panels a frosted effect would
   matter for are the ones this skin already paints nearly opaque through the
   \`--dsw-specific-*\` tokens. */
body[data-dsh-skin] *:not([id^='deepseek-harness-skin']) {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* ── Panel vocabulary ───────────────────────────────────────────────────────
   Defaults only; every skin re-declares them, so the gallery re-skins itself
   live with the rest of the UI. Kept here so the panel still renders if a skin
   block is ever removed.
   ─────────────────────────────────────────────────────────────────────────── */

body[data-dsh-skin] {
  --skin-panel-bg: rgba(28, 24, 22, 0.9);
  --skin-panel-fg: #f4ece5;
  --skin-panel-muted: rgba(244, 236, 229, 0.62);
  --skin-panel-stroke: rgba(255, 255, 255, 0.16);
  --skin-panel-raised: rgba(255, 255, 255, 0.08);
  --skin-panel-shadow: 0 18px 48px rgba(0, 0, 0, 0.44);
}

/* Scrollbars follow the skin rather than staying the platform grey. */
body[data-dsh-skin] * {
  scrollbar-color: var(--skin-scroll-thumb, rgba(128, 128, 128, 0.4)) transparent;
}

/* ── Preferences ────────────────────────────────────────────────────────────
   A skin is decoration. Nobody should have to trade legibility or comfort for
   it, so both preferences are honoured structurally rather than per palette.
   ─────────────────────────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  #deepseek-harness-skin-art,
  #deepseek-harness-skin-veil,
  #deepseek-harness-skin-decor,
  #deepseek-harness-skin-panel {
    transition: none !important;
  }
}

/* Forced-colours mode throws custom properties away; rather than fight it, the
   decorative layers stand down so the OS palette has a clean surface. */
@media (forced-colors: active) {
  #deepseek-harness-skin-backdrop,
  #deepseek-harness-skin-art,
  #deepseek-harness-skin-veil,
  #deepseek-harness-skin-decor {
    display: none !important;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PALETTE 1 — studio
   Warm wood, brick red and sun-warmed photographic paper: the most everyday
   of the four. A creamy ground, with the weight carried by that single
   brick-red accent in the sidebar.
   ═══════════════════════════════════════════════════════════════════════════ */

body[data-dsh-skin='studio'] {
  --skin-accent: #b8563f;
  --skin-accent-soft: #d98974;
  --skin-scroll-thumb: rgba(184, 86, 63, 0.34);

  --skin-backdrop: linear-gradient(168deg, #f7efe2 0%, #f2e6d5 46%, #e8d9c4 100%);
  --skin-decor: radial-gradient(46vw 46vh at 88% 4%, rgba(214, 154, 96, 0.34), transparent 68%),
    radial-gradient(52vw 52vh at 2% 96%, rgba(150, 74, 52, 0.20), transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.16'/%3E%3C/svg%3E");
  --skin-decor-size: auto, auto, 180px 180px;
  --skin-decor-position: center, center, center;
  --skin-decor-blend: multiply;

  --skin-panel-bg: rgba(43, 31, 26, 0.92);
  --skin-panel-fg: #f7ece0;
  --skin-panel-muted: rgba(247, 236, 224, 0.60);
  --skin-panel-stroke: rgba(217, 137, 116, 0.34);
  --skin-panel-raised: rgba(217, 137, 116, 0.14);
  --skin-panel-shadow: 0 18px 48px rgba(58, 26, 16, 0.42);

  /* Surfaces. The base token is deliberately the most transparent one: it is
     the layer the transcript scrolls on, so it is the single value that decides
     how much of the picture you actually see while reading. */
  --dsw-alias-bg-base: rgba(247, 240, 229, calc(0.58 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(252, 248, 240, 0.86) !important;
  --dsw-alias-bg-layer-2: rgba(255, 253, 249, 0.94) !important;
  --dsw-alias-bg-layer-3: rgba(255, 254, 251, 0.97) !important;
  --dsw-alias-bg-overlay: #fdf9f2 !important;
  --dsw-alias-bg-skeleton: rgba(184, 86, 63, 0.10) !important;

  --dsw-alias-border-l1: rgba(150, 74, 52, 0.16) !important;
  --dsw-alias-border-l2: rgba(150, 74, 52, 0.30) !important;
  --dsw-alias-border-l3: rgba(150, 74, 52, 0.42) !important;

  --dsw-alias-label-primary: #2e2320 !important;
  --dsw-alias-label-secondary: #5d4b44 !important;
  --dsw-alias-label-tertiary: #8b756c !important;
  --dsw-alias-label-primary-bluish: #33261f !important;

  --dsw-alias-brand-primary: #a84c37 !important;
  --dsw-alias-brand-text: #a84c37 !important;
  --dsw-alias-link: #a84c37 !important;

  --dsw-alias-interactive-bg-hover: rgba(184, 86, 63, 0.10) !important;
  --dsw-alias-interactive-bg-active: rgba(184, 86, 63, 0.16) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(184, 86, 63, 0.16) !important;
  --dsw-alias-interactive-bg-hover-solid: rgba(184, 86, 63, 0.20) !important;

  --dsw-alias-settings-card-fill: rgba(255, 253, 249, 0.90) !important;
  --dsw-alias-settings-card-stroke: rgba(150, 74, 52, 0.20) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #f0d4c5 0%, #ead0be 46%, #e5c3b2 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(150, 74, 52, 0.13) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(150, 74, 52, 0.07) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #964a34 !important;

  --dsw-specific-bubble: rgba(184, 86, 63, 0.12) !important;
  --dsw-specific-menu: rgba(255, 252, 246, 0.94) !important;
  --dsw-specific-selector: rgba(184, 86, 63, 0.14) !important;
  --dsw-specific-tip: rgba(255, 250, 240, 0.92) !important;

  --dsw-alias-button-primary-fill: #a84c37 !important;
  --dsw-alias-button-primary-hover: #93412f !important;

  --dsw-alias-scrollbar-bg-l1: rgba(184, 86, 63, 0.22) !important;
  --dsw-alias-scrollbar-hover-l1: rgba(184, 86, 63, 0.40) !important;

  --dsw-alias-markdown-code-block: rgba(58, 42, 34, 0.06) !important;
  --dsw-alias-markdown-inline-code: rgba(184, 86, 63, 0.12) !important;
}

body[data-dsh-skin='studio'][data-ds-dark-theme] {
  --skin-accent: #e8967a;
  --skin-accent-soft: #f0bda6;
  --skin-scroll-thumb: rgba(232, 150, 122, 0.34);

  --skin-backdrop: linear-gradient(168deg, #241a16 0%, #1d1512 52%, #150f0d 100%);
  --skin-decor: radial-gradient(46vw 46vh at 88% 4%, rgba(232, 150, 122, 0.18), transparent 68%),
    radial-gradient(52vw 52vh at 2% 96%, rgba(120, 60, 40, 0.26), transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.22'/%3E%3C/svg%3E");
  --skin-decor-blend: overlay;

  --skin-panel-bg: rgba(38, 27, 23, 0.94);
  --skin-panel-fg: #f6e9df;
  --skin-panel-muted: rgba(246, 233, 223, 0.58);
  --skin-panel-stroke: rgba(232, 150, 122, 0.30);

  --dsw-alias-bg-base: rgba(30, 23, 20, calc(0.62 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(42, 33, 29, 0.86) !important;
  --dsw-alias-bg-layer-2: rgba(50, 39, 34, 0.94) !important;
  --dsw-alias-bg-layer-3: rgba(56, 44, 38, 0.96) !important;
  --dsw-alias-bg-overlay: #342a25 !important;

  --dsw-alias-border-l1: rgba(232, 150, 122, 0.16) !important;
  --dsw-alias-border-l2: rgba(232, 150, 122, 0.28) !important;
  --dsw-alias-border-l3: rgba(232, 150, 122, 0.40) !important;

  --dsw-alias-label-primary: #f2e7dd !important;
  --dsw-alias-label-secondary: #c9b3a6 !important;
  --dsw-alias-label-tertiary: #9c8578 !important;

  --dsw-alias-brand-primary: #e8967a !important;
  --dsw-alias-brand-text: #e8967a !important;
  --dsw-alias-link: #eda286 !important;

  --dsw-alias-interactive-bg-hover: rgba(232, 150, 122, 0.12) !important;
  --dsw-alias-interactive-bg-active: rgba(232, 150, 122, 0.18) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(232, 150, 122, 0.18) !important;

  --dsw-alias-settings-card-fill: rgba(48, 37, 32, 0.88) !important;
  --dsw-alias-settings-card-stroke: rgba(232, 150, 122, 0.18) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #665044 0%, #564339 48%, #483830 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(255, 240, 228, 0.16) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(255, 240, 228, 0.09) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #f0bda6 !important;
  --dsw-specific-menu: rgba(44, 34, 29, 0.95) !important;
  --dsw-specific-bubble: rgba(232, 150, 122, 0.14) !important;

  --dsw-alias-button-primary-fill: #b8603f !important;
  --dsw-alias-button-primary-hover: #c96f4c !important;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PALETTE 2 — neon
   A rain-soaked night: wet asphalt smears the neon into one wash, cyan on one
   side and magenta on the other. The highest-contrast palette of the four —
   light mode reads as rain by daylight, dark mode is the real night.
   ═══════════════════════════════════════════════════════════════════════════ */

body[data-dsh-skin='neon'] {
  --skin-accent: #0e8f9e;
  --skin-accent-soft: #3fb6c2;
  --skin-scroll-thumb: rgba(14, 143, 158, 0.34);

  --skin-backdrop: linear-gradient(166deg, #eef4f7 0%, #e2ecf2 48%, #d3e2ea 100%);
  --skin-decor: radial-gradient(40vw 40vh at 92% 2%, rgba(0, 196, 204, 0.30), transparent 66%),
    radial-gradient(44vw 44vh at 4% 98%, rgba(214, 40, 138, 0.22), transparent 68%),
    repeating-linear-gradient(0deg, rgba(12, 40, 52, 0.055) 0 1px, transparent 1px 3px);
  --skin-decor-size: auto, auto, 100% 3px;
  --skin-decor-position: center, center, center;
  --skin-decor-blend: normal;

  --skin-panel-bg: rgba(11, 22, 32, 0.93);
  --skin-panel-fg: #e5f4f6;
  --skin-panel-muted: rgba(229, 244, 246, 0.58);
  --skin-panel-stroke: rgba(63, 182, 194, 0.36);
  --skin-panel-raised: rgba(63, 182, 194, 0.14);
  --skin-panel-shadow: 0 18px 48px rgba(4, 16, 26, 0.5);

  --dsw-alias-bg-base: rgba(238, 244, 248, calc(0.56 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(246, 251, 253, 0.85) !important;
  --dsw-alias-bg-layer-2: rgba(252, 254, 255, 0.93) !important;
  --dsw-alias-bg-layer-3: rgba(255, 255, 255, 0.96) !important;
  --dsw-alias-bg-overlay: #f8fbfd !important;

  --dsw-alias-border-l1: rgba(14, 143, 158, 0.18) !important;
  --dsw-alias-border-l2: rgba(14, 143, 158, 0.32) !important;
  --dsw-alias-border-l3: rgba(14, 143, 158, 0.44) !important;

  --dsw-alias-label-primary: #16232b !important;
  --dsw-alias-label-secondary: #43565f !important;
  --dsw-alias-label-tertiary: #6d8189 !important;

  --dsw-alias-brand-primary: #0e8f9e !important;
  --dsw-alias-brand-text: #0e8f9e !important;
  --dsw-alias-link: #0b7d8a !important;

  --dsw-alias-interactive-bg-hover: rgba(14, 143, 158, 0.10) !important;
  --dsw-alias-interactive-bg-active: rgba(14, 143, 158, 0.16) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(214, 40, 138, 0.14) !important;

  --dsw-alias-settings-card-fill: rgba(251, 254, 255, 0.90) !important;
  --dsw-alias-settings-card-stroke: rgba(14, 143, 158, 0.20) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #d1e7eb 0%, #c4dde3 46%, #b8d3dc 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(14, 117, 133, 0.13) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(14, 117, 133, 0.07) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #0e7585 !important;

  --dsw-specific-bubble: rgba(14, 143, 158, 0.12) !important;
  --dsw-specific-menu: rgba(249, 253, 255, 0.94) !important;
  --dsw-specific-selector: rgba(14, 143, 158, 0.14) !important;

  --dsw-alias-button-primary-fill: #0e8f9e !important;
  --dsw-alias-button-primary-hover: #0b7d8a !important;

  --dsw-alias-scrollbar-bg-l1: rgba(14, 143, 158, 0.22) !important;
  --dsw-alias-scrollbar-hover-l1: rgba(14, 143, 158, 0.42) !important;

  --dsw-alias-markdown-code-block: rgba(14, 40, 52, 0.06) !important;
  --dsw-alias-markdown-inline-code: rgba(14, 143, 158, 0.12) !important;
}

body[data-dsh-skin='neon'][data-ds-dark-theme] {
  --skin-accent: #41e0d0;
  --skin-accent-soft: #8df0e6;
  --skin-scroll-thumb: rgba(65, 224, 208, 0.36);

  --skin-backdrop: linear-gradient(166deg, #070d18 0%, #050a13 50%, #03060c 100%);
  --skin-decor: radial-gradient(40vw 40vh at 92% 2%, rgba(65, 224, 208, 0.26), transparent 66%),
    radial-gradient(44vw 44vh at 4% 98%, rgba(255, 45, 149, 0.24), transparent 68%),
    repeating-linear-gradient(0deg, rgba(130, 240, 235, 0.05) 0 1px, transparent 1px 3px);
  --skin-decor-blend: screen;

  --skin-panel-bg: rgba(8, 15, 24, 0.94);
  --skin-panel-fg: #dff6f5;
  --skin-panel-muted: rgba(223, 246, 245, 0.56);
  --skin-panel-stroke: rgba(65, 224, 208, 0.34);

  --dsw-alias-bg-base: rgba(8, 13, 22, calc(0.58 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(14, 21, 34, 0.85) !important;
  --dsw-alias-bg-layer-2: rgba(19, 28, 44, 0.93) !important;
  --dsw-alias-bg-layer-3: rgba(23, 34, 52, 0.96) !important;
  --dsw-alias-bg-overlay: #131c2c !important;

  --dsw-alias-border-l1: rgba(65, 224, 208, 0.16) !important;
  --dsw-alias-border-l2: rgba(65, 224, 208, 0.28) !important;
  --dsw-alias-border-l3: rgba(65, 224, 208, 0.42) !important;

  --dsw-alias-label-primary: #e6f3f5 !important;
  --dsw-alias-label-secondary: #a9c2c9 !important;
  --dsw-alias-label-tertiary: #7b959d !important;

  --dsw-alias-brand-primary: #41e0d0 !important;
  --dsw-alias-brand-text: #41e0d0 !important;
  --dsw-alias-link: #5fe6d8 !important;

  --dsw-alias-interactive-bg-hover: rgba(65, 224, 208, 0.12) !important;
  --dsw-alias-interactive-bg-active: rgba(65, 224, 208, 0.20) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(255, 45, 149, 0.18) !important;

  --dsw-alias-settings-card-fill: rgba(18, 27, 42, 0.88) !important;
  --dsw-alias-settings-card-stroke: rgba(65, 224, 208, 0.18) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #365663 0%, #2b4653 48%, #243b47 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(120, 235, 240, 0.16) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(120, 235, 240, 0.09) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #7ce8ee !important;
  --dsw-specific-menu: rgba(16, 25, 39, 0.95) !important;
  --dsw-specific-bubble: rgba(65, 224, 208, 0.14) !important;

  --dsw-alias-button-primary-fill: #17897f !important;
  --dsw-alias-button-primary-hover: #1fa295 !important;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PALETTE 3 — sakura
   The lightest of the four: blossom pink over cold white, balanced by a
   blue-grey, with scattered petals in the decorative layer. It leads with
   light mode; dark mode turns it into night blossom.
   ═══════════════════════════════════════════════════════════════════════════ */

body[data-dsh-skin='sakura'] {
  --skin-accent: #d9748f;
  --skin-accent-soft: #eb9db1;
  --skin-scroll-thumb: rgba(217, 116, 143, 0.32);

  --skin-backdrop: linear-gradient(162deg, #fdf3f6 0%, #f8eef3 44%, #eef2f2 100%);
  --skin-decor: radial-gradient(44vw 44vh at 6% 2%, rgba(255, 196, 214, 0.42), transparent 66%),
    radial-gradient(48vw 48vh at 96% 96%, rgba(150, 214, 208, 0.26), transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'%3E%3Cg fill='%23e79cb2' fill-opacity='0.5'%3E%3Cpath d='M40 34c7-9 19-9 24 0 5-9 17-9 24 0 6 9-3 19-24 30-21-11-30-21-24-30z'/%3E%3Cpath d='M168 96c5-7 14-7 18 0 4-7 13-7 18 0 4 7-3 14-18 22-15-8-22-15-18-22z'/%3E%3Cpath d='M74 176c4-6 12-6 15 0 3-6 11-6 15 0 3 6-3 12-15 19-12-7-18-13-15-19z'/%3E%3Cpath d='M204 208c4-6 12-6 15 0 3-6 11-6 15 0 3 6-3 12-15 19-12-7-18-13-15-19z'/%3E%3Cpath d='M132 22c3-5 10-5 13 0 3-5 10-5 13 0 3 5-3 10-13 16-10-6-16-11-13-16z'/%3E%3C/g%3E%3C/svg%3E");
  --skin-decor-size: auto, auto, 260px 260px;
  --skin-decor-position: center, center, center;
  --skin-decor-blend: normal;

  --skin-panel-bg: rgba(48, 30, 38, 0.92);
  --skin-panel-fg: #fbeef3;
  --skin-panel-muted: rgba(251, 238, 243, 0.60);
  --skin-panel-stroke: rgba(235, 157, 177, 0.36);
  --skin-panel-raised: rgba(235, 157, 177, 0.16);
  --skin-panel-shadow: 0 18px 48px rgba(74, 32, 46, 0.4);

  --dsw-alias-bg-base: rgba(253, 246, 249, calc(0.55 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(255, 250, 252, 0.84) !important;
  --dsw-alias-bg-layer-2: rgba(255, 253, 254, 0.93) !important;
  --dsw-alias-bg-layer-3: rgba(255, 255, 255, 0.96) !important;
  --dsw-alias-bg-overlay: #fffafc !important;

  --dsw-alias-border-l1: rgba(217, 116, 143, 0.18) !important;
  --dsw-alias-border-l2: rgba(217, 116, 143, 0.32) !important;
  --dsw-alias-border-l3: rgba(217, 116, 143, 0.44) !important;

  --dsw-alias-label-primary: #3a2830 !important;
  --dsw-alias-label-secondary: #6b515c !important;
  --dsw-alias-label-tertiary: #977c88 !important;

  --dsw-alias-brand-primary: #c95f7d !important;
  --dsw-alias-brand-text: #c95f7d !important;
  --dsw-alias-link: #c95f7d !important;

  --dsw-alias-interactive-bg-hover: rgba(217, 116, 143, 0.10) !important;
  --dsw-alias-interactive-bg-active: rgba(217, 116, 143, 0.16) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(217, 116, 143, 0.16) !important;

  --dsw-alias-settings-card-fill: rgba(255, 251, 253, 0.90) !important;
  --dsw-alias-settings-card-stroke: rgba(217, 116, 143, 0.20) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #f4d9e3 0%, #efd0dd 46%, #e8c2d2 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(167, 76, 110, 0.13) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(167, 76, 110, 0.07) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #a74c6e !important;

  --dsw-specific-bubble: rgba(217, 116, 143, 0.12) !important;
  --dsw-specific-menu: rgba(255, 251, 253, 0.94) !important;
  --dsw-specific-selector: rgba(217, 116, 143, 0.14) !important;

  --dsw-alias-button-primary-fill: #c95f7d !important;
  --dsw-alias-button-primary-hover: #b5516e !important;

  --dsw-alias-scrollbar-bg-l1: rgba(217, 116, 143, 0.22) !important;
  --dsw-alias-scrollbar-hover-l1: rgba(217, 116, 143, 0.42) !important;

  --dsw-alias-markdown-code-block: rgba(58, 40, 48, 0.06) !important;
  --dsw-alias-markdown-inline-code: rgba(217, 116, 143, 0.12) !important;
}

body[data-dsh-skin='sakura'][data-ds-dark-theme] {
  --skin-accent: #f2a3b8;
  --skin-accent-soft: #ffc6d5;
  --skin-scroll-thumb: rgba(242, 163, 184, 0.34);

  --skin-backdrop: linear-gradient(162deg, #201822 0%, #1a141d 50%, #131018 100%);
  --skin-decor: radial-gradient(44vw 44vh at 6% 2%, rgba(242, 163, 184, 0.18), transparent 66%),
    radial-gradient(48vw 48vh at 96% 96%, rgba(120, 196, 190, 0.16), transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'%3E%3Cg fill='%23f2a3b8' fill-opacity='0.34'%3E%3Cpath d='M40 34c7-9 19-9 24 0 5-9 17-9 24 0 6 9-3 19-24 30-21-11-30-21-24-30z'/%3E%3Cpath d='M168 96c5-7 14-7 18 0 4-7 13-7 18 0 4 7-3 14-18 22-15-8-22-15-18-22z'/%3E%3Cpath d='M74 176c4-6 12-6 15 0 3-6 11-6 15 0 3 6-3 12-15 19-12-7-18-13-15-19z'/%3E%3Cpath d='M204 208c4-6 12-6 15 0 3-6 11-6 15 0 3 6-3 12-15 19-12-7-18-13-15-19z'/%3E%3Cpath d='M132 22c3-5 10-5 13 0 3-5 10-5 13 0 3 5-3 10-13 16-10-6-16-11-13-16z'/%3E%3C/g%3E%3C/svg%3E");
  --skin-decor-blend: screen;

  --skin-panel-bg: rgba(34, 24, 33, 0.94);
  --skin-panel-fg: #f9e9f0;
  --skin-panel-muted: rgba(249, 233, 240, 0.58);
  --skin-panel-stroke: rgba(242, 163, 184, 0.32);

  --dsw-alias-bg-base: rgba(28, 20, 28, calc(0.60 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(38, 28, 38, 0.85) !important;
  --dsw-alias-bg-layer-2: rgba(46, 34, 46, 0.93) !important;
  --dsw-alias-bg-layer-3: rgba(53, 40, 53, 0.96) !important;
  --dsw-alias-bg-overlay: #2e222e !important;

  --dsw-alias-border-l1: rgba(242, 163, 184, 0.16) !important;
  --dsw-alias-border-l2: rgba(242, 163, 184, 0.28) !important;
  --dsw-alias-border-l3: rgba(242, 163, 184, 0.40) !important;

  --dsw-alias-label-primary: #f6e9ef !important;
  --dsw-alias-label-secondary: #c9aab7 !important;
  --dsw-alias-label-tertiary: #9c808d !important;

  --dsw-alias-brand-primary: #f2a3b8 !important;
  --dsw-alias-brand-text: #f2a3b8 !important;
  --dsw-alias-link: #f7b6c8 !important;

  --dsw-alias-interactive-bg-hover: rgba(242, 163, 184, 0.12) !important;
  --dsw-alias-interactive-bg-active: rgba(242, 163, 184, 0.18) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(242, 163, 184, 0.18) !important;

  --dsw-alias-settings-card-fill: rgba(44, 32, 44, 0.88) !important;
  --dsw-alias-settings-card-stroke: rgba(242, 163, 184, 0.18) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #674d60 0%, #584252 48%, #493746 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(255, 240, 246, 0.18) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(255, 240, 246, 0.10) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #ffd9e4 !important;
  --dsw-specific-menu: rgba(42, 30, 41, 0.95) !important;
  --dsw-specific-bubble: rgba(242, 163, 184, 0.14) !important;

  --dsw-alias-button-primary-fill: #c2607e !important;
  --dsw-alias-button-primary-hover: #d4718e !important;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PALETTE 4 — film
   One faded frame: cream, ink green, grain, and a light leak pressed down the
   right-hand side. The sprocket holes in the decorative layer are this
   palette's signature, and it is the only one of the four with a border.
   ═══════════════════════════════════════════════════════════════════════════ */

body[data-dsh-skin='film'] {
  --skin-accent: #6f7f47;
  --skin-accent-soft: #9aab6d;
  --skin-scroll-thumb: rgba(111, 127, 71, 0.34);

  --skin-backdrop: linear-gradient(164deg, #efe8d6 0%, #e7dfc9 46%, #ddd3b9 100%);
  --skin-decor: radial-gradient(38vw 62vh at 100% 44%, rgba(255, 186, 108, 0.34), transparent 72%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Crect x='4' y='4' width='20' height='20' rx='2.5' fill='none' stroke='%235f5a44' stroke-opacity='0.30' stroke-width='1.6'/%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.28'/%3E%3C/svg%3E");
  --skin-decor-size: auto, 28px 28px, 200px 200px;
  --skin-decor-position: center, center, center;
  --skin-decor-blend: multiply;

  --skin-panel-bg: rgba(32, 31, 23, 0.93);
  --skin-panel-fg: #f0ead9;
  --skin-panel-muted: rgba(240, 234, 217, 0.58);
  --skin-panel-stroke: rgba(200, 176, 106, 0.34);
  --skin-panel-raised: rgba(200, 176, 106, 0.14);
  --skin-panel-shadow: 0 18px 48px rgba(28, 26, 14, 0.46);

  --dsw-alias-bg-base: rgba(240, 234, 217, calc(0.58 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(247, 242, 228, 0.86) !important;
  --dsw-alias-bg-layer-2: rgba(252, 249, 240, 0.94) !important;
  --dsw-alias-bg-layer-3: rgba(254, 252, 246, 0.97) !important;
  --dsw-alias-bg-overlay: #faf7ee !important;

  --dsw-alias-border-l1: rgba(111, 127, 71, 0.18) !important;
  --dsw-alias-border-l2: rgba(111, 127, 71, 0.32) !important;
  --dsw-alias-border-l3: rgba(111, 127, 71, 0.44) !important;

  --dsw-alias-label-primary: #2b2a22 !important;
  --dsw-alias-label-secondary: #565445 !important;
  --dsw-alias-label-tertiary: #847f6b !important;

  --dsw-alias-brand-primary: #62723f !important;
  --dsw-alias-brand-text: #62723f !important;
  --dsw-alias-link: #62723f !important;

  --dsw-alias-interactive-bg-hover: rgba(111, 127, 71, 0.10) !important;
  --dsw-alias-interactive-bg-active: rgba(111, 127, 71, 0.16) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(111, 127, 71, 0.16) !important;

  --dsw-alias-settings-card-fill: rgba(252, 249, 240, 0.90) !important;
  --dsw-alias-settings-card-stroke: rgba(111, 127, 71, 0.20) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #e4e9d6 0%, #d9e0c5 46%, #cdd7b8 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(94, 111, 55, 0.13) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(94, 111, 55, 0.07) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #5e6f37 !important;

  --dsw-specific-bubble: rgba(111, 127, 71, 0.12) !important;
  --dsw-specific-menu: rgba(251, 248, 238, 0.94) !important;
  --dsw-specific-selector: rgba(111, 127, 71, 0.14) !important;

  --dsw-alias-button-primary-fill: #62723f !important;
  --dsw-alias-button-primary-hover: #536234 !important;

  --dsw-alias-scrollbar-bg-l1: rgba(111, 127, 71, 0.22) !important;
  --dsw-alias-scrollbar-hover-l1: rgba(111, 127, 71, 0.42) !important;

  --dsw-alias-markdown-code-block: rgba(43, 42, 34, 0.06) !important;
  --dsw-alias-markdown-inline-code: rgba(111, 127, 71, 0.12) !important;
}

body[data-dsh-skin='film'][data-ds-dark-theme] {
  --skin-accent: #c8b06a;
  --skin-accent-soft: #e0cd92;
  --skin-scroll-thumb: rgba(200, 176, 106, 0.34);

  --skin-backdrop: linear-gradient(164deg, #1c1b14 0%, #171610 50%, #100f0a 100%);
  --skin-decor: radial-gradient(38vw 62vh at 100% 44%, rgba(255, 170, 84, 0.20), transparent 72%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Crect x='4' y='4' width='20' height='20' rx='2.5' fill='none' stroke='%23c8b06a' stroke-opacity='0.22' stroke-width='1.6'/%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.34'/%3E%3C/svg%3E");
  --skin-decor-blend: overlay;

  --skin-panel-bg: rgba(28, 27, 20, 0.94);
  --skin-panel-fg: #efe8d6;
  --skin-panel-muted: rgba(239, 232, 214, 0.58);
  --skin-panel-stroke: rgba(200, 176, 106, 0.32);

  --dsw-alias-bg-base: rgba(24, 23, 18, calc(0.62 * var(--skin-user-surface, 1))) !important;
  --dsw-alias-bg-layer-1: rgba(34, 32, 25, 0.86) !important;
  --dsw-alias-bg-layer-2: rgba(42, 39, 30, 0.94) !important;
  --dsw-alias-bg-layer-3: rgba(48, 45, 35, 0.96) !important;
  --dsw-alias-bg-overlay: #2a271e !important;

  --dsw-alias-border-l1: rgba(200, 176, 106, 0.16) !important;
  --dsw-alias-border-l2: rgba(200, 176, 106, 0.28) !important;
  --dsw-alias-border-l3: rgba(200, 176, 106, 0.40) !important;

  --dsw-alias-label-primary: #efe8d6 !important;
  --dsw-alias-label-secondary: #bdb49a !important;
  --dsw-alias-label-tertiary: #918a75 !important;

  --dsw-alias-brand-primary: #c8b06a !important;
  --dsw-alias-brand-text: #c8b06a !important;
  --dsw-alias-link: #d6c184 !important;

  --dsw-alias-interactive-bg-hover: rgba(200, 176, 106, 0.12) !important;
  --dsw-alias-interactive-bg-active: rgba(200, 176, 106, 0.18) !important;
  --dsw-alias-interactive-bg-hover-accent: rgba(200, 176, 106, 0.18) !important;

  --dsw-alias-settings-card-fill: rgba(38, 36, 28, 0.88) !important;
  --dsw-alias-settings-card-stroke: rgba(200, 176, 106, 0.18) !important;

  --dsw-specific-sidebar-fill: linear-gradient(172deg, #596049 0%, #4a513e 48%, #3d4434 100%) !important;
  --dsw-specific-sidebar-nav-item-active: rgba(238, 235, 200, 0.17) !important;
  --dsw-specific-sidebar-nav-item-hover: rgba(238, 235, 200, 0.09) !important;
  --dsw-specific-sidebar-nav-item-active-accent: #e2d69a !important;
  --dsw-specific-menu: rgba(36, 34, 26, 0.95) !important;
  --dsw-specific-bubble: rgba(200, 176, 106, 0.14) !important;

  --dsw-alias-button-primary-fill: #8a7a3f !important;
  --dsw-alias-button-primary-hover: #a08f4c !important;
}

/* ── src/panel.css ───────────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════
   DeepSeek Harness skin plugin — the switcher panel.

   The panel is the plugin's own surface, not a shell slot. That is a deliberate
   trade: it costs the shell's visual integration, and buys three things a slot
   cannot promise — it keeps working when the settings registry changes shape
   between DSH versions, it renders identically whether or not the dynamic
   client half can reach that registry, and it can be given whatever layout the
   skin needs instead of whatever a settings row allows.

   It is ALSO part of the skin: every colour below falls back to a neutral
   default and is then overridden by the active skin's \`--skin-panel-*\` values, so
   the switcher re-skins itself the instant you use it.
   ═══════════════════════════════════════════════════════════════════════════ */

#deepseek-harness-skin-dock {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  font: 400 13px/1.45 system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  color: var(--skin-panel-fg, #f4ece5);
  -webkit-font-smoothing: antialiased;
}

#deepseek-harness-skin-dock * {
  box-sizing: border-box;
}

/* ── Launcher: the application's whale silhouette, without a label. ─────── */

#deepseek-harness-skin-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 8px;
  margin: 0;
  appearance: none;
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: rgba(255, 255, 255, 0.94);
  color: #000;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

#deepseek-harness-skin-handle [data-role='whale'] {
  display: block;
  width: 26px;
  height: 20px;
  pointer-events: none;
}

#deepseek-harness-skin-handle:hover {
  transform: translateY(-1px);
  border-color: var(--skin-accent, #b8563f);
}

#deepseek-harness-skin-handle:focus-visible,
#deepseek-harness-skin-panel :focus-visible {
  outline: 2px solid var(--skin-accent, #b8563f);
  outline-offset: 2px;
}

/* ── Panel shell ────────────────────────────────────────────────────────── */

#deepseek-harness-skin-panel {
  position: fixed;
  right: 18px;
  bottom: 70px;
  width: min(340px, calc(100vw - 16px));
  max-height: min(74vh, 640px, calc(100vh - 16px));
  -webkit-app-region: no-drag;
  overflow: hidden auto;
  border-radius: 16px;
  border: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.16));
  background: var(--skin-panel-bg, rgba(28, 24, 22, 0.9));
  box-shadow: var(--skin-panel-shadow, 0 18px 48px rgba(0, 0, 0, 0.44));
  backdrop-filter: blur(20px) saturate(1.25);
}

/* Closing is animated but opening is not: the panel must be measurable the
   moment it is shown, or the outside-click handler races its own geometry. */
#deepseek-harness-skin-dock[data-open='false'] #deepseek-harness-skin-panel {
  display: none;
}

#deepseek-harness-skin-panel [data-role='head'] {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 14px 11px;
  border-bottom: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.14));
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(var(--skin-panel-bg, #1c1816), var(--skin-panel-bg, #1c1816)), #17222b;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

#deepseek-harness-skin-panel [data-role='head'][data-dragging] {
  cursor: grabbing;
}

#deepseek-harness-skin-panel [data-role='close'] {
  cursor: pointer;
}

#deepseek-harness-skin-panel [data-role='title'] {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

#deepseek-harness-skin-panel [data-role='subtitle'] {
  font-size: 11px;
  font-weight: 400;
  color: var(--skin-panel-muted, rgba(244, 236, 229, 0.62));
}

#deepseek-harness-skin-panel [data-role='body'] {
  padding: 12px;
}

#deepseek-harness-skin-panel [data-role='foot'] {
  padding: 10px 14px 13px;
  border-top: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.14));
  font-size: 11px;
  line-height: 1.6;
  color: var(--skin-panel-muted, rgba(244, 236, 229, 0.62));
}

#deepseek-harness-skin-panel [data-role='foot'] b {
  color: var(--skin-panel-fg, #f4ece5);
  font-weight: 600;
}

#deepseek-harness-skin-panel [data-role='foot'] [data-tone='warn'] {
  color: #f0b429;
}

/* ── Skin gallery ───────────────────────────────────────────────────────── */

#deepseek-harness-skin-panel [data-role='grid'] {
  display: grid;
  gap: 8px;
  max-height: 244px;
  overflow-x: hidden;
  overflow-y: auto;
}

#deepseek-harness-skin-panel [data-role='card'] {
  position: relative;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 8px 11px 8px 8px;
  margin: 0;
  text-align: left;
  appearance: none;
  cursor: pointer;
  border-radius: 11px;
  border: 1px solid transparent;
  background: var(--skin-panel-raised, rgba(255, 255, 255, 0.06));
  color: inherit;
  font: inherit;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
}

#deepseek-harness-skin-panel [data-role='card']:hover {
  transform: translateX(2px);
  border-color: var(--skin-panel-stroke, rgba(255, 255, 255, 0.2));
}

#deepseek-harness-skin-panel [data-role='card'][aria-pressed='true'] {
  border-color: var(--skin-accent, #b8563f);
  background: color-mix(in srgb, var(--skin-accent, #b8563f) 16%, transparent);
}

/* The thumbnail and wallpaper share the same uploaded or bundled image. */
#deepseek-harness-skin-panel [data-role='thumb'] {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background-color: rgba(255, 255, 255, 0.08);
  background-image: var(--skin-thumb, none);
  background-size: cover;
  background-position: center 18%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

#deepseek-harness-skin-panel [data-role='thumb'][data-art='missing'] {
  background-image: linear-gradient(135deg, var(--skin-accent, #b8563f), transparent 70%);
}

#deepseek-harness-skin-panel [data-role='name'] {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

#deepseek-harness-skin-panel [data-role='tick'] {
  font-size: 12px;
  opacity: 0;
  color: var(--skin-accent, #b8563f);
}

#deepseek-harness-skin-panel [data-role='card'][aria-pressed='true'] [data-role='tick'] {
  opacity: 1;
}

/* ── Controls ───────────────────────────────────────────────────────────── */

#deepseek-harness-skin-panel [data-role='controls'] {
  display: grid;
  gap: 7px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.14));
}

#deepseek-harness-skin-panel [data-role='controls'][hidden] {
  display: none;
}

#deepseek-harness-skin-panel [hidden] {
  display: none !important;
}

#deepseek-harness-skin-panel [data-role='section-head'] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 7px 0 2px;
}

#deepseek-harness-skin-panel [data-role='body'] button:not([data-role='card']) {
  appearance: none;
  border: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.16));
  border-radius: 7px;
  padding: 6px 9px;
  color: inherit;
  background: var(--skin-panel-raised, rgba(255, 255, 255, 0.06));
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

#deepseek-harness-skin-panel button:disabled {
  opacity: 0.5;
  cursor: wait;
}

#deepseek-harness-skin-panel [data-role='art-actions'],
#deepseek-harness-skin-panel [data-role='color-row'] {
  display: flex;
  align-items: center;
  gap: 8px;
}

#deepseek-harness-skin-panel [data-role='color-row'] input[type='color'] {
  width: 48px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.16));
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
}

#deepseek-harness-skin-panel input[type='text'],
#deepseek-harness-skin-panel select {
  min-width: 0;
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.16));
  border-radius: 7px;
  background: var(--skin-panel-bg, #1c1816);
  color: inherit;
  font: inherit;
  font-size: 12px;
}

#deepseek-harness-skin-panel input::placeholder {
  color: var(--skin-panel-muted, rgba(244, 236, 229, 0.62));
}

#deepseek-harness-skin-panel [data-role='new-skin'] {
  margin-top: 10px;
  padding: 9px;
  border: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.16));
  border-radius: 9px;
}

#deepseek-harness-skin-panel summary {
  cursor: pointer;
  font-size: 12px;
}

#deepseek-harness-skin-panel [data-role='field'] {
  display: grid;
  gap: 5px;
  margin: 10px 0;
  font-size: 11px;
}

#deepseek-harness-skin-panel [data-role='new-color-row'],
#deepseek-harness-skin-panel [data-role='region-color-row'] {
  display: flex;
  align-items: center;
  gap: 10px;
}

#deepseek-harness-skin-panel [data-role='new-color'],
#deepseek-harness-skin-panel [data-role='region-color'],
#deepseek-harness-skin-panel [data-role='region-text'] {
  flex: 0 0 34px;
  width: 34px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--skin-panel-stroke);
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
}

#deepseek-harness-skin-panel :is([data-role='new-color-row'], [data-role='region-color-row']) input:is([data-role='new-hue'], [data-role='region-hue']) {
  flex: 1;
  min-width: 0;
  height: 32px;
}

#deepseek-harness-skin-panel :is([data-role='new-color-row'], [data-role='region-color-row']) input:is([data-role='new-hue'], [data-role='region-hue'])::-webkit-slider-runnable-track {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(to right, #ff4b4b, #ffe34b, #55d96b, #43d9e8, #4c70ff, #c658f0, #ff4b4b);
}

#deepseek-harness-skin-panel :is([data-role='new-color-row'], [data-role='region-color-row']) input:is([data-role='new-hue'], [data-role='region-hue'])::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  margin-top: -3px;
  border: 3px solid #fff;
  background: var(--skin-hue-thumb, #f4d9e3);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

#deepseek-harness-skin-panel :is([data-role='new-color-row'], [data-role='region-color-row']) input:is([data-role='new-hue'], [data-role='region-hue'])::-moz-range-track {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(to right, #ff4b4b, #ffe34b, #55d96b, #43d9e8, #4c70ff, #c658f0, #ff4b4b);
}

#deepseek-harness-skin-panel :is([data-role='new-color-row'], [data-role='region-color-row']) input:is([data-role='new-hue'], [data-role='region-hue'])::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--skin-hue-thumb, #f4d9e3);
}

#deepseek-harness-skin-panel [data-role='new-color-value'] {
  color: var(--skin-panel-muted);
  font-variant-numeric: tabular-nums;
}

#deepseek-harness-skin-panel [data-role='region-text-row'] {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
}

#deepseek-harness-skin-panel [data-role='region-auto-text'] {
  padding: 5px 9px;
  border: 1px solid var(--skin-panel-stroke);
  border-radius: 7px;
  background: var(--skin-panel-raised);
  color: inherit;
  cursor: pointer;
}

#deepseek-harness-skin-panel [data-role='region-auto-text'][aria-pressed='true'] {
  border-color: var(--skin-accent);
}

#deepseek-harness-skin-panel [data-role='region-status'] {
  margin-left: auto;
  color: var(--skin-panel-muted);
}

#deepseek-harness-skin-panel [data-role='region-opacity-value'] {
  color: var(--skin-panel-fg);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

#deepseek-harness-skin-panel [data-role='message'] {
  margin: 7px 0 0;
  font-size: 11px;
  line-height: 1.5;
}

#deepseek-harness-skin-panel [data-role='message']:empty {
  display: none;
}

#deepseek-harness-skin-panel [data-tone='error'] {
  color: #ffa4a4;
}

#deepseek-harness-skin-panel [data-role='control'] {
  display: grid;
  grid-template-columns: 62px 1fr 38px;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  color: var(--skin-panel-muted, rgba(244, 236, 229, 0.62));
}

#deepseek-harness-skin-panel [data-role='framing-head'] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

#deepseek-harness-skin-panel [data-role='reset-framing'],
#deepseek-harness-skin-panel [data-fit] {
  appearance: none;
  border: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.16));
  border-radius: 7px;
  padding: 5px 9px;
  color: inherit;
  background: var(--skin-panel-raised, rgba(255, 255, 255, 0.06));
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

#deepseek-harness-skin-panel [data-role='fit-options'] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin-bottom: 3px;
}

#deepseek-harness-skin-panel [data-fit][aria-pressed='true'] {
  border-color: var(--skin-accent, #b8563f);
  background: color-mix(in srgb, var(--skin-accent, #b8563f) 16%, transparent);
}

#deepseek-harness-skin-panel [data-role='framing-hint'],
#deepseek-harness-skin-panel [data-role='effects-hint'] {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--skin-panel-muted, rgba(244, 236, 229, 0.62));
}

#deepseek-harness-skin-panel [data-role='levels-title'] {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--skin-panel-stroke, rgba(255, 255, 255, 0.14));
  font-weight: 600;
}

#deepseek-harness-skin-panel [data-role='control'] [data-role='value'] {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--skin-panel-fg, #f4ece5);
}

#deepseek-harness-skin-panel input[type='range'] {
  width: 100%;
  height: 18px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

#deepseek-harness-skin-panel input[type='range']::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--skin-panel-fg, #f4ece5) 22%, transparent);
}

#deepseek-harness-skin-panel input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 13px;
  height: 13px;
  margin-top: -5px;
  border-radius: 50%;
  background: var(--skin-accent, #b8563f);
  border: 2px solid var(--skin-panel-bg, #1c1816);
}

#deepseek-harness-skin-panel input[type='range']::-moz-range-track {
  height: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--skin-panel-fg, #f4ece5) 22%, transparent);
}

#deepseek-harness-skin-panel input[type='range']::-moz-range-thumb {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--skin-accent, #b8563f);
  border: 2px solid var(--skin-panel-bg, #1c1816);
}

/* ── Small viewports ────────────────────────────────────────────────────────
   Phone-width windows get a sheet rather than a floating card: a 340px popover
   on a 380px window is a popover that covers the thing you are switching.
   ─────────────────────────────────────────────────────────────────────────── */

@media (max-width: 520px) {
  #deepseek-harness-skin-dock {
    right: 10px;
    bottom: 10px;
    left: 10px;
    align-items: stretch;
  }

  #deepseek-harness-skin-panel {
    right: 10px;
    bottom: 62px;
    width: min(340px, calc(100vw - 20px));
    max-height: 62vh;
  }

  #deepseek-harness-skin-handle {
    align-self: flex-end;
  }
}
`
    /* @build:css:end */

    /* @build:art:start */
    const INLINE_ART = {

    }
    /* @build:art:end */

    const SKINS = Array.isArray(SERIES.skins) ? SERIES.skins : []
    const PALETTES = SERIES.palettes
    const LEGACY_SKINS = ['studio', 'neon', 'sakura', 'film']
    const DEFAULT_SKIN = OFF

    /* @build:icon:start */
    const WHALE_ICON = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2023.16%2017.04%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M22.9168%201.43018C22.6713%201.31018%2022.5658%201.53918%2022.4223%201.65519C22.3733%201.69269%2022.3318%201.74169%2022.2903%201.78669C21.9317%202.1697%2021.5127%202.42121%2020.9657%202.39121C20.1657%202.34621%2019.4827%202.59771%2018.8787%203.20973C18.7502%202.45521%2018.3236%202.0047%2017.6746%201.71569C17.3351%201.56568%2016.9916%201.41518%2016.7536%201.08867C16.5876%200.856163%2016.5421%200.597155%2016.4591%200.341647C16.4061%200.187643%2016.3536%200.0301382%2016.1761%200.00363739C15.9836%20-0.0263635%2015.9081%200.135141%2015.8326%200.270145C15.5306%200.822162%2015.4136%201.43018%2015.4251%202.0462C15.4516%203.43174%2016.0366%204.53527%2017.1991%205.3203C17.3311%205.4103%2017.3651%205.5003%2017.3236%205.63181C17.2441%205.90231%2017.1501%206.16482%2017.0671%206.43533C17.0141%206.60784%2016.9351%206.64584%2016.7501%206.57033C16.1121%206.30383%2015.5611%205.90931%2015.074%205.4328C14.2475%204.63328%2013.5%203.75075%2012.568%203.05973C12.349%202.89822%2012.13%202.74822%2011.9034%202.60522C10.9524%201.68169%2012.028%200.923165%2012.277%200.833162C12.5375%200.739159%2012.3675%200.41615%2011.5259%200.42015C10.6844%200.42365%209.91439%200.705658%208.93286%201.08117C8.78935%201.13767%208.63835%201.17867%208.48384%201.21267C7.59332%201.04367%206.66829%201.00617%205.70226%201.11517C3.88321%201.31768%202.43016%202.1777%201.36213%203.64575C0.0790928%205.4103%20-0.222916%207.41536%200.146595%209.50642C0.535106%2011.7105%201.66014%2013.535%203.38869%2014.9616C5.18125%2016.4406%207.24581%2017.1657%209.60138%2017.0266C11.0319%2016.9441%2012.6245%2016.7526%2014.421%2015.2321C14.874%2015.4576%2015.3496%2015.5476%2016.1381%2015.6151C16.7456%2015.6716%2017.3306%2015.5851%2017.7836%2015.4911C18.4931%2015.3411%2018.4441%2014.6841%2018.1876%2014.5636C16.1081%2013.595%2016.5646%2013.9891%2016.1496%2013.67C17.2061%2012.42%2018.8202%2010.1979%2019.3182%207.17235C19.3672%206.83834%2019.4297%206.36783%2019.4222%206.09732C19.4182%205.93231%2019.4562%205.86831%2019.6447%205.84931C20.1657%205.78931%2020.6712%205.64681%2021.1357%205.3913C22.4833%204.65528%2023.0268%203.44624%2023.1548%201.9972C23.1738%201.77569%2023.1508%201.54668%2022.9168%201.43018ZM11.1749%2014.4736C9.15936%2012.889%208.18184%2012.3675%207.77832%2012.39C7.40081%2012.4125%207.46881%2012.8445%207.55182%2013.126C7.63882%2013.404%207.75182%2013.5955%207.91033%2013.8396C8.01983%2014.0011%208.09533%2014.2411%207.80083%2014.4216C7.15181%2014.8231%206.02327%2014.2866%205.97027%2014.2601C4.65673%2013.4865%203.5587%2012.4655%202.78467%2011.069C2.03715%209.72493%201.60314%208.28289%201.53164%206.74384C1.51264%206.37233%201.62214%206.24082%201.99215%206.17332C2.47916%206.08332%202.98118%206.06432%203.46769%206.13582C5.52476%206.43633%207.27581%207.35586%208.74385%208.8129C9.58188%209.64243%2010.2159%2010.634%2010.8689%2011.6025C11.5634%2012.631%2012.3105%2013.611%2013.262%2014.4146C13.598%2014.6961%2013.866%2014.9101%2014.1225%2015.0681C13.349%2015.1546%2012.058%2015.1731%2011.1749%2014.4746L11.1749%2014.4736ZM12.141%208.25988C12.141%208.09488%2012.273%207.96338%2012.439%207.96338C12.4765%207.96338%2012.5105%207.97088%2012.541%207.98188C12.5825%207.99688%2012.6205%208.01938%2012.6505%208.05338C12.7035%208.10588%2012.7335%208.18088%2012.7335%208.25988C12.7335%208.42489%2012.6015%208.55639%2012.4355%208.55639C12.2695%208.55639%2012.141%208.42489%2012.141%208.25988ZM15.1415%209.79893C14.949%209.87793%2014.7565%209.94544%2014.5715%209.95294C14.2845%209.96794%2013.9715%209.85143%2013.8015%209.70893C13.5375%209.48742%2013.3485%209.36342%2013.2695%208.97691C13.2355%208.8119%2013.2545%208.55639%2013.2845%208.40989C13.3525%208.09438%2013.277%207.89187%2013.0545%207.70787C12.8735%207.55786%2012.643%207.51636%2012.39%207.51636C12.2955%207.51636%2012.209%207.47486%2012.1445%207.44136C12.039%207.38886%2011.9519%207.25735%2012.035%207.09585C12.0615%207.04335%2012.19%206.91584%2012.22%206.89334C12.5635%206.69784%2012.9595%206.76184%2013.326%206.90834C13.6655%207.04735%2013.9225%207.30236%2014.292%207.66287C14.6695%208.09838%2014.7375%208.21838%2014.9525%208.54539C15.1225%208.8009%2015.277%209.06341%2015.3831%209.36392C15.4471%209.55142%2015.3641%209.70493%2015.1415%209.79893Z%22%2F%3E%3C%2Fsvg%3E"
    /* @build:icon:end */

    const SIDEBAR_DEFAULTS = {
      studio: ['#f0d4c5', '#665044'], neon: ['#d1e7eb', '#365663'],
      sakura: ['#f4d9e3', '#674d60'], film: ['#e4e9d6', '#596049'],
    }

    // Region ids are fixed; persisted values never become selectors or HTML.
    const REGIONS = [
      { id: 'titlebar', name: '窗口标题栏', token: '--dsw-specific-sidebar-fill', opacity: 1 },
      { id: 'header', name: '对话顶部栏', token: '--dsw-alias-bg-base', opacity: 0.6 },
      { id: 'chat', name: '对话背景', token: '--dsw-alias-bg-base', opacity: 0.56 },
      { id: 'bubble', name: '消息气泡', token: '--dsw-specific-bubble', opacity: 0.12 },
      { id: 'code', name: '代码块', token: '--dsw-alias-markdown-code-block', opacity: 0.06 },
      { id: 'input', name: '消息输入框', token: '--dsw-specific-input-major', opacity: 0.96 },
      { id: 'rightbar', name: '右侧工具面板', token: '--dsw-alias-bg-layer-1', opacity: 0.9 },
      { id: 'menu', name: '菜单和弹窗', token: '--dsw-specific-menu', opacity: 0.96 },
    ]

    function allSkins(state) {
      return state.customSkins.map((custom) => ({
        ...PALETTES.find((palette) => palette.id === custom.palette), ...custom,
        custom: true, artSize: 'contain', artPosition: 'center', artFilter: 'none',
      }))
    }

    function activeSkin(state) {
      return allSkins(state).find((skin) => skin.id === state.skin)
    }

    function validColor(value) {
      return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null
    }

    function colorToHsl(color) {
      const [r, g, b] = color.slice(1).match(/../g).map((hex) => parseInt(hex, 16) / 255)
      const high = Math.max(r, g, b), low = Math.min(r, g, b)
      const delta = high - low, lightness = (high + low) / 2
      if (!delta) return { hue: 0, saturation: 0, lightness }
      const hue = 60 * (high === r ? ((g - b) / delta + 6) % 6 : high === g ? (b - r) / delta + 2 : (r - g) / delta + 4)
      return { hue, saturation: delta / (1 - Math.abs(2 * lightness - 1)), lightness }
    }

    function hueColor(hue, saturation, lightness) {
      const a = saturation * Math.min(lightness, 1 - lightness)
      return '#' + [0, 8, 4].map((offset) => {
        const k = (offset + hue / 30) % 12
        const unit = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
        return Math.round(unit * 255).toString(16).padStart(2, '0')
      }).join('')
    }

    function paletteForColor(color) {
      const hue = colorToHsl(color).hue
      const distance = (skin) => {
        const difference = Math.abs(hue - colorToHsl(skin.accent).hue)
        return Math.min(difference, 360 - difference)
      }
      return PALETTES.reduce((closest, skin) => distance(skin) < distance(closest) ? skin : closest).id
    }

    function readCustomSkins(value) {
      if (!Array.isArray(value)) return []
      const ids = new Set()
      return value.flatMap((skin) => {
        if (!skin || typeof skin !== 'object' || typeof skin.id !== 'string'
          || !/^custom-[a-z0-9-]+$/.test(skin.id) || ids.has(skin.id)
          || typeof skin.name !== 'string' || !skin.name.trim()
          || !PALETTES.some((palette) => palette.id === skin.palette)) return []
        ids.add(skin.id)
        return [{ id: skin.id, name: skin.name.trim().slice(0, 50), palette: skin.palette }]
      })
    }

    /**
     * Token names mirrored into the theme service. Kept short on purpose: these
     * are the alias tokens that decide whether a skin is recognisable at a
     * glance, and reading back more than this on every theme flip is wasted work.
     */
    const TOKEN_PROBE = [
      '--dsw-alias-bg-base',
      '--dsw-alias-bg-layer-1',
      '--dsw-alias-bg-layer-2',
      '--dsw-alias-label-primary',
      '--dsw-alias-label-secondary',
      '--dsw-alias-brand-primary',
      '--dsw-alias-border-l1',
      '--dsw-alias-border-l2',
      '--dsw-alias-interactive-bg-hover',
      '--dsw-alias-settings-card-fill',
      '--dsw-specific-sidebar-fill',
      '--dsw-specific-bubble',
    ]

    const DEFAULTS = Object.freeze({
      catalogVersion: 2,
      skin: DEFAULT_SKIN,
      artOpacity: 1,
      veil: 0,
      framing: {},
      customSkins: [],
      sidebarColors: {},
      regionColors: {},
      panelPosition: null,
      dockOpen: false,
    })

    /* ══════════════════════════════ state ══════════════════════════════ */

    /**
     * Read persisted state. Anything malformed degrades to the defaults rather
     * than throwing: a corrupt key must never cost the user their UI.
     * @returns {object} validated state, including per-skin picture framing.
     */
    function readState() {
      const fallback = { ...DEFAULTS }
      try {
        const raw = window.localStorage?.getItem(STORAGE_KEY)
        if (raw === null || raw === undefined) return fallback
        const parsed = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object') return fallback
        const unit = (value, name, maximum = 1) => (
          typeof value === 'number' && Number.isFinite(value)
            ? Math.min(maximum, Math.max(0, value))
            : fallback[name]
        )
        const customSkins = readCustomSkins(parsed.customSkins)
        const skins = allSkins({ customSkins })
        const known = skins.some((skin) => skin.id === parsed.skin)
        const sidebarColors = {}
        const regionColors = {}
        for (const skin of skins) {
          const color = validColor(parsed.sidebarColors?.[skin.id])
          if (color) sidebarColors[skin.id] = color
          const regions = {}
          for (const region of REGIONS) {
            const saved = parsed.regionColors?.[skin.id]?.[region.id]
            const fill = validColor(saved?.color)
            if (!fill) continue
            regions[region.id] = {
              color: fill,
              opacity: typeof saved.opacity === 'number' && Number.isFinite(saved.opacity)
                ? Math.min(1, Math.max(0, saved.opacity)) : region.opacity,
              text: validColor(saved.text),
            }
          }
          if (Object.keys(regions).length) regionColors[skin.id] = regions
        }
        const state = {
          catalogVersion: 2,
          skin: known ? parsed.skin : (parsed.skin === OFF ? OFF : fallback.skin),
          artOpacity: unit(parsed.artOpacity, 'artOpacity'),
          veil: LEGACY_SKINS.includes(parsed.skin) ? 0 : unit(parsed.veil, 'veil'),
          framing: readFraming(parsed.framing, skins),
          customSkins,
          sidebarColors,
          regionColors,
          panelPosition: normalizePanelPosition(parsed.panelPosition),
          // Deliberately NOT persisted: a panel left open across a restart is
          // clutter, not a preference.
          dockOpen: false,
        }
        return state
      } catch {
        return fallback
      }
    }

    /** Preserve the manifest's framing until this skin is adjusted. */
    function defaultFraming(skin) {
      const position = skin.artPosition ?? 'center'
      const percentages = position.match(/(\d+(?:\.\d+)?)%/g) ?? []
      return {
        fit: skin.artSize === 'cover' ? 'cover' : 'contain',
        zoom: 1,
        x: position.includes('right') ? 1 : position.includes('left') ? 0 : 0.5,
        y: position.includes('bottom') ? 1 : position.includes('top') ? 0
          : percentages.length ? Number(percentages[percentages.length - 1].slice(0, -1)) / 100 : 0.5,
      }
    }

    /** Both persisted values and slider input pass through the same limits. */
    function normalizeFraming(value, skin) {
      const defaults = defaultFraming(skin)
      const bounded = (key, min, max) => typeof value[key] === 'number' && Number.isFinite(value[key])
        ? Math.min(max, Math.max(min, value[key])) : defaults[key]
      return {
        fit: value.fit === 'cover' || value.fit === 'contain' ? value.fit : defaults.fit,
        zoom: bounded('zoom', 0.5, 2),
        x: bounded('x', 0, 1),
        y: bounded('y', 0, 1),
      }
    }

    function readFraming(value, skins = SKINS) {
      const framing = {}
      if (value === null || typeof value !== 'object') return framing
      for (const skin of skins) {
        const entry = value[skin.id]
        if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
          framing[skin.id] = normalizeFraming(entry, skin)
        }
      }
      return framing
    }

    /**
     * Persist state. Never writes `ui-theme.preference`: an unknown id there
     * makes the theme service throw `theme registry lost` mid-boot, which is a
     * far worse outcome than losing a slider position.
     * @param {object} state - state to store.
     */
    function writeState(state) {
      try {
        const { dockOpen, ...persisted } = state
        window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(persisted))
      } catch {
        /* a full or disabled localStorage costs persistence, never the skin */
      }
    }

    /**
     * The one store the panel, the layers and the shortcut all read.
     * @returns {object} store with subscribe / getSnapshot / set / toggleDock.
     */
    function createStore() {
      let value = readState()
      // Persist normalized defaults and migrations before any user interaction.
      writeState(value)
      const listeners = new Set()
      const emit = () => {
        for (const listener of [...listeners]) {
          try {
            listener()
          } catch (error) {
            console.error(`[${ID}] listener failed:`, error)
          }
        }
      }
      return {
        subscribe(listener) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        getSnapshot() {
          return value
        },
        set(patch) {
          value = { ...value, ...patch }
          writeState(value)
          emit()
        },
      }
    }

    /* ════════════════════════ service access ═══════════════════════════ */

    /**
     * Resolve a service off the restricted client context. A dynamic client half
     * receives `ctx.get(name)` as the documented read while richer contexts
     * expose the same value as a plain property; a missing service is a normal
     * outcome, never an error.
     * @param {any} ctx - the client context.
     * @param {string} name - service key.
     * @returns {any} the service, or undefined.
     */
    function service(ctx, name) {
      try {
        if (typeof ctx.get === 'function') {
          const value = ctx.get(name)
          if (value !== undefined && value !== null) return value
        }
      } catch {
        /* fall through to the property form */
      }
      try {
        const value = ctx[name]
        if (value !== undefined && value !== null) return value
      } catch {
        /* a throwing getter means the service is unavailable */
      }
      return undefined
    }

    /* ══════════════════════════ DOM layers ═════════════════════════════ */

    /**
     * Insert one owned stylesheet. A runtime-inserted tag is removed by its own
     * disposer, so disabling the plugin leaves no CSS behind.
     * @param {string} css - stylesheet body.
     * @returns {() => void} the remover.
     */
    function insertStyle(css) {
      const element = document.createElement('style')
      element.setAttribute('data-dsh-skin-style', ID)
      element.textContent = css
      document.head.append(element)
      return () => element.remove()
    }

    /**
     * Create the four fixed, click-through layers.
     *
     * They are PREPENDED to <body> so that, in the unlikely event a shell
     * surface ends up in the same stacking stratum, DOM order still puts the
     * skin underneath it.
     * @returns {{ layers: HTMLElement[], dispose: () => void }} the layers.
     */
    function createLayers() {
      const roles = ['backdrop', 'art', 'veil', 'decor']
      const layers = roles.map((role) => {
        const element = document.createElement('div')
        element.id = `${ID}-${role}`
        element.setAttribute('aria-hidden', 'true')
        return element
      })
      document.body.prepend(...layers)
      return {
        layers,
        dispose: () => {
          for (const layer of layers) layer.remove()
        },
      }
    }

    /* ══════════════════════ artwork resolution ══════════════════════════ */

    /** skin id -> 'pending' | 'ready' | 'missing'. Surfaced in the panel. */
    const artState = new Map()
    /** Dimensions of the actual painted bytes, independent of the Host route. */
    const artDimensions = new Map()
    /** Uploaded pictures are local Blob URLs; their bytes live in IndexedDB. */
    const uploadedArt = new Map()
    /** Diagnostics fetched from the Host half, shown in the panel footer. */
    let hostStatus = null

    /**
     * The same-origin URL the Host half serves one skin's artwork on.
     * @param {string} skinId - skin id.
     * @returns {string} absolute URL.
     */
    function artUrl(skinId) {
      return new URL(`${ROUTE}/art/${encodeURIComponent(skinId)}`, document.baseURI).href
    }

    /**
     * The URL actually painted for one skin.
     *
     * The inlined data URL is not a fallback, it is the source. Serving the
     * picture over a Host route made the wallpaper depend on a route being
     * registered, on the page's carrier forwarding to it, and on that carrier
     * resolving the resulting scheme from a CSS custom property — and the last
     * of those demonstrably works for an `<img>` and a thumbnail in the same
     * document while failing for the full-viewport layer. Chasing which of the
     * three it was cost an evening; a data URL has none of them.
     *
     * The route is still consulted, but only for skins with no inlined picture,
     * which is the case a user creates by emptying assets/ — not the case a user
     * ever wants by accident.
     * @param {string} skinId - skin id.
     * @returns {string | null} the URL to paint, or null when there is no picture at all.
     */
    function artSource(skinId) {
      return uploadedArt.get(skinId)?.url
        ?? INLINE_ART[skinId] ?? (artState.get(skinId) === 'ready' ? artUrl(skinId) : null)
    }

    function decodePicture(blob) {
      return new Promise((resolve, reject) => {
        const url = window.URL.createObjectURL(blob)
        const image = new Image()
        image.onload = () => {
          if (image.naturalWidth > 0 && image.naturalHeight > 0) {
            resolve({ url, width: image.naturalWidth, height: image.naturalHeight })
          } else {
            window.URL.revokeObjectURL(url)
            reject(new Error('无法读取图片尺寸，请选择另一张图片。'))
          }
        }
        image.onerror = () => {
          window.URL.revokeObjectURL(url)
          reject(new Error('无法读取图片，请选择 PNG、JPG、WebP、AVIF 或 GIF。'))
        }
        image.src = url
      })
    }

    /** Keep large image bytes out of localStorage, and publish only committed uploads. */
    function createPictureRepository(store, onChange) {
      let disposed = false
      let database
      const connection = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          reject(new Error('当前窗口无法保存图片，请重新打开 DSH。'))
          return
        }
        const request = window.indexedDB.open(`${ID}:pictures`, 1)
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('pictures')) {
            request.result.createObjectStore('pictures', { keyPath: 'id' })
          }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new Error('无法打开本机图片存储。'))
        request.onblocked = () => reject(new Error('图片存储被其他窗口占用，请关闭旧窗口后重试。'))
      })
      const transaction = async (mode, operation) => {
        await connection
        if (disposed || !database) throw new Error('外观设置已关闭，请重新打开后重试。')
        return new Promise((resolve, reject) => {
          const tx = database.transaction('pictures', mode)
          let result
          const request = operation(tx.objectStore('pictures'))
          request.onsuccess = () => { result = request.result }
          tx.oncomplete = () => resolve(result)
          tx.onerror = tx.onabort = () => reject(new Error('图片保存失败，请检查本机存储空间后重试。'))
        })
      }
      const ready = connection.then(async (db) => {
        database = db
        if (disposed) { db.close(); return }
        database.onversionchange = () => database.close()
        const records = await transaction('readonly', (table) => table.getAll())
        const known = new Set(allSkins(store.getSnapshot()).map((skin) => skin.id))
        for (const record of records) {
          if (disposed) break
          if (LEGACY_SKINS.includes(record.id)) {
            await transaction('readwrite', (table) => table.delete(record.id))
            continue
          }
          if (!known.has(record.id) || !(record.blob instanceof Blob)) continue
          try {
            const picture = await decodePicture(record.blob)
            if (disposed) { window.URL.revokeObjectURL(picture.url); break }
            uploadedArt.set(record.id, { ...picture, name: record.name })
          } catch {
            /* A damaged record must not prevent the remaining skins loading. */
          }
        }
        if (!disposed) onChange()
      })
      return {
        ready,
        async save(id, file) {
          await ready
          if (!file || !file.size || (!/^image\/(png|jpeg|webp|avif|gif)$/.test(file.type)
            && !/\.(png|jpe?g|webp|avif|gif)$/i.test(file.name ?? ''))) {
            throw new Error('请选择 PNG、JPG、WebP、AVIF 或 GIF 图片。')
          }
          const picture = await decodePicture(file)
          try {
            await transaction('readwrite', (table) => table.put({ id, blob: file, name: file.name ?? '图片' }))
            if (disposed) throw new Error('外观设置已关闭。')
          } catch (error) {
            window.URL.revokeObjectURL(picture.url)
            throw error
          }
          const previous = uploadedArt.get(id)
          uploadedArt.set(id, { ...picture, name: file.name ?? '图片' })
          if (previous) window.URL.revokeObjectURL(previous.url)
        },
        async remove(id) {
          await ready
          await transaction('readwrite', (table) => table.delete(id))
          const previous = uploadedArt.get(id)
          uploadedArt.delete(id)
          if (previous) window.URL.revokeObjectURL(previous.url)
        },
        dispose() {
          disposed = true
          database?.close()
          for (const picture of uploadedArt.values()) window.URL.revokeObjectURL(picture.url)
          uploadedArt.clear()
        },
      }
    }

    function sidebarColor(state, skin) {
      if (!skin) return '#d1e7eb'
      return state.sidebarColors[skin.id]
        ?? SIDEBAR_DEFAULTS[skin.palette ?? skin.id][document.body.hasAttribute('data-ds-dark-theme') ? 1 : 0]
    }

    function rgbOf(value, fallback = '#eef4f7') {
      const hex = value.match(/#[0-9a-f]{6}\b/i)?.[0] ?? (validColor(value) ? value : null)
      if (hex) return hex.slice(1).match(/../g).map((part) => parseInt(part, 16))
      const rgb = value.match(/rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/)
      return rgb ? rgb.slice(1, 4).map((part) => Math.round(Math.min(255, Math.max(0, Number(part))))) : rgbOf(fallback)
    }

    function readableText(rgb) {
      const linear = rgb.map((value) => value / 255)
        .map((unit) => unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4)
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722 > 0.179 ? '#182028' : '#f5f7fa'
    }

    function regionDefault(region) {
      const computed = window.getComputedStyle(document.body)
      const rgb = rgbOf(computed.getPropertyValue(region.token).trim(),
        document.body.hasAttribute('data-ds-dark-theme') ? '#151b24' : '#eef4f7')
      return { color: '#' + rgb.map((value) => value.toString(16).padStart(2, '0')).join(''), opacity: region.opacity, text: null }
    }

    let captionStyle
    function paintCaptionText(custom) {
      if (!custom) { captionStyle?.remove(); captionStyle = undefined; return }
      const shadow = document.querySelector('[data-windows-menu]')?.shadowRoot
      if (!shadow || captionStyle?.parentNode === shadow) return
      captionStyle = document.createElement('style')
      captionStyle.textContent = 'button { color: var(--skin-region-titlebar-fg, #182028) !important; }'
      shadow.append(captionStyle)
    }

    function clearRegionColors() {
      paintCaptionText(false)
      for (const region of REGIONS) {
        document.body.removeAttribute(`data-skin-region-${region.id}`)
        for (const suffix of ['fill', 'fg', 'muted']) document.body.style.removeProperty(`--skin-region-${region.id}-${suffix}`)
      }
      for (const name of ['--skin-default-fg', '--skin-default-muted']) document.body.style.removeProperty(name)
    }

    function applyRegionColors(state, skin) {
      if (!skin) { clearRegionColors(); return }
      const computed = window.getComputedStyle(document.body)
      const base = rgbOf(computed.getPropertyValue('--dsw-alias-bg-base').trim(),
        document.body.hasAttribute('data-ds-dark-theme') ? '#151b24' : '#eef4f7')
      document.body.style.setProperty('--skin-default-fg', computed.getPropertyValue('--dsw-alias-label-primary').trim())
      document.body.style.setProperty('--skin-default-muted', computed.getPropertyValue('--dsw-alias-label-secondary').trim())
      const selected = state.regionColors[skin.id] ?? {}
      const chat = selected.chat
      // A custom chat replaces the reading washes; its actual underlying
      // canvas therefore includes the black wallpaper shade, not a white panel.
      const canvas = base.map((value) => value * (1 - 0.96 * state.veil))
      const chatBase = chat ? rgbOf(chat.color).map((value, i) => value * chat.opacity + canvas[i] * (1 - chat.opacity)) : base
      for (const region of REGIONS) {
        const config = selected[region.id]
        if (!config) {
          document.body.removeAttribute(`data-skin-region-${region.id}`)
          for (const suffix of ['fill', 'fg', 'muted']) document.body.style.removeProperty(`--skin-region-${region.id}-${suffix}`)
          continue
        }
        const rgb = rgbOf(config.color)
        const underlying = ['chat', 'titlebar', 'header', 'rightbar'].includes(region.id)
          ? canvas : ['bubble', 'code', 'input'].includes(region.id) ? chatBase : base
        const blended = rgb.map((value, i) => value * config.opacity + underlying[i] * (1 - config.opacity))
        const fg = config.text ?? readableText(blended)
        document.body.style.setProperty(`--skin-region-${region.id}-fill`, `rgba(${rgb.join(',')},${config.opacity})`)
        document.body.style.setProperty(`--skin-region-${region.id}-fg`, fg)
        document.body.style.setProperty(`--skin-region-${region.id}-muted`, fg)
        document.body.setAttribute(`data-skin-region-${region.id}`, '')
      }
      paintCaptionText(selected.titlebar !== undefined)
    }

    function applySidebarColor(state, skin) {
      const color = skin && state.sidebarColors[skin.id]
      if (!color) {
        document.body.removeAttribute('data-skin-sidebar-custom')
        for (const name of SIDEBAR_VARS) document.body.style.removeProperty(name)
        return
      }
      const rgb = color.slice(1).match(/../g).map((hex) => parseInt(hex, 16) / 255)
        .map((unit) => unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4)
      const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
      const light = luminance > 0.179
      const properties = {
        '--skin-sidebar-fill': color,
        '--skin-sidebar-fg': light ? '#182028' : '#f5f7fa',
        '--skin-sidebar-muted': light ? '#4b5560' : '#d2d9e0',
        '--skin-sidebar-hover': light ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.10)',
        '--skin-sidebar-active': light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)',
        '--skin-sidebar-button': light ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.12)',
      }
      for (const [key, value] of Object.entries(properties)) document.body.style.setProperty(key, value)
      document.body.setAttribute('data-skin-sidebar-custom', '')
    }

    /**
     * Probe every skin's artwork up front, by loading it as an image.
     *
     * Two reasons this is done for all four at once rather than lazily on
     * switch: an <img> load is not subject to CORS, and by the time you click a
     * card the route has already been checked — which is what makes switching
     * feel instant instead of showing a blank frame first.
     * @param {() => void} onChange - called once per probe that settles.
     */
    function preloadArtwork(onChange) {
      const images = []
      for (const skin of SKINS) {
        artState.set(skin.id, 'pending')
        const image = new Image()
        const settle = (verdict) => {
          artState.set(skin.id, verdict)
          onChange()
        }
        image.onload = () => settle('ready')
        image.onerror = () => settle('missing')
        image.src = artUrl(skin.id)
        images.push(image)
      }
      return () => {
        for (const image of images) image.onload = image.onerror = null
      }
    }

    function preloadDimensions(onChange) {
      const images = []
      for (const skin of SKINS) {
        const source = INLINE_ART[skin.id] ?? artUrl(skin.id)
        const image = new Image()
        image.onload = () => {
          if (image.naturalWidth > 0 && image.naturalHeight > 0) {
            artDimensions.set(skin.id, { width: image.naturalWidth, height: image.naturalHeight })
            onChange()
          }
        }
        image.src = source
        images.push(image)
      }
      return () => {
        for (const image of images) image.onload = null
      }
    }

    /**
     * Ask the Host half what it resolved — version, artwork paths, byte sizes —
     * so the panel can explain a missing picture and name the exact file to
     * drop in, instead of silently showing a colour-only skin.
     * @returns {Promise<void>} completion.
     */
    async function fetchStatus() {
      try {
        const response = await window.fetch(`${ROUTE}/status`, { cache: 'no-store' })
        if (!response.ok) return
        const parsed = await response.json()
        if (parsed !== null && typeof parsed === 'object') {
          hostStatus = parsed
          refreshPanel?.()
        }
      } catch {
        /* the route being unreachable is not an error worth surfacing */
      }
    }

    /* ═══════════════════════ painting the skin ══════════════════════════ */

    /** Releases the token layer this plugin currently holds, if any. */
    let releaseTokens = () => {}
    /** Signature of the layer currently published, so an unchanged one is skipped. */
    let pushedSignature = null

    /**
     * Mirror the stylesheet's resolved alias tokens into the theme service.
     *
     * The stylesheet alone should win: an `!important` author rule outranks a
     * plain inline `style` declaration, which is what a registered theme writes.
     * But "should" is doing real work in that sentence — if a future theme ever
     * writes its aliases as IMPORTANT inline declarations, the cascade flips and
     * the skin silently reverts to the default palette. Re-publishing the same
     * values through the documented third-party override hook costs a dozen
     * computed-style reads and removes that entire class of failure.
     *
     * ── WHY IT COMPARES BEFORE PUBLISHING ────────────────────────────────────
     *
     * This used to publish unconditionally, and in dark mode that wedged the
     * renderer outright. `overrideTokens` makes the theme service publish a new
     * snapshot, ui-layout applies that snapshot to the document, and applying it
     * sets `body[data-ds-dark-theme]` — through `setAttribute`, which queues a
     * mutation record even when the value does not change. The scheme observer
     * below listened for exactly that attribute, so it re-entered this function,
     * which published again. Two parties handing the same value back and forth
     * as fast as the microtask queue allows.
     *
     * In light mode the shell REMOVES that attribute instead of setting it, and
     * removing an absent attribute queues nothing — which is why this only ever
     * broke in dark mode, and why every light-mode screenshot looked perfect.
     *
     * Skipping the publish when the values are unchanged breaks the cycle at its
     * source: the second pass reads the same numbers and does nothing.
     * @param {any} ctx - client context.
     */
    function syncTokens(ctx) {
      if (!document.body.hasAttribute(ATTR)) return
      const theme = service(ctx, 'theme')
      if (theme === undefined || typeof theme.overrideTokens !== 'function') return
      try {
        const computed = window.getComputedStyle(document.body)
        const layer = {}
        for (const name of TOKEN_PROBE) {
          const value = computed.getPropertyValue(name).trim()
          if (value !== '') layer[name] = { light: value, dark: value }
        }
        const signature = JSON.stringify(layer)
        if (signature === pushedSignature) return
        pushedSignature = signature

        releaseTokens()
        releaseTokens = () => {}
        if (Object.keys(layer).length === 0) return
        releaseTokens = theme.overrideTokens(ID, layer)
      } catch (error) {
        console.error(`[${ID}] token override refused:`, error)
      }
    }

    /**
     * Paint one state onto the document.
     *
     * Called on every state change — including each tick of a slider drag — so
     * it must not create or destroy any node. The four layers are built once for
     * the lifetime of the plugin; everything a skin change touches here is an
     * attribute or a custom property, which is what keeps switching instant.
     * @param {any} ctx - client context.
     * @param {object} state - current state.
     */
    const SIDEBAR_VARS = ['--skin-sidebar-fill', '--skin-sidebar-fg', '--skin-sidebar-muted',
      '--skin-sidebar-hover', '--skin-sidebar-active', '--skin-sidebar-button']
    const BODY_VARS = ['--skin-art-size', '--skin-art-position', '--skin-art-filter',
      '--skin-user-art', '--skin-user-veil', '--skin-user-decor', '--skin-user-surface', ...SIDEBAR_VARS]

    function clearAppearance() {
      document.body.removeAttribute(ATTR)
      document.body.removeAttribute('data-skin-sidebar-custom')
      clearRegionColors()
      document.documentElement.style.removeProperty('--skin-art')
      for (const name of BODY_VARS) document.body.style.removeProperty(name)
      releaseTokens()
      releaseTokens = () => {}
      pushedSignature = null
    }

    function applyState(ctx, state) {
      const body = document.body
      const root = document.documentElement
      const skin = activeSkin(state)
      if (skin === undefined) {
        clearAppearance()
        return
      }

      // Ordinary opacity only: 100% paints the uploaded bytes without filters.
      body.style.setProperty('--skin-user-art', String(Math.min(1, Math.max(0, state.artOpacity))))
      body.style.setProperty('--skin-user-veil', String(state.veil))
      body.style.setProperty('--skin-user-decor', '0')
      body.style.setProperty('--skin-user-surface', '1')
      body.setAttribute(ATTR, skin.palette ?? skin.id)
      applySidebarColor(state, skin)
      applyRegionColors(state, skin)

      const framing = state.framing[skin.id]
      const dimensions = uploadedArt.get(skin.id) ?? artDimensions.get(skin.id)
      let size = framing?.fit ?? skin.artSize ?? 'cover'
      if (framing && dimensions) {
        // Scale the image itself, never the fixed layer. This gives contain and
        // cover the same predictable zoom and keeps positioning responsive.
        const fitScale = Math[framing.fit === 'cover' ? 'max' : 'min'](
          window.innerWidth / dimensions.width, window.innerHeight / dimensions.height,
        )
        size = `${dimensions.width * fitScale * framing.zoom}px ${dimensions.height * fitScale * framing.zoom}px`
      }
      body.style.setProperty('--skin-art-size', size)
      body.style.setProperty('--skin-art-position', framing
        ? `${framing.x * 100}% ${framing.y * 100}%` : skin.artPosition ?? 'center')
      body.style.setProperty('--skin-art-filter', 'none')

      // The picture is published unconditionally, and it comes from the bundle
      // unless the Host route has been confirmed to answer.
      //
      // Two revisions of this line were wrong before it. The first wrote `none`
      // until an asynchronous probe said "ready" — and nothing re-ran the
      // function when the probe settled, so the value was computed once, before
      // any image had been looked at, and never corrected. The second published
      // the route URL unconditionally, which made the wallpaper depend on a
      // route that could be unregistered at any recomposition. Inlining the
      // bytes removes the dependency rather than re-arranging it.
      const source = artSource(skin.id)
      if (source === null) root.style.removeProperty('--skin-art')
      else root.style.setProperty('--skin-art', `url("${source}")`)

      syncTokens(ctx)
    }

    /* ══════════════════════════ the panel ═══════════════════════════════ */

    function normalizePanelPosition(value) {
      return value && typeof value.x === 'number' && Number.isFinite(value.x) && value.x >= 0
        && typeof value.y === 'number' && Number.isFinite(value.y) && value.y >= 0
        ? { x: value.x, y: value.y } : null
    }

    /** Move only the settings panel; the whale remains at its fixed corner. */
    function bindPanelDrag(panel, store, actions) {
      const head = panel.querySelector('[data-role="head"]')
      let saved = store.getSnapshot().panelPosition
      let position = saved ? { ...saved } : null
      let drag = null
      let disposed = false

      const place = (point, rect = panel.getBoundingClientRect()) => {
        if (!rect.width || !rect.height) return
        position = {
          x: Math.min(Math.max(8, window.innerWidth - rect.width - 8), Math.max(8, point.x)),
          y: Math.min(Math.max(8, window.innerHeight - rect.height - 8), Math.max(8, point.y)),
        }
        panel.style.left = `${position.x}px`
        panel.style.top = `${position.y}px`
        panel.style.right = 'auto'
        panel.style.bottom = 'auto'
      }

      const finish = (event, persist = true) => {
        if (!drag || (event && event.pointerId !== drag.id)) return
        const id = drag.id
        // Clear first: releasing capture dispatches lostpointercapture too.
        drag = null
        head.removeAttribute('data-dragging')
        if (head.hasPointerCapture(id)) head.releasePointerCapture(id)
        if (persist && !disposed && position) actions.setPanelPosition(position)
      }

      const update = () => {
        if (disposed) return
        const state = store.getSnapshot()
        if (!state.dockOpen) { finish(); return }
        if (!drag && state.panelPosition !== saved) {
          saved = state.panelPosition
          position = saved ? { ...saved } : null
        }
        const rect = panel.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        if (position) place(position, rect)
        else if (rect.left < 8 || rect.top < 8 || rect.right > window.innerWidth - 8 || rect.bottom > window.innerHeight - 8) {
          place({ x: rect.left, y: rect.top }, rect)
        }
      }

      const down = (event) => {
        if (disposed || drag || !store.getSnapshot().dockOpen || event.button !== 0
          || event.isPrimary === false || event.target.closest?.('button')) return
        const rect = panel.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        head.setPointerCapture(event.pointerId)
        drag = { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top }
        place({ x: rect.left, y: rect.top }, rect)
        head.setAttribute('data-dragging', '')
        event.preventDefault()
      }
      const move = (event) => {
        if (disposed || !drag || event.pointerId !== drag.id) return
        place({ x: event.clientX - drag.x, y: event.clientY - drag.y })
        event.preventDefault()
      }
      const blur = () => finish()
      const events = { pointerdown: down, pointermove: move,
        pointerup: finish, pointercancel: finish, lostpointercapture: finish }
      for (const [type, handler] of Object.entries(events)) head.addEventListener(type, handler)
      head.setAttribute('title', '按住标题栏拖动面板')
      window.addEventListener('resize', update)
      window.addEventListener('blur', blur)
      const sizeObserver = window.ResizeObserver ? new window.ResizeObserver(update) : null
      sizeObserver?.observe(panel)

      return {
        update,
        dispose() {
          disposed = true
          finish(undefined, false)
          for (const [type, handler] of Object.entries(events)) head.removeEventListener(type, handler)
          window.removeEventListener('resize', update)
          window.removeEventListener('blur', blur)
          sizeObserver?.disconnect()
        },
      }
    }

    /** Late-bound repaint hook, set while the panel is mounted. */
    let refreshPanel

    /**
     * One gallery card.
     * @param {object} skin - `{ id, name }`; the OFF entry is synthesised by the caller.
     * @returns {HTMLElement} the card.
     */
    function createCard(skin) {
      const card = document.createElement('button')
      card.type = 'button'
      card.dataset.role = 'card'
      card.dataset.skin = skin.id
      card.setAttribute('title', skin.name)
      card.setAttribute('aria-pressed', 'false')

      const thumb = document.createElement('span')
      thumb.dataset.role = 'thumb'

      const text = document.createElement('span')
      const name = document.createElement('span')
      name.dataset.role = 'name'
      name.textContent = skin.name
      text.append(name)

      const tick = document.createElement('span')
      tick.dataset.role = 'tick'
      tick.textContent = '✓'

      card.append(thumb, text, tick)
      return card
    }

    /**
     * Build the dock once and return its handle.
     * @param {object} store - the state store.
     * @param {object} actions - write actions.
     * @returns {{ update: () => void, dispose: () => void }} the handle.
     */
    function mountPanel(store, actions) {
      const dock = document.createElement('div')
      dock.id = `${ID}-dock`
      dock.dataset.open = 'false'

      const panel = document.createElement('div')
      panel.id = `${ID}-panel`
      panel.setAttribute('role', 'dialog')
      panel.setAttribute('aria-label', '外观设置')
      panel.innerHTML = [
        '<div data-role="head">',
        '<span data-role="title">外观设置</span>',
        '<button type="button" data-role="close" aria-label="关闭面板">✕</button>',
        '</div>',
        '<div data-role="body">',
        '<div data-role="grid"></div>',
        '<details data-role="new-skin"><summary>＋ 添加皮肤</summary>',
        '<label data-role="field">皮肤名称<input type="text" data-role="new-name" aria-label="新皮肤名称" maxlength="50" placeholder="例如：我的壁纸"></label>',
        '<div data-role="field"><span>皮肤颜色</span><div data-role="new-color-row">',
        '<input type="range" data-role="new-hue" aria-label="新皮肤彩色色条" min="0" max="360" step="1">',
        '<input type="color" data-role="new-color" aria-label="新皮肤颜色" title="调整颜色深浅"></div>',
        '<output data-role="new-color-value"></output></div>',
        '<button type="button" data-role="add-skin">选择图片并添加</button>',
        '<input type="file" data-role="new-file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" hidden>',
        '</details>',
        '<p data-role="message" role="status" aria-live="polite"></p>',
        '<div data-role="controls">',
        '<div data-role="section-head"><b>当前皮肤图片</b></div>',
        '<div data-role="art-actions">',
        '<button type="button" data-role="replace-art">上传图片替换</button>',
        '<button type="button" data-role="delete-skin">删除皮肤</button></div>',
        '<input type="file" data-role="replace-file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" hidden>',
        '<div data-role="section-head"><b>工作区颜色</b>',
        '<button type="button" data-role="reset-color">默认颜色</button></div>',
        '<div data-role="color-row">',
        '<input type="color" data-role="sidebar-color" aria-label="工作区颜色">',
        '<input type="text" data-role="sidebar-hex" aria-label="工作区颜色十六进制" maxlength="7" placeholder="#RRGGBB" spellcheck="false"></div>',
        '<div data-role="section-head"><b>区域颜色</b>',
        '<button type="button" data-role="reset-region">恢复当前区域</button></div>',
        '<select data-role="region-select" aria-label="选择界面区域">',
        ...REGIONS.map((region) => `<option value="${region.id}">${region.name}</option>`),
        '</select>',
        '<div data-role="region-color-row">',
        '<input type="range" data-role="region-hue" aria-label="区域彩色色条" min="0" max="360" step="1">',
        '<input type="color" data-role="region-color" aria-label="区域背景颜色" title="调整颜色深浅"></div>',
        '<input type="text" data-role="region-hex" aria-label="区域颜色十六进制" maxlength="7" placeholder="#RRGGBB" spellcheck="false">',
        '<label data-role="control"><span>颜色浓度</span>',
        '<input type="range" data-role="region-opacity" aria-label="区域颜色浓度" min="0" max="100" step="1">',
        '<span data-role="region-opacity-value"></span></label>',
        '<div data-role="region-text-row"><span>文字颜色</span>',
        '<input type="color" data-role="region-text" aria-label="区域文字颜色">',
        '<button type="button" data-role="region-auto-text">自动</button>',
        '<span data-role="region-status"></span></div>',
        '<p data-role="effects-hint">每个区域独立保存。浓度 0% 透明、100% 纯色；文字可自动配色，也可自由选择。</p>',
        '<button type="button" data-role="reset-regions">恢复本皮肤所有区域颜色</button>',
        '<div data-role="framing-head"><b>图片位置</b>',
        '<button type="button" data-role="reset-framing">还原位置</button></div>',
        '<div data-role="fit-options" aria-label="图片适配方式">',
        '<button type="button" data-fit="cover" aria-pressed="false">铺满屏幕</button>',
        '<button type="button" data-fit="contain" aria-pressed="false">完整显示</button></div>',
        '<label data-role="control"><span>图片缩放</span>',
        '<input type="range" aria-label="图片缩放" data-frame="zoom" min="50" max="200" step="5">',
        '<span data-role="value"></span></label>',
        '<label data-role="control"><span>横向位置</span>',
        '<input type="range" aria-label="横向位置" data-frame="x" min="0" max="100" step="1">',
        '<span data-role="value"></span></label>',
        '<label data-role="control"><span>纵向位置</span>',
        '<input type="range" aria-label="纵向位置" data-frame="y" min="0" max="100" step="1">',
        '<span data-role="value"></span></label>',
        '<p data-role="framing-hint">每套分别记住。选完整显示可减少裁切；铺满时，位置只在有裁切的方向上移动。</p>',
        '<div data-role="levels-title">画面效果</div>',
        '<label data-role="control"><span>立绘浓度</span>',
        '<input type="range" data-key="artOpacity" aria-label="立绘浓度" min="0" max="100" step="1">',
        '<span data-role="value"></span></label>',
        '<label data-role="control"><span>画面压暗</span>',
        '<input type="range" data-key="veil" min="0" max="100" step="1">',
        '<span data-role="value"></span></label>',
        '<p data-role="effects-hint">立绘 0% 透明、100% 为原图，不增强颜色。画面压暗独立调整，0% 不压暗。</p>',
        '</div>',
        '</div>',
        '<div data-role="foot"></div>',
      ].join('')

      const grid = panel.querySelector('[data-role="grid"]')
      const cards = new Map()
      const newColor = panel.querySelector('[data-role="new-color"]')
      const newHue = panel.querySelector('[data-role="new-hue"]')
      const newColorValue = panel.querySelector('[data-role="new-color-value"]')
      const initialSkin = activeSkin(store.getSnapshot())
      panel.querySelector('[data-role="new-skin"]').open = allSkins(store.getSnapshot()).length === 0
      newColor.value = sidebarColor(store.getSnapshot(), initialSkin)
      const refreshNewColor = () => {
        const color = validColor(newColor.value)
        if (!color) return
        newHue.value = String(Math.round(colorToHsl(color).hue))
        newHue.style.setProperty('--skin-hue-thumb', color)
        newHue.setAttribute('aria-valuetext', color)
        newColorValue.textContent = color.toUpperCase()
      }
      newColor.addEventListener('input', refreshNewColor)
      newHue.addEventListener('input', () => {
        const { saturation, lightness } = colorToHsl(newColor.value)
        newColor.value = hueColor(Number(newHue.value), saturation || 0.65, lightness > 0 && lightness < 1 ? lightness : 0.75)
        refreshNewColor()
      })
      refreshNewColor()

      panel.querySelector('[data-role="close"]').addEventListener('click', () => actions.setDockOpen(false))

      grid.addEventListener('click', (event) => {
        const card = event.target.closest('[data-role="card"]')
        if (card === null || card === undefined) return
        actions.setSkin(card.dataset.skin)
      })

      const sliders = []
      for (const input of panel.querySelectorAll('input[type="range"]')) {
        if (!input.dataset.key && !input.dataset.frame) continue
        const output = input.parentElement.querySelector('[data-role="value"]')
        sliders.push({ input, output, key: input.dataset.key, frame: input.dataset.frame })
        input.addEventListener('input', () => {
          const value = Number(input.value) / 100
          if (input.dataset.frame) actions.setFraming({ [input.dataset.frame]: value })
          else actions.setLevel(input.dataset.key, value)
        })
      }
      const fitButtons = panel.querySelectorAll('[data-fit]')
      for (const button of fitButtons) {
        button.addEventListener('click', () => actions.setFraming({ fit: button.dataset.fit, zoom: 1 }))
      }
      panel.querySelector('[data-role="reset-framing"]').addEventListener('click', actions.resetFraming)

      const message = panel.querySelector('[data-role="message"]')
      const uploadButton = panel.querySelector('[data-role="replace-art"]')
      const addButton = panel.querySelector('[data-role="add-skin"]')
      const deleteButton = panel.querySelector('[data-role="delete-skin"]')
      const replaceFile = panel.querySelector('[data-role="replace-file"]')
      const newFile = panel.querySelector('[data-role="new-file"]')
      const nameInput = panel.querySelector('[data-role="new-name"]')
      const colorInput = panel.querySelector('[data-role="sidebar-color"]')
      const colorHex = panel.querySelector('[data-role="sidebar-hex"]')
      const regionSelect = panel.querySelector('[data-role="region-select"]')
      const regionColor = panel.querySelector('[data-role="region-color"]')
      const regionHex = panel.querySelector('[data-role="region-hex"]')
      const regionHue = panel.querySelector('[data-role="region-hue"]')
      const regionOpacity = panel.querySelector('[data-role="region-opacity"]')
      const regionText = panel.querySelector('[data-role="region-text"]')
      regionSelect.value = REGIONS[0].id
      const selectedRegion = () => REGIONS.find((region) => region.id === regionSelect.value) ?? REGIONS[0]
      const editRegion = (change) => actions.setRegionColor(selectedRegion().id, change)
      regionSelect.addEventListener('change', () => update())
      regionColor.addEventListener('input', () => editRegion({ color: regionColor.value }))
      regionHex.addEventListener('change', () => {
        if (validColor(regionHex.value)) editRegion({ color: regionHex.value })
        else { notify('颜色格式请使用 #RRGGBB。', true); update() }
      })
      regionHue.addEventListener('input', () => {
        const { saturation, lightness } = colorToHsl(regionColor.value)
        editRegion({ color: hueColor(Number(regionHue.value), saturation || 0.65, lightness > 0 && lightness < 1 ? lightness : 0.75) })
      })
      regionOpacity.addEventListener('input', () => editRegion({ opacity: Number(regionOpacity.value) / 100 }))
      regionText.addEventListener('input', () => editRegion({ text: regionText.value }))
      panel.querySelector('[data-role="region-auto-text"]').addEventListener('click', () => editRegion({ text: null }))
      panel.querySelector('[data-role="reset-region"]').addEventListener('click', () => actions.resetRegionColor(selectedRegion().id))
      panel.querySelector('[data-role="reset-regions"]').addEventListener('click', () => actions.resetRegionColors())
      let busy = false
      let mounted = true
      let replaceTarget
      let addOptions
      const notify = (text, error = false) => {
        if (!mounted) return
        message.textContent = text
        message.dataset.tone = error ? 'error' : 'success'
      }
      const run = async (operation, success) => {
        if (busy) return
        busy = true
        update()
        notify('正在保存…')
        try {
          await operation()
          notify(success)
        } catch (error) {
          notify(error instanceof Error ? error.message : '保存失败，请重试。', true)
        } finally {
          busy = false
          if (mounted) update()
        }
      }
      uploadButton.addEventListener('click', () => {
        replaceTarget = store.getSnapshot().skin
        replaceFile.value = ''
        replaceFile.click()
      })
      replaceFile.addEventListener('change', () => {
        const file = replaceFile.files?.[0]
        if (file) void run(() => actions.replacePicture(replaceTarget, file), '图片已保存。')
      })
      addButton.addEventListener('click', () => {
        addOptions = { name: nameInput.value.trim(), color: newColor.value }
        newFile.value = ''
        newFile.click()
      })
      newFile.addEventListener('change', () => {
        const file = newFile.files?.[0]
        if (!file) return
        void run(async () => {
          await actions.addSkin(file, addOptions ?? { name: nameInput.value.trim(), color: newColor.value })
          nameInput.value = ''
          panel.querySelector('[data-role="new-skin"]').open = false
        }, '新皮肤已添加。')
      })
      deleteButton.addEventListener('click', () => {
        const skin = activeSkin(store.getSnapshot())
        if (skin?.custom && window.confirm(`删除皮肤“${skin.name}”？`)) {
          void run(() => actions.deleteSkin(skin.id), '皮肤已删除。')
        }
      })
      colorInput.addEventListener('input', () => actions.setSidebarColor(colorInput.value))
      colorHex.addEventListener('change', () => {
        if (validColor(colorHex.value)) actions.setSidebarColor(colorHex.value)
        else { notify('颜色格式请使用 #RRGGBB，例如 #d1e7eb。', true); update() }
      })
      panel.querySelector('[data-role="reset-color"]').addEventListener('click', actions.resetSidebarColor)

      const handle = document.createElement('button')
      handle.id = `${ID}-handle`
      handle.type = 'button'
      handle.setAttribute('aria-haspopup', 'dialog')
      handle.setAttribute('aria-expanded', 'false')
      handle.setAttribute('aria-label', '外观设置')
      handle.setAttribute('title', '外观设置')
      handle.innerHTML = `<img data-role="whale" src="${WHALE_ICON}" alt="" aria-hidden="true">`
      handle.addEventListener('click', () => actions.setDockOpen(store.getSnapshot().dockOpen !== true))

      dock.append(panel, handle)
      document.body.append(dock)
      const dragging = bindPanelDrag(panel, store, actions)

      const foot = panel.querySelector('[data-role="foot"]')
      const controls = panel.querySelector('[data-role="controls"]')

      const update = () => {
        const state = store.getSnapshot()
        const active = activeSkin(state)
        const isOff = state.skin === OFF || active === undefined

        dock.dataset.open = state.dockOpen === true ? 'true' : 'false'
        handle.setAttribute('aria-expanded', state.dockOpen === true ? 'true' : 'false')

        const skins = allSkins(state)
        const entries = [{ id: OFF, name: '官方外观' }, ...skins]
        const wanted = new Set(entries.map((skin) => skin.id))
        for (const [id, card] of cards) {
          if (!wanted.has(id)) { card.remove(); cards.delete(id) }
        }
        for (const skin of entries) {
          if (!cards.has(skin.id)) {
            const card = createCard(skin)
            cards.set(skin.id, card)
            grid.append(card)
          }
        }
        for (const [id, card] of cards) {
          card.setAttribute('aria-pressed', id === state.skin ? 'true' : 'false')
        }

        for (const skin of skins) {
          const card = cards.get(skin.id)
          if (card === undefined) continue
          const thumb = card.querySelector('[data-role="thumb"]')
          thumb.dataset.art = artState.get(skin.id) === 'ready' ? 'live' : 'inline'
          const source = artSource(skin.id)
          if (source === null) thumb.style.removeProperty('--skin-thumb')
          else thumb.style.setProperty('--skin-thumb', `url("${source}")`)
        }

        controls.hidden = isOff
        for (const button of [uploadButton, addButton, deleteButton]) button.disabled = busy
        if (!skins.length) panel.querySelector('[data-role="new-skin"]').open = true
        deleteButton.hidden = isOff || !active.custom
        if (!isOff) {
          colorInput.value = sidebarColor(state, active)
          if (document.activeElement !== colorHex) colorHex.value = colorInput.value
          const region = selectedRegion()
          const saved = state.regionColors[active.id]?.[region.id]
          const config = saved ?? regionDefault(region)
          regionColor.value = config.color
          if (document.activeElement !== regionHex) regionHex.value = config.color
          regionHue.value = String(Math.round(colorToHsl(config.color).hue))
          regionHue.style.setProperty('--skin-hue-thumb', config.color)
          regionHue.setAttribute('aria-valuetext', config.color)
          regionOpacity.value = String(Math.round(config.opacity * 100))
          panel.querySelector('[data-role="region-opacity-value"]').textContent = `${regionOpacity.value}%`
          regionText.value = config.text ?? (document.body.style.getPropertyValue(`--skin-region-${region.id}-fg`) || readableText(rgbOf(config.color)))
          panel.querySelector('[data-role="region-auto-text"]').setAttribute('aria-pressed', config.text ? 'false' : 'true')
          panel.querySelector('[data-role="region-status"]').textContent = saved ? '已自定义' : '默认'
        }
        const framing = isOff ? null : state.framing[active.id] ?? defaultFraming(active)
        for (const button of fitButtons) {
          button.setAttribute('aria-pressed', button.dataset.fit === framing?.fit ? 'true' : 'false')
        }
        for (const { input, output, key, frame } of sliders) {
          const value = Math.round((frame ? framing?.[frame] ?? 1 : state[key] ?? 1) * 100)
          input.value = String(value)
          output.textContent = `${value}%`
        }

        foot.replaceChildren(...footerNodes(isOff, active))
        dragging.update()
      }

      return {
        update,
        notify,
        dispose: () => {
          mounted = false
          dragging.dispose()
          dock.remove()
        },
      }
    }

    /**
     * The panel footer: what is actually loaded, and what to do when it is not.
     *
     * A skin that silently loses its artwork is the single most confusing
     * failure this plugin has, so when art is missing the footer stops being
     * decoration and names the exact directory to drop files into.
     * @param {boolean} isOff - whether the official look is selected.
     * @returns {Node[]} footer content.
     */
    function footerNodes(isOff, active) {
      const nodes = []
      const line = (text, tone) => {
        const span = document.createElement('span')
        if (tone !== undefined) span.dataset.tone = tone
        span.textContent = text
        return span
      }

      nodes.push(line(isOff ? '当前为官方外观。' : uploadedArt.has(active?.id)
        ? '当前图片已保存在本机。' : '图片未能读取，请上传图片。'))
      nodes.push(document.createElement('br'))
      nodes.push(line('Ctrl+Alt+Q 开关面板 · 上传与设置仅保存在本机。'))

      return nodes
    }

    /* ═══════════════════════ keyboard & dismissal ═══════════════════════ */

    /**
     * Wire the global shortcut and the two ways out of the panel.
     * @param {object} store - the state store.
     * @param {object} actions - write actions.
     * @returns {() => void} the remover.
     */
    function bindInteractions(store, actions) {
      const onKeyDown = (event) => {
        if (!(event.ctrlKey || event.metaKey) || !event.altKey) return
        const code = event.code

        if (code === 'KeyQ' || code === 'KeyJ') {
          event.preventDefault()
          actions.setDockOpen(store.getSnapshot().dockOpen !== true)
          return
        }

        if (/^Digit[0-9]$/.test(code)) {
          const index = Number(code.slice(-1)) - 1
          event.preventDefault()
          if (index < 0) actions.setSkin(OFF)
          else {
            const skin = allSkins(store.getSnapshot())[index]
            if (skin) actions.setSkin(skin.id)
          }
        }
      }

      const onPointerDown = (event) => {
        if (store.getSnapshot().dockOpen !== true) return
        const dock = document.getElementById(`${ID}-dock`)
        if (dock !== null && !dock.contains(event.target)) actions.setDockOpen(false)
      }

      const onKeyUp = (event) => {
        if (event.key === 'Escape' && store.getSnapshot().dockOpen === true) actions.setDockOpen(false)
      }

      window.addEventListener('keydown', onKeyDown, true)
      document.addEventListener('pointerdown', onPointerDown, true)
      document.addEventListener('keydown', onKeyUp)

      return () => {
        window.removeEventListener('keydown', onKeyDown, true)
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('keydown', onKeyUp)
      }
    }

    /* ══════════════════════════ plugin body ═════════════════════════════ */

    /**
     * Run `start` as soon as a document body exists.
     *
     * `dsh.client.immediately` materializes this bundle before the shell paints,
     * which is what stops a skin from flashing the official palette for a frame
     * — but it also means `document.body` can still be null when `apply` runs.
     * The first revision simply returned in that case, so whether the skin
     * existed at all depended on a timing detail nobody could observe.
     * @param {() => (() => void)} start - builds the layer; returns its teardown.
     * @returns {() => void} teardown, valid whether or not the body had arrived.
     */
    function whenBodyReady(start) {
      if (document.body !== null) return start()

      let teardown = () => {}
      let cancelled = false
      const onReady = () => {
        document.removeEventListener('DOMContentLoaded', onReady)
        if (cancelled) return
        teardown = start()
      }
      document.addEventListener('DOMContentLoaded', onReady)
      return () => {
        cancelled = true
        document.removeEventListener('DOMContentLoaded', onReady)
        teardown()
      }
    }

    /**
     * Client plugin body. Every external resource is owned by one ctx.effect, so
     * disabling or uninstalling the plugin restores the official UI completely.
     * @param {any} ctx - the client context.
     */
    function apply(ctx) {
      const store = createStore()
      let pictures
      const actions = {
        setSkin: (skin) => store.set({ skin: allSkins(store.getSnapshot()).some((item) => item.id === skin) ? skin : OFF }),
        setDockOpen: (open) => store.set({ dockOpen: open === true }),
        setPanelPosition: (value) => {
          const position = normalizePanelPosition(value)
          const previous = store.getSnapshot().panelPosition
          if (position && (position.x !== previous?.x || position.y !== previous?.y)) store.set({ panelPosition: position })
        },
        setLevel: (key, value) => {
          const next = typeof value === 'number' && Number.isFinite(value) ? value : DEFAULTS[key] ?? 1
          if (key !== 'artOpacity' && key !== 'veil') return
          store.set({ [key]: Math.round(Math.min(1, Math.max(0, next)) * 100) / 100 })
        },
        setFraming: (patch) => {
          const state = store.getSnapshot()
          const skin = activeSkin(state)
          if (!skin) return
          const framing = normalizeFraming({ ...(state.framing[skin.id] ?? defaultFraming(skin)), ...patch }, skin)
          store.set({ framing: { ...state.framing, [skin.id]: framing } })
        },
        resetFraming: () => {
          const state = store.getSnapshot()
          const framing = { ...state.framing }
          delete framing[state.skin]
          store.set({ framing })
        },
        setSidebarColor: (value) => {
          const state = store.getSnapshot()
          const color = validColor(value)
          if (!color || !activeSkin(state)) return
          store.set({ sidebarColors: { ...state.sidebarColors, [state.skin]: color } })
        },
        resetSidebarColor: () => {
          const state = store.getSnapshot()
          const sidebarColors = { ...state.sidebarColors }
          delete sidebarColors[state.skin]
          store.set({ sidebarColors })
        },
        setRegionColor: (id, change) => {
          const state = store.getSnapshot()
          const skin = activeSkin(state)
          const region = REGIONS.find((item) => item.id === id)
          if (!skin || !region) return
          const previous = state.regionColors[skin.id]?.[id] ?? regionDefault(region)
          const color = change.color === undefined ? previous.color : validColor(change.color)
          if (!color || (change.opacity !== undefined && !Number.isFinite(change.opacity))) return
          const opacity = change.opacity === undefined ? previous.opacity : Math.round(Math.min(1, Math.max(0, change.opacity)) * 100) / 100
          const text = change.text === undefined ? previous.text : validColor(change.text)
          store.set({ regionColors: { ...state.regionColors, [skin.id]: {
            ...state.regionColors[skin.id], [id]: { color, opacity, text },
          } } })
        },
        resetRegionColor: (id) => {
          const state = store.getSnapshot()
          if (!REGIONS.some((region) => region.id === id)) return
          const regions = { ...state.regionColors[state.skin] }
          delete regions[id]
          const regionColors = { ...state.regionColors }
          if (Object.keys(regions).length) regionColors[state.skin] = regions
          else delete regionColors[state.skin]
          store.set({ regionColors })
        },
        resetRegionColors: () => {
          const state = store.getSnapshot()
          const regionColors = { ...state.regionColors }
          delete regionColors[state.skin]
          store.set({ regionColors })
        },
        replacePicture: async (id, file) => {
          if (!allSkins(store.getSnapshot()).some((skin) => skin.id === id)) return
          await pictures.save(id, file)
          const state = store.getSnapshot()
          store.set({ framing: { ...state.framing, [id]: { fit: 'contain', zoom: 1, x: 0.5, y: 0.5 } } })
        },
        addSkin: async (file, options) => {
          const color = validColor(options.color)
          const palette = color ? paletteForColor(color) : PALETTES[0].id
          const suffix = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
          const id = `custom-${suffix}`
          const name = (options.name || file.name?.replace(/\.[^.]+$/, '') || '自定义皮肤').trim().slice(0, 50) || '自定义皮肤'
          await pictures.save(id, file)
          const state = store.getSnapshot()
          store.set({
            customSkins: [...state.customSkins, { id, name, palette }], skin: id,
            artOpacity: 1, veil: 0,
            framing: { ...state.framing, [id]: { fit: 'contain', zoom: 1, x: 0.5, y: 0.5 } },
            sidebarColors: color ? { ...state.sidebarColors, [id]: color } : state.sidebarColors,
          })
        },
        deleteSkin: async (id) => {
          if (!store.getSnapshot().customSkins.some((skin) => skin.id === id)) return
          await pictures.remove(id)
          const state = store.getSnapshot()
          const framing = { ...state.framing }
          const sidebarColors = { ...state.sidebarColors }
          const regionColors = { ...state.regionColors }
          delete framing[id]
          delete sidebarColors[id]
          delete regionColors[id]
          store.set({
            customSkins: state.customSkins.filter((skin) => skin.id !== id), framing, sidebarColors, regionColors,
            skin: state.skin === id ? DEFAULT_SKIN : state.skin,
          })
        },
      }

      let panel
      let unbind = () => {}
      let alive = true

      const sync = () => {
        if (!alive) return
        applyState(ctx, store.getSnapshot())
        panel?.update()
      }

      ctx.effect(() => whenBodyReady(() => {
        const removeStyle = insertStyle(CSS)
        const layers = createLayers()

        sync()
        const unsubscribe = store.subscribe(sync)
        panel = mountPanel(store, actions)
        refreshPanel = panel.update
        // mountPanel builds the skeleton but deliberately does not paint it — it
        // has no way to know whether the caller wants it shown yet — so the first
        // paint has to happen here, or the panel opens with empty labels and no
        // card marked as active.
        panel.update()
        unbind = bindInteractions(store, actions)

        // Watch only the one attribute this plugin owns, so that anything which
        // strips it — a competing skin, a stray script — is corrected without
        // this plugin ever observing a shell node.
        const guard = new MutationObserver(() => {
          const skin = activeSkin(store.getSnapshot())
          const expected = skin === undefined ? null : skin.palette ?? skin.id
          if (document.body.getAttribute(ATTR) !== expected) {
            if (expected === null) document.body.removeAttribute(ATTR)
            else document.body.setAttribute(ATTR, expected)
          }
        })
        guard.observe(document.body, { attributes: true, attributeFilter: [ATTR] })

        // A palette flip changes which of the skin's two token sets is live, so
        // the mirrored layer has to be recomputed. The theme service publishes
        // no client-side "scheme changed" event; this attribute is the shell's
        // own marker for it.
        //
        // Deferred to a macrotask rather than handled inline: a mutation
        // callback runs as a microtask, so reacting synchronously would put this
        // back on the same turn as whatever caused the mutation. `syncTokens`
        // also refuses to republish unchanged values, which is what actually
        // breaks the feedback loop; the deferral is the second lock.
        let schemePending = false
        let schemeTimer
        const scheme = new MutationObserver(() => {
          if (schemePending) return
          schemePending = true
          schemeTimer = window.setTimeout(() => {
            schemePending = false
            sync()
          }, 0)
        })
        scheme.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })

        // Re-run the whole state pass when a probe settles, not just the panel:
        // this callback is also what repaints the thumbnails from "pending" to
        // "ready", and any future state derived from a probe needs the same path
        // the first paint took.
        const stopArtwork = preloadArtwork(sync)
        const stopDimensions = preloadDimensions(sync)
        pictures = createPictureRepository(store, sync)
        void pictures.ready.catch((error) => panel?.notify(error.message, true))
        window.addEventListener('resize', sync)
        void fetchStatus()

        // One line of startup evidence: the only way to tell "the row never
        // activated" from "the browser half never loaded" without a log file.
        console.log(`[${ID}] client half active`, {
          skins: SKINS.map((skin) => skin.id),
          active: store.getSnapshot().skin,
          route: `${ROUTE}/status`,
        })

        return () => {
          alive = false
          unsubscribe()
          unbind()
          unbind = () => {}
          guard.disconnect()
          scheme.disconnect()
          window.clearTimeout(schemeTimer)
          stopArtwork()
          stopDimensions()
          pictures.dispose()
          window.removeEventListener('resize', sync)
          panel?.dispose()
          panel = undefined
          refreshPanel = undefined
          layers.dispose()
          clearAppearance()
          removeStyle()
        }
      }), `${ID}: skin layers`)
    }

    exports.name = ID
    exports.apply = apply
    return module.exports
  },
})
