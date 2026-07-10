# Implementation Plan — New Page from Figma (DevAI NEO)

Hand this whole file (plus `css/tokens.css`, `css/base.css`, `css/components.css`
in this same folder) to Claude Code in the target repo.

## 0. Before writing any page code

**The Figma frame export (PNG) has not been provided yet.** Do not guess at
layout. Your first action in this task must be to ask the user to attach the
exported PNG of the frame to implement. Once you have it:

1. Confirm with the user which frame/screen it is and its intended route/URL
   in the existing app.
2. Confirm any copy in the image that's illegible or ambiguous rather than
   inventing text.
3. Confirm what "search", "filter", and "nav" actions in section 4 below
   should actually do on this specific screen (the mock-data behavior needed
   varies a lot by screen — a login screen has none of this; a table screen
   has all of it).

Everything below is durable context — the design system, tokens, and
conventions — that applies regardless of which frame it turns out to be.

## 1. What this is

This is one new pages/route added to an **existing plain HTML/CSS/JS app**
(no framework). It must look and behave like it belongs to the existing
product: **DevAI Network Intelligence Engine (NEO)**, a dense, analytical,
browser-first SaaS for network-ops teams (reconciling inventory/telemetry
across ServiceNow CMDB, Nautobot, Dynatrace, VMware vROps).

- **Stack:** plain HTML/CSS/JS. No build step, no framework, no CSS
  preprocessor. Vanilla DOM APIs for interactivity.
- **Scope:** interactive UI wired to **mock/local data** — search, filters,
  and navigation should all functionally work against an in-memory (or
  hardcoded JSON) dataset. No real backend calls.
- **Theme:** light theme only for this pass. (Design tokens include dark
  values for later — see `css/tokens.css` — but do not build a theme
  toggle now.)

## 2. Files provided in this handoff

```
Guide/
├── PLAN_Summary&ListDetail.md              ← this file
└── css/
    ├── tokens.css        ← design tokens: color, type scale, spacing, radii, shadows
    ├── base.css          ← resets + semantic element defaults (h1–h4, p, links, .neo-card…)
    └── components.css    ← screen-level component classes (topbar, sidebar, table, chat…)
```

Load order in the new page's `<head>`, after any existing app stylesheet:

```html
<link rel="stylesheet" href="/path/to/tokens.css">
<link rel="stylesheet" href="/path/to/base.css">
<link rel="stylesheet" href="/path/to/components.css">
```

These three files were split out of the design system's `colors_and_type.css`
+ `neo.css` so tokens, resets, and components stay independently editable.
`components.css` already contains ready-made classes for a top bar, left
sidebar nav, main panel, toolbar (search box, chips, source chips, primary
button), data table (with discrepancy/zebra row states), KPI/exec-dashboard
grid, and a chat panel — reuse these classes before writing new CSS. Only
add new component classes for things the frame needs that aren't covered.

## 3. Design system reference (must follow — do not invent new values)

**Voice/copy tone:** matter-of-fact, operational — no exclamation marks, no
emoji, sentence case for headings/buttons ("Executive dashboard", not
"Executive Dashboard!"). Proper nouns (ServiceNow, Nautobot, Dynatrace,
VMware vROps) keep their casing. Copy explains what a feature does in one
plain sentence, usually starting with a verb.

**Color** (all in `tokens.css` as `--neo-*` variables — reference by name,
never hardcode a hex):
- Primary accent: indigo `--neo-indigo` — used sparingly (active states,
  the emphasized search term, primary buttons, active nav pill).
- Neutrals are cool-toned (no warm gray). Text: `--neo-fg-1` (near-black,
  purple tint) down to `--neo-fg-4` (meta/captions). Backgrounds:
  `--neo-bg`/`--neo-surface` (cool whites).
- Semantic: success/health mint `--neo-success`, danger orange
  `--neo-danger`, notification-badge red `--neo-danger-2`, warning yellow
  `--neo-warning`, discrepancy-row pink `--neo-pink`/`--neo-pink-2`.
- No gradients in product chrome except: the page's radial `--neo-app-bg`,
  and the avatar's mint→lavender→purple corner gradient
  (`.neo-topbar__avatar`, `.neo-msg__avatar`).

