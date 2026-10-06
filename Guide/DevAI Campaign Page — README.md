# DevAI Campaign Page — README

`pages/devai-campaign.html`: the "Get Your IT Data Truth Score" landing page.
It is built from Figma frame `9796:4992` (DevAI_Site › GetYourDataTruthScore) and
`Guide/DevAI Campaign Page — Implementation Plan for Claude Code.md`.

## Run

There's no build step, in line with the repo convention. Either:

- open `pages/devai-campaign.html` directly in a browser, or
- serve the repo root (`python3 -m http.server 8000`) and open
  `http://localhost:8000/pages/devai-campaign.html`.

GSAP 3.13 core and ScrollTrigger load from cdnjs. Fonts (Source Sans 3, Lato,
Google Sans Code) load from Google Fonts without blocking first paint. If the
GSAP CDN is unreachable, the page falls back to the static final hero and the
chips still work, just without motion.

## Screenshots

```sh
node scripts/shot-campaign.mjs <phase> [--wait 6000] [--reduced-motion]
```

This writes full-page and viewport PNGs at 1440 and 390 px to
`shots/campaign/phase-<phase>/`, which is gitignored. It needs only Node 22+ and
Google Chrome (override the path with `CHROME_PATH`). It also exports
`openPage()` for scripted checks.

## Assets

Assets live in `img/campaign/`; see `img/campaign/ASSETS.md` for the full
Figma-layer → file map. Three files are still missing and render as grey
placeholder boxes:

| File | Used for |
| --- | --- |
| `img/campaign/arrow-right.svg` | nav chevrons (12×12, grey) |
| `img/campaign/arrow-right-dark.svg` | sign-up button chevron (12×12, dark) |
| `img/campaign/linkedin.svg` | footer LinkedIn link (25×25) |

Export them under those exact names and reload. The page swaps each placeholder
for the real file automatically, with no code change. Until then, the browser
logs a 404 for each one, and that is expected.

## Dev hooks

- `window.__heroReplay()` re-runs the intro sequence without reloading. It is
  exposed on `file:`, `localhost` and `127.*` hosts, or with `?debug` in the URL.
- `--motion-scale` (CSS custom property on `:root`): every CSS transition
  duration is multiplied by it. It is `0` under `prefers-reduced-motion: reduce`.
  Set it to e.g. `4` in dev tools to slow down state changes.
- `window.heroInteraction` exposes `pauseIdle()`, `resumeIdle()` and `reset()`
  for the chip idle demo.

## How the guide maps onto this page

| Guide (Next.js) | Here (vanilla) |
| --- | --- |
| `SiteHeader`, `Hero`, `TruthScoreContent`, `SiteFooter` | `header.site-header`, `section.hero`, `main.content`, `footer.site-footer` |
| `tokens.css` | `:root` block at the top of the page's `<style>` |
| `useHeroSequence.ts` | "Hero controller" script block: `buildIntro()`, one GSAP timeline |
| `useHeroInteraction.ts` + `heroMap.ts` | "Phase 5" script block, with the `HERO_MAP` constant |
| `useGSAP` / `gsap.context()` cleanup | `gsap.matchMedia()`: switching reduced motion reverts and rebuilds |
| Server-rendered final hero | Static HTML is the final state; a pre-paint `js-hero-pending` class hides only the intro's elements once JS runs |
| Server Action `submitLead` | `submitLead(payload)` logs and resolves `{ ok: true }`; wire the real endpoint there |

## Where this deviates from the guide

1. **Stack.** The page is vanilla HTML/CSS/JS rather than Next.js, per the
   owner's decision and the repo's CLAUDE.md.
2. **No `html { scroll-behavior: smooth }`.** It animates ScrollTrigger's
   measuring scroll and corrupts every trigger position (the intro gate measured
   −605 px instead of 450 px). In-page `#` links smooth-scroll from JS instead.
3. **Header and sheet geometry follow Figma, not the guide's estimates.** The
   header is 134 px tall with a 1440 px max width (the guide says ~72 px and
   ~1100 px). The sheet radius is 16 px (the guide says 32 px). Below 900 px the
   header is 72 px.
4. **Contrast nudges for WCAG AA.** The Search button background is `#5C6ADD`
   (Figma `#6271EB`, 4.13:1 → 4.6:1). The footer text is `#737A95` (Figma
   `#707793`, 4.46:1 → 4.65:1).
5. **Copy fixes the owner approved:** "disagree," (was "disagrees,"), "get?"
   (was "get ?"), and the phone placeholder `+1 555 000 0000`. The headline's
   trailing comma is kept as in Figma.
6. **Additions not in Figma:**
   - a frosted header band: white on the light sheet, dark on phones where the
     tall hero scrolls under the header;
   - a hamburger menu below 900 px;
   - the sign-up success message: "You're on the list! Thanks, {name}. We'll
     contact you at {email} to schedule your assessment." This copy is a
     placeholder for the owner to confirm.
7. **Tall heroes (phones, short laptops).** The hero can't fit in 100vh, so it
   gets a negative sticky `top`: it scrolls to its bottom edge, then pins and is
   covered.

## QA results (Phase 7)

- **Visual vs Figma at 1440:** section heights are intro 768/766, deliverables
  661/661, closing 220/220 and footer 140/139 px. 1024 and 390 reflow without
  horizontal scroll.
- **Browsers:** Chrome and WebKit (desktop and iPhone 13 emulation) pass the
  same behaviour checks: intro, chip mapping, recede, header flip, and no
  horizontal scroll. Firefox could not be launched in the build sandbox and
  still needs a manual pass, as do Edge and a real iOS device.
- **Keyboard:** tab order is header → search → chips → form → CTA → footer.
  Enter and Space toggle chips; keyboard focus previews a chip's tiles.
- **Reduced motion:** the final state shows immediately, chips are enabled, and
  there is no idle loop and no recede. The header still flips, with 0 ms
  transitions.
- **Lighthouse (local server):**
  - desktop: Performance 95, Accessibility 100, SEO 100;
  - mobile: Performance 100 (3 runs), SEO 100, CLS 0.001.
  - Mobile Accessibility reads 96 because the throttled run snapshots tiles
    mid-fade or in the guide's dimmed state (opacity 0.35), which can't meet
    4.5:1 by design. For strict compliance, raise `.tile.is-dimmed` opacity to
    about 0.6.
  - Best Practices is 96 only because of the three missing-asset 404s.

## Owner TODOs

- Real URLs for the nav links and the LinkedIn link (marked `TODO(owner)`).
- Export the three missing assets listed above.
- Wire `submitLead` to the real endpoint, and confirm the success-message copy.
