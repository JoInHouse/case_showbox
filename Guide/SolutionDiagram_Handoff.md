# SolutionDiagram — Handoff

Working reference for editing or extending the DevAI "solution hub" diagram and its animation. Last synced with the files on 2026-10-12 (19 tool icons).

| File | Role |
|---|---|
| `img/SolutionDiagram.layered.svg` | The artwork ("main stage"). Layered, with ids/classes for animation. |
| `pages/SolutionDiagram.html` | Standalone page: fetches the SVG, inlines it, runs the GSAP animation. |
| `img/devai-mascot.png` | Centre mascot (external raster, referenced by the SVG's pattern fill). |
| `img/*_Disc.svg`, `*_62x62.svg` | Source logo artwork for tools that were added later (Meraki, Armis, CrowdStrike, Dell, HPE, Oracle ORDS). |
| `img/SolutionDiagram_StaticLayerReorganized.svg` | Flat Figma-style reference used by `scripts/update_layered_svg.py`. |
| `scripts/update_layered_svg.py` | One-off rebuild script. **Do not re-run** (see Gotchas). |

## Geometry

- Canvas: `width=841 height=820 viewBox="0 0 841 820"`.
- Orbit centre: **(420.5, 427.93)**. Orbit ring radius: **294.5**.
- Angles used everywhere (twinkle sync, comet): **0° = 3 o'clock, increasing clockwise** (SVG y-down).
- Icon discs are 62×62 (a few are 60×60), centred on the **outer end of a spoke**, ~287–288 from the centre.
- Neighbouring seats are 15° apart (~77px chord), so adjacent 62px discs always leave ~15px. Labels are what collide, not icons.

## Layer structure (back → front)

```
<svg>
  <defs>                             gradients, filters, mascot pattern (top of file)
  layer-1-ambient
    ambient-glow                     ANIMATED: opacity breathe (CSS). At runtime moved OUT of this <svg> into #glow-layer (see below)
  layer-2-arcs-and-text
    arcs, curved-text                STATIC
  layer-3-orbit
    orbit-halo                       STATIC
    orbit-ring-and-dots
      orbit-track > #orbit-ring      stroke hidden by page CSS; comet is appended into #orbit-track
      orbit-dots > 24 × .orbit-dot   data-dot-index 1..24; twinkle when comet passes
  layer-4-spokes                     ANIMATED: 24 × path.spoke  #spoke-01..24
  layer-5-icons-and-center
    icon-<seat>-<brand> × 19         ANIMATED: staggered scale-in entrance (ordered by seat)
    icon-labels                      STATIC (outlined paths + <text>)
    center-logo                      in the file: a pattern-filled <rect>. At runtime replaced by an <img id="center-logo"> (see below)
```

**Runtime layer split (Safari performance).** Safari has no compositor layers for SVG children, so anything that repaints inside the main `<svg>` re-runs the blur underneath it. On load, `splitLayers()` in the page lifts two things out of the SVG into composited layers inside `#svg-container`, back → front: `#glow-layer` (a div holding a second `<svg>` with `#ambient-glow`; its filter and gradients still live in the main `<defs>`), the main `<svg>`, then `<img id="center-logo">` (sized and placed in % from the original `<rect>`'s x/y/width). The SVG file itself is unchanged. Measured in WebKit: ~44% less CPU than the old in-SVG version.

## Seats: dots, spokes, icons

24 seats, one per orbit dot. Every seat already has a spoke, whether or not an icon sits on it — so **adding an icon to a free seat needs no new spoke**.

Dot `n` is at angle `(105 − 15·n) mod 360`. Dot centre = the dot path's second-point x/y (the `M` point is its right edge, `cx = M.x − 6.37`).

| Dot | Angle | Occupant | Icon id | Spoke (start pt) | Label |
|---|---|---|---|---|---|
| 1 | 90° (bottom) | Quantea | `icon-01-quantea` | spoke-20 | below |
| 2 | 75° | **free** | | spoke-23 | |
| 3 | 60° | Zabbix | `icon-03-zabbix` | spoke-03 | below |
| 4 | 45° | Oracle ORDS | `icon-04-oracle-ords` | spoke-07 | right (lowered) |
| 5 | 30° | Dynatrace | `icon-05-dynatrace` | spoke-15 | right |
| 6 | 15° | Armis | `icon-06-armis` | spoke-11 | right |
| 7 | 0° | Jira | `icon-07-jira` | spoke-19 | right |
| 8 | 345° | CrowdStrike | `icon-08-crowdstrike` | spoke-22 | right |
| 9 | 330° | Infoblox | `icon-09-infoblox` | spoke-02 | right |
| 10 | 315° | **free** | | spoke-06 | |
| 11 | 300° | ServiceNow | `icon-11-servicenow` | spoke-14 | above |
| 12 | 285° | **free** | | spoke-10 | |
| 13 | 270° (top) | VMware | `icon-13-vmware` | spoke-18 | above |
| 14 | 255° | Nautobot | `icon-14-nautobot` | spoke-21 | above |
| 15 | 240° | Netbox | `icon-15-netbox` | spoke-01 | above |
| 16 | 225° | HPE OneView | `icon-16-hpe-oneview` | spoke-05 | left |
| 17 | 210° | Dell OME | `icon-17-dell-ome` | spoke-13 | left |
| 18 | 195° | Cisco Intersight | `icon-18-cisco-intersight` | spoke-09 | left |
| 19 | 180° | Cisco Catalyst Center | `icon-19-cisco-catalyst-center` | spoke-17 | left (2 lines) |
| 20 | 165° | Cisco SD-WAN | `icon-20-cisco-sdwan` | spoke-24 | below |
| 21 | 150° | Meraki | `icon-21-meraki` | spoke-04 | below |
| 22 | 135° | **free** | | spoke-08 | |
| 23 | 120° | Splunk | `icon-23-splunk` | spoke-16 | below |
| 24 | 105° | **free** | | spoke-12 | |

**Id scheme:** `icon-<seat>-<brand>`, where `<seat>` is the two-digit dot index from the table (so numbers have gaps at free seats), and each group carries `data-seat="<n>"`. Groups sit in the SVG in seat order. The old positional ids (`icon-01-top`, `icon-13-top-center`, …) and `data-position` are gone; nothing in the page depended on them beyond the `icon-` prefix. Spokes are still numbered independently of seats (`spoke-06` ↔ dot 10, etc.) — use the table's Spoke column.

**Free seats: dots 2, 10, 12, 22, 24.** Watch label room before using one:
- Dot 22 (135°): a below-label collides with Splunk's disc (x≈245). Use a left label or two lines.
- Dot 10 (315°): right label fits (HPE OneView used to sit there with one at x=663).
- Dot 12 (285°): label above sits between the VMware label (y≈92–102) and ServiceNow's (y≈128–139); keep it short.
- Dot 24 (105°): below label fits (Dell OME used to sit there with one at y=757), but it sits close to the Quantea label.

**Seat moves (2026-10-01).** VMware, Nautobot and Netbox each moved one seat clockwise (14→13, 15→14, 16→15), and HPE OneView (10→16) and Dell OME (24→17) took the two seats this freed next to Cisco Intersight. The three moved groups whose shapes use absolute coordinates are wrapped in an inner `<g transform="translate(dx dy)">` (VMware `72.461 −7`, Nautobot `70 −29`, Netbox `59 −46`), and their outlined-path labels carry the same `transform`. HPE OneView and Dell OME just had their inner `translate` changed. Their `<text>` labels are now left labels (`text-anchor="end"`), because a label above the disc would run into the neighbouring disc. Dell OME's label sits at `y=285` (4px above the usual centre line), and Cisco Intersight's outlined label is now a left label: its path carries `transform="translate(-30 39.5)"`, which centres it vertically between the Dell OME and Cisco Catalyst Center labels (≈350) and right-aligns it to x≈102 like Catalyst Center (the logo stays on its spoke), so the Dell OME and Cisco Intersight labels have room between them.

**Oracle ORDS (2026-10-12)** took dot 4 (45°), between Zabbix and Dynatrace. Its logo is translated to `(592.461 600.891)` (spoke-07's start point minus 31). A standard right label (baseline ≈636) would sit right under the Dynatrace label (y≈611–622), so it is a right label lowered to `x=663 y=650`, below the Dynatrace label. To give the two labels room, the Dynatrace outlined-path label was moved from below its disc to its right: the path carries `transform="translate(38 -38)"` (now x≈708–770, y≈574–584, slightly below the disc's centre line). The logo has no internal ids.

## Adding a new tool logo (recipe)

1. Pick a free seat from the table. Take the spoke's start point (its `M x y`) as the icon **centre**.
2. Insert a group in `layer-5-icons-and-center`, keeping seat order (before `<g id="icon-labels">` if it is the highest seat):
   ```svg
   <g id="icon-<seat>-<brand>" data-seat="<seat>">
     <!-- seat <seat> — <Brand> (spoke-XX) -->
     <g transform="translate(CX-31 CY-31)">
       …contents of the logo SVG (without the outer <svg> tag)…
     </g>
   </g>
   ```
   Keep the id prefix `icon-` — the page's entrance tween selects `[id^="icon-"]:not(#icon-labels)`, and the count also feeds the mascot fade-in delay.
3. Add the label inside `#icon-labels` as `<text>` (this is the current convention, matching Meraki / CrowdStrike / Armis / HPE / Dell):
   ```svg
   <text x="…" y="…" text-anchor="…" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif" font-size="14" fill="#A5B3CD">Name</text>
   ```
   Placement rules derived from existing labels (S = disc centre, disc half-width 31):
   - **Right:** `text-anchor="start"`, `x ≈ S.x + 31 + 8.5`, `y ≈ S.y + 4.5`.
   - **Below:** `text-anchor="middle"`, `x = S.x`, `y ≈ S.y + 31 + 19` (Meraki is +18.6; Splunk +22).
   - **Above:** centred, baseline ≈ 10px above the disc top.
   - **Left:** right-aligned to `x ≈ S.x − 31 − 8`.
4. Make every `id` inside the pasted logo unique — clipPaths, masks and gradients collide silently. Existing ones in use: `clip0_9561_3561`, `clip1_9561_3561` (Dell), `clip0_9561_3566`, `clip1_9561_3566` (HPE), `mask0_8225_5850` (icon-20), `paint0_radial_8905_3493` (icon-18), plus the `*_8225_5850` gradients in `<defs>`.
5. Do not add a spoke or dot; they already exist. Do not touch dots under an icon — the twinkle still fires there and reads as the ring passing under the disc.

## Animation as implemented (`pages/SolutionDiagram.html`)

Loading: `fetch('../img/SolutionDiagram.layered.svg')` → inline into `#svg-container` (needs a local server; `file://` fetch fails). `href="devai-mascot.png"` is rewritten to `../img/devai-mascot.png`. Starts on an `IntersectionObserver` (threshold 0.2). `prefers-reduced-motion` → only a simple icon fade, no loops.

| Effect | How |
|---|---|
| Ambient glow | CSS `breathe` 4s, opacity 0.55↔1 on the `#glow-layer` **div** (`will-change: opacity`), not on the SVG group. Opacity only — scaling a blurred group makes Safari re-rasterise every frame. |
| Orbit ring | Stroke set to `none`. Instead a **comet** (near-white head + glow circle + 28 trail circles, r 4→1.6, opacity fading) is appended to `#orbit-track` and driven by one tween, 8s per lap, positions set via `setAttribute`. No SVG blur filter (Safari cost). |
| Dot twinkle | Each dot's angle precomputed from `getBBox()`. On each update the nearest dot within 7° of the comet fires once (scale 1.5, brightness, cyan drop-shadow); resets when >20° away. Enabled after 2s. Uses the SVG `transform` attribute, not CSS (Safari). |
| Icon entrance | `gsap.set` scale 0 / opacity 0, then scale-in with `back.out(1.7)`, 0.06s stagger from random, 0.3s delay. Excludes `#icon-labels`. |
| Icon pulse | When the comet comes within 7° of an icon's seat, that icon scales to 1.12× and back (`pulseIcon()`: 0.12s, `yoyo`, `repeat: 1`, `sine.inOut`, `overwrite: 'auto'`). Icon angles are precomputed from each `icon-*` group's `getBBox()` centre (`pulseIcons`), checked in the same `onUpdate` as the twinkle, and re-armed when the comet is >20° away. Active after 2s, once the entrance has finished. Transform only — no filter. Labels don't scale. Measured cost in WebKit: ~+2 points of CPU (within run-to-run noise). |
| Spoke highlight | Each icon pulse also flashes that icon's spoke. At start, every `.spoke` gets a hidden copy `#spoke-NN-hl` (class `spoke-hl`, stroke-width 3, same `0 8` dots) inserted just above it, with its own `userSpaceOnUse` gradient `#spoke-NN-hl-grad` (white-cyan at the icon end, fading out by 90% of the way to the centre). Icons are paired with the spoke whose outer end is closest in angle (within 7.5°), so free seats never flash. `pulseIcon()` tweens the copy's `opacity` **attribute** 0→1 in 0.15s, then back to 0 over 0.9s. `startSpokes()` keeps the copies' dash offset in step with their spokes, but only writes it while a copy is visible. Opacity only, no filter (Safari). |
| Centre mascot | Fades in after the last icon (`0.3 + count·0.06 + 0.5`s), then wanders ±20 viewBox units on random 2–4s sine tweens. It's an `<img>` moved with GSAP `xPercent`/`yPercent` (composited translate), so it scales on resize and never repaints the SVG. |
| Spokes | Start at 1.5s. **One** tween (0→40 over 2.2s, repeat) sets `strokeDashoffset` on all spokes, each with a staggered offset. CSS `.spoke { stroke-width: 2; stroke-dasharray: 0 8 }` overrides the SVG attributes (`1.5`, `0 4`). Negative offset ⇒ dots flow icon → centre because every spoke path is drawn icon → centre. |

Labels (`#icon-labels`) are **not** animated, so they are visible before their icons scale in. This is existing behaviour.

Constants that must match the SVG if the artwork moves: `CENTER = {420.5, 427.93}` and `RADIUS = 294.5` in `startAnimations()`.

## Gotchas

- **`scripts/update_layered_svg.py` is stale.** It rebuilds the layered SVG from fixed line numbers in the reference file and knows nothing about icons 15–18, the `<text>` labels, or the external mascot. Running it would drop those additions. Edit the layered SVG directly.
- **`update_layered_svg.py` also mentions the old positional ids in its comments.** Ignore them.
- **Reference SVG is behind.** `SolutionDiagram_StaticLayerReorganized.svg` doesn't contain the later additions either.
- **GSAP + SVG transforms.** Entrance scaling sets a `transform` on each `icon-NN` group (origin at bbox centre). Keep the logo's own `translate` on an **inner** group, as in the recipe, or GSAP will overwrite it.
- **Safari:** avoid CSS transforms on SVG children, blur filters in per-frame paths, and scaling `#ambient-glow`. Keep blurred art and large moving rasters (the mascot) **outside** the main `<svg>` as their own elements. `splitLayers()` preserves the ids `ambient-glow` and `center-logo`, but `center-logo` is an `<img>` (no `<rect>`/pattern) while the page runs.
- **Text labels use Inter** if available, otherwise fall back; older outlined-path labels won't shift with fonts. Long names may need two lines or a different side.

## Verification checklist

1. Render the SVG alone (Chrome headless or `qlmanage`) and look for label overlaps and misplaced discs.
2. Serve the repo (`python3 -m http.server`) and open `pages/SolutionDiagram.html`; console must be clean.
3. Confirm every `icon-` group reaches opacity 1 / scale 1, the mascot fades in, spokes flow toward the centre, and the comet twinkles dots including those under new icons.
4. Check that each icon's spoke flashes as the comet passes, and that free seats don't.
5. Check `prefers-reduced-motion: reduce`.
6. Check Safari (gradient/mask rendering in new logos, animation smoothness).

## Open follow-ups

- Convert older outlined-path labels and the newer `<text>` labels to one style.
- Decide on icon hover states (scale, brighten the spoke). The comet pass already brightens the spoke (see Spoke highlight), and a hover state could reuse `pulseIcon()`.
- Optionally optimise `devai-mascot.png` (webp) for page weight.