**Type:** Source Sans 3 everywhere (loaded via Google Fonts `@import` in
`tokens.css`); JetBrains Mono for any code/IP/MAC address display. Only 8
sizes exist: 12/14/16/20/24/28/32/48px (`--text-xs` … `--text-4xl`). Line
height is 100% almost everywhere (`--lh-tight`) — this is a data UI, not
a marketing page; 150% (`--lh-body`) only for long paragraphs. Weights:
400 / 600 / 700 only.

**Spacing:** strict 4px grid — `--space-1` (4px) through `--space-12`
(48px). Don't use arbitrary px values; pick the nearest token.

**Corners:** radius scale only — 2px tabs, 4px buttons/chips, 8px
cards/inputs, 12px avatars/large surfaces, pill (999px) for pills/discs.

**Borders:** always 1px. Card border `--neo-indigo-100`, inner dividers
`--neo-border`, chip borders `--neo-indigo-hair`.

**Elevation:** `--shadow-1` (buttons/small chips), `--shadow-2` (selected
toggle/floating panel), `--shadow-3` (modals/detail panels). No glow/neon
shadows, no inner shadows except the focus ring (`--shadow-focus`).

**States:**
- Hover: ~4% indigo tint on background, or underline fade-in for links.
  Buttons darken ~8% (e.g. `--neo-indigo` → `--neo-indigo-600`).
- Active/press: indigo fill + white text (primary); thin light stroke ring
  (secondary).
- Selected nav row: solid indigo fill, white text/icon.
- Focus: 3px `--shadow-focus` halo on inputs/buttons.
- Disabled: `--neo-fg-4`-ish muted text on light gray fill.
- Motion: 120ms ease-out for state changes, 200ms for panel opens. No
  bounce/spring easing — this product is calm and functional, not playful.

**Layout conventions seen across screens:**
- Left nav: fixed 228px wide (`.neo-sidebar`).
- Main content: flexible width white card, 20–24px inner padding
  (`.neo-main`).
- Section titles: 16px bold label, top-left of each card, with a
  right-floated row of chips/actions.
- Tables: dense — ~35px rows, 12px text, hairline dividers
  (`.neo-table`), optional pink-wash (discrepancy) or zebra row states.
- Pagination centered below the section, not pinned to the card edge.

**Icons:** single-weight outlined strokes (14/16/20/24px), inherit
`currentColor` — no filled icon variants. If the frame needs icons not
already in the existing app's icon set, ask the user for the icon
asset/SVG rather than hand-drawing a facsimile of a specific brand mark
(especially the 14 integration/agent logos — ServiceNow, Nautobot,
Dynatrace, VMware, Splunk, etc. — these are real third-party brand marks
and must come from real asset files, not redrawn approximations).

**Emoji:** never used anywhere in this product. Use icons instead.

## 4. Interactivity requirements (mock/local data)

Whatever the frame turns out to be, implement it as a real interactive
page, not a static image trace:

- **Search** (if the frame has a search box): typing filters/queries the
  local dataset live; show an empty state if nothing matches.
- **Filters/chips/source toggles** (if present): clicking actually
  adds/removes/toggles filter state and updates the visible rows/results —
  don't just style the `:hover`/`:active` states and stop there.
- **Nav** (sidebar items, tabs, breadcrumbs): clicking switches the visible
  section/state within the page (can be simple show/hide of pre-built
  sections, or swap in different mock datasets) — full client-side routing
  is not required unless the existing app already has a router pattern to
  match.
- **Tables:** sortable columns and row hover states where the frame shows
  them; discrepancy rows keep the pink-wash treatment from `components.css`.
- Keep all mock data in one clearly-named JS object/array near the top of
  the page's script (or a separate `mock-data.js`) so it's easy to swap for
  a real API later.

## 5. Definition of done

- [ ] Page matches the provided Figma PNG in layout, spacing, and content —
      flag (don't silently fix) any spot where the frame seems to violate
      this design system, rather than "correcting" it unilaterally.
- [ ] Only uses colors/type/spacing/radii/shadows from `tokens.css` — no
      new hardcoded hex values or arbitrary px values introduced.
- [ ] Reuses `components.css` classes wherever the frame matches an
      existing pattern (topbar, sidebar, table, toolbar, chips, chat) before
      writing new CSS.
- [ ] Search/filter/nav interactions work against local mock data as
      described in section 4.
- [ ] No emoji, no exclamation marks, sentence-case copy matching the tone
      in section 3.
- [ ] Light theme only — no theme toggle added this pass.
- [ ] Works with no build step — open the HTML file (or existing app's dev
      server) directly, plain `<script>`/`<link>` tags only.
