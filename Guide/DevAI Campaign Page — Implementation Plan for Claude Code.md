# DevAI Landing Page — Implementation Plan for Claude Code

Oct 6, 2026 · @Joseph

Build the DevAI "Get Your IT Data Truth Score" landing page as a Next.js route with GSAP-driven motion, in eight phases, finishing and verifying each phase before starting the next. The Figma file (via Figma MCP) is the visual source of truth; this document is the behavioural source of truth.

## Working agreement

- **Sources of truth.** Layout, spacing, colour, type and copy come from Figma via the Figma MCP. Motion, interaction and structure come from this plan. If the two conflict, stop and ask.
- **Assets.** All graphic assets (logo, icons, hero background rings, card icons) are exported manually and placed in a directory the owner names at kick-off. Never generate, substitute or redraw an asset; use a visible grey placeholder box of the right size and list the missing file.
- **One phase per session.** Each phase ends with: a short summary of what was built, a screenshot (Playwright or browser) of the result at 1440 px and 390 px, and a commit named `phase-N: <summary>`. Do not start the next phase until the owner says go.
- **Build the final state first, animate second.** Every animated element is laid out in its finished position with real content before any motion is added. Motion only toggles opacity, transform, clip-path and colour, never layout.
- **GSAP for motion, CSS for state.** Use GSAP timelines for the intro sequence and GSAP ScrollTrigger for scroll-linked motion and visibility triggers. Use CSS transitions for simple state flips (hover, highlight, active chip). CSS custom properties hold every token; ScrollTrigger replaces hand-rolled `IntersectionObserver`. Register plugins once in a shared module and scope every animation with gsap.context() inside useGSAP (or useLayoutEffect) so it cleans up on unmount and never runs on the server.
- **Ask before deviating.** Any change to copy, structure or the interaction mapping in Phase 5 needs a yes first. Visual polish inside a defined component does not.
- **Reduced motion is a requirement, not a nicety.** Every animation must have a `prefers-reduced-motion: reduce` path that jumps to the final state.

### Stack (confirmed: Next.js + GSAP)

| Concern | Choice | Reason |
| --- | --- | --- |
| Framework | Next.js (App Router), one route `app/(marketing)/truth-score/page.tsx` | Matches the existing repo; header, content and footer are Server Components, only the hero is `'use client'` |
| Styling | CSS Modules per component plus a global `tokens.css` | Mirrors Figma tokens 1:1 and follows the repo's existing convention; no utility translation |
| Motion | GSAP core + ScrollTrigger, `@gsap/react` `useGSAP` hook | Repo standard; timelines give exact control over the intro sequence and scrub-linked scroll motion |
| Fonts | `next/font/local` with the exported woff2 files | Zero layout shift, no FOUT in the hero |
| Testing | Playwright screenshots per phase against `next dev` | Visual check without a backend |

Follow the repo's existing folder, naming and lint conventions over anything in this plan. Keep the section/component split below (`SiteHeader`, `Hero`, `TruthScoreContent`, `SiteFooter`) so the hero's client bundle stays small.

## Page anatomy

The page is four regions stacked vertically. Only the header and the hero carry behaviour.

| # | Region | DOM | Position | Behaviour |
| --- | --- | --- | --- | --- |
| 1 | Header | `<header class="site-header">` | `position: fixed; top: 0; z-index: 30` | Always docked. Logo left, nav pill right (Home, Solution ›, Newsroom ›, Book a demo ›, divider, Login). Style shifts when it leaves the dark hero (Phase 6). |
| 2 | Hero (dark, animated) | `<section class="hero">` | `position: sticky; top: 0; height: 100vh; z-index: 0` | Plays a scripted search sequence once, then becomes interactive (alert chips highlight tiles). Gets covered by region 3 on scroll. |
| 3 | Content (white, static) | `<main class="content">` | `position: relative; z-index: 10; border-radius: 32px 32px 0 0` | Plain HTML/CSS: Truth Score intro, how-it-works card with sign-up form, security banner, deliverables grid, closing CTA. No animation. |
| 4 | Footer | `<footer class="site-footer">` | `position: relative; z-index: 10` | Static. Copyright left, LinkedIn icon right. Dark background matching the hero. |

### Hero element inventory

All of these exist in the DOM from first paint; the intro sequence only reveals them.

1. Background: layered concentric rings / gradient (exported asset) centred low behind the content.
2. Headline `When your IT tools disagrees,` and the three-line sub-paragraph.
3. Search bar: input (monospace text `SRV-db-07`) with blinking caret, plus `Search` button.
4. Result summary line: server icon · `SRV-db-07` · `1 Server` · `5 answers`.
5. Four result tiles, numbered left to right, each with a title and two key–value rows in monospace. Mismatching values render in amber/red (IP `10.20.4.17` vs `10.20.4.18`, `3 days ago`, `Not found`).
6. Four alert chips with a warning icon, numbered left to right.

| Index | Tile | Rows | Chip |
| --- | --- | --- | --- |
| 1 | CMDB | IP 10.20.4.17 · OS ubuntu 20.04 | Incidents take longer |
| 2 | Network SoT | IP 10.20.4.18 · VLAN 220 | Automation breaks |
| 3 | Monitoring | Last seen 3 days ago · Alerts 0 | Audits get harder |
| 4 | EDR | Agent Not found · Policy None | Security gaps go unseen |

## Phase 0 — Discovery, tokens, scaffold

Goal: the new route renders an empty page in next dev with the correct fonts, colours, asset paths and GSAP registration wired up. No layout yet.

1. Pull the Figma frame through the Figma MCP. Record every colour, font family/weight/size/line-height, corner radius, shadow and spacing value used on the page into `src/styles/tokens.css` as CSS custom properties (`--color-bg-hero`, `--color-accent-green`, `--radius-tile`, `--font-mono`, etc.). Name tokens by role, not by value.
2. Note the Figma layer names for every exported asset and map them to filenames in the asset directory the owner provides. Write the map into `ASSETS.md` and flag any asset referenced in Figma but missing on disk.
3. Add the route and components following the repo's conventions. Suggested files: `app/(marketing)/truth-score/page.tsx`; `components/truth-score/{SiteHeader,Hero,TruthScoreContent,SiteFooter}.tsx`, each with a CSS Module; `components/truth-score/hero/{useHeroSequence,useHeroInteraction,heroMap}.ts`; `lib/gsap.ts` that registers ScrollTrigger and exports `gsap` once. Only `Hero` and `SiteHeader` are `'use client'`.
4. Set up the route's global stylesheet: reset, `next/font/local` for the exported faces, `html { scroll-behavior: smooth }`, and a global `@media (prefers-reduced-motion: reduce)` block that sets `--motion-scale: 0` (CSS durations multiply by this variable). On the GSAP side, wrap timelines in `gsap.matchMedia()` with a reduced-motion query so they resolve to their end state instantly.
5. Add a Playwright script `scripts/shot.ts` that captures full-page screenshots at 1440 and 390 px wide into `shots/phase-N/`.

Done when: `npm run dev` serves a blank page with tokens loaded and `npm run shot` produces two images.

## Phase 1 — Page skeleton and header

Goal: all four regions in place with correct heights, stacking and the docked header. Hero and content are empty coloured boxes with their headlines only.

1. Write the semantic skeleton: `header`, `section.hero`, `main.content`, `footer`. Give the hero `min-height: 100vh` and the content a placeholder height so the page scrolls.
2. Header: `position: fixed`, full width, 72 px tall, max content width matching Figma (about 1100 px centred). Logo image left; nav as a `<nav><ul>` inside a translucent rounded pill (`backdrop-filter: blur`), chevrons for the three dropdown items, a 1 px vertical divider before Login. Links are real `<a>` elements with `href="#"` for now.
3. Set up the stacking contract from the Page anatomy table: hero `sticky` at `z-index: 0`, content `relative` at `z-index: 10`, header at `z-index: 30`. Verify in the browser that the white block already slides over the dark block when scrolling (the cover effect in Phase 6 refines this, but the basic overlap should work now).
4. Add the content's rounded top corners and ensure the hero's background extends under the header (no gap at the top).
5. Responsive: below 900 px, collapse the nav pill to a hamburger button that toggles a vertical menu. Keep the logo docked.

Done when: scrolling shows a white block with rounded corners rising over a dark block, with the header staying put.

## Phase 2 — Static content section and footer

Goal: the white area and footer pixel-match Figma at 1440 px and reflow sensibly at 390 px. No JavaScript except form handling.

Build top to bottom, one block at a time, checking each against the Figma frame:

1. **Intro.** H2 `Get Your IT Data Truth Score` and the two-sentence paragraph.
2. **How-it-works card.** Two-column card on a soft green-to-lavender gradient. Left: heading with the gradient-coloured phrase, a numbered list of three steps (bold title + description), and the `Cost:` line. Right: a white sign-up card with four required fields (Your name, Work email, Phone number, What's your role?) and the green pill button `Sign up for the assessment now ›`. Stack to one column below 900 px.
3. **Form behaviour.** Native HTML validation (`required`, `type="email"`, `type="tel"`). On submit, prevent default, show an inline success state in the card, and call a single `submitLead(payload)` function that currently `console.log`s; implemented as a Next.js Server Action stub that logs the payload and returns success. The owner wires the real endpoint later; do not add a database or third-party SDK.
4. **Security banner.** Full-width green banner with shield icon, bold lead line and small body text.
5. **Deliverables.** H2 in two lines with coloured phrases, then a 3-column grid of five cards (icon, title, description) on a pale lavender background; the last row has two cards left-aligned. Italic note below. Grid becomes 2 columns under 1100 px and 1 column under 640 px.
6. **Closing CTA.** H2 `Bridge the gap between data and value` with the gradient phrase, paragraph, centred green pill button linking to the sign-up form (`href="#signup"`).
7. **Footer.** Dark band, copyright left, LinkedIn icon right.

Done when: a side-by-side of the Phase 2 screenshot and the Figma export shows no visible spacing or type differences, and the form validates and shows its success state.

## Phase 3 — Hero final state (no animation yet)

Goal: the hero rendered exactly as it looks after the intro sequence finishes, with every element visible and in position. Nothing moves yet.

1. **Background.** Place the exported ring/gradient asset as an absolutely positioned layer, centred horizontally, anchored to the bottom of the hero, `pointer-events: none`. Ensure it does not create horizontal scroll (`overflow: hidden` on the hero).
2. **Headline block.** H1 and sub-paragraph centred, max-width about 720 px.
3. **Search bar.** A `<form role="search">` with a text input (monospace, value `SRV-db-07`, `readonly`) and a `Search` button, inside a rounded container with a subtle inner glow. Add a `<span class="caret">` after the text for the typing effect later; hide it in this phase.
4. **Summary line.** Icon + `SRV-db-07` + two italic metadata items separated by middle dots.
5. **Tiles.** A 4-column grid (`gap: 16px`), each tile a `<article class="tile" data-tile="1..4">` with a title and two `<dl>` rows. Values in monospace; mismatching values use `--color-alert` (amber) and `Not found` uses `--color-danger` (red), per Figma. Tiles have a 1 px border at low opacity on a slightly lighter dark fill.
6. **Chips.** A centred row of four `<button class="chip" data-chip="1..4" aria-pressed="false">` with a warning icon and label. Rounded-pill border, transparent fill.
7. **State classes.** Define now, use later: `.tile.is-highlighted` (brighter border in accent colour, outer glow, fill lifted one step), `.tile.is-dimmed` (opacity 0.35), `.chip.is-active` (filled accent background, dark text). Add a 200 ms transition on border-color, box-shadow, opacity and background.
8. **Responsive.** Below 1100 px tiles become 2×2; below 640 px tiles stack and chips wrap to two rows.

Done when: the hero screenshot matches the Figma frame, and temporarily adding `is-highlighted` to a tile in dev tools shows the intended highlight style.

## Phase 4 — Hero intro sequence

Goal: on first load the hero plays a scripted search in roughly 5 seconds and lands exactly on the Phase 3 final state. It plays once per page load.

Implement `useHeroSequence.ts` as one GSAP timeline built inside `useGSAP` with a `gsap.context()` scoped to the hero ref. The `Starts at` column below maps directly to timeline position parameters. Each element starts at its final layout position; the timeline only animates `autoAlpha`, `y`, `scale` and colour. Expose the sequence state (`idle | playing | ready`) through a small reducer or ref so `useHeroInteraction` can gate clicks.

SSR rule: the server-rendered HTML must contain the full final hero (all tiles and chips visible) so the page is complete without JavaScript and for crawlers. Hide the animated elements only once the client mounts, with `gsap.set(..., { autoAlpha: 0 })` inside `useGSAP` before the timeline plays, and add `data-hero-mounted` on the hero root so a CSS rule suppresses any one-frame flash.

| Step | Element | Effect | Duration | Starts at |
| --- | --- | --- | --- | --- |
| 1 | Search input | Caret blinks alone for a beat | 600 ms | 0 ms |
| 2 | Search input | Characters of `SRV-db-07` appear one by one, 70–110 ms apart with slight random jitter; caret follows | \~800 ms | 600 ms |
| 3 | Search button | Pressed state (scale 0.96, darker) for 120 ms, then release | 200 ms | 1500 ms |
| 4 | Search bar | Soft pulsing glow on the container (searching) | 600 ms | 1700 ms |
| 5 | Summary line | Fade in + translate-y 8 px → 0 | 300 ms | 2300 ms |
| 6 | Tiles 1→4 | Each fades in + translate-y 16 px → 0, staggered 120 ms | 400 ms each | 2500 ms |
| 7 | Tile values | Mismatching values (amber/red) flicker once from neutral to their alert colour | 250 ms | 3300 ms |
| 8 | Chips 1→4 | Each fades in + scale 0.92 → 1, staggered 100 ms | 300 ms each | 3500 ms |
| 9 | Caret | Stops blinking; chips become clickable (`ready`) | — | 4000 ms |

Rules:

- Start the sequence only when the hero is at least 50 % visible (a ScrollTrigger with once: true and onEnter playing the timeline, in place of a hand-rolled `IntersectionObserver`), so it is not wasted if the user lands mid-page via an anchor.
- The typed text is the real input value; set it character by character so screen readers and copy/paste see the final string. Mark the input `aria-live="off"` during typing.
- Avoid `requestAnimationFrame` and manual timers entirely; every reveal is a tween on the one timeline, so pausing, replaying and scrubbing in dev tools work. If the tab is hidden (`document.hidden`), call timeline.pause() and resume on return.
- Under `prefers-reduced-motion: reduce`, skip straight to `ready` with everything visible.
- Expose `window.__heroReplay()` in dev builds to re-run the sequence without reloading.

Done when: a recording of the load shows the nine steps in order, finishing on the Phase 3 state, and reduced-motion mode shows the final state immediately.

## Phase 5 — Alert chip interactivity

Goal: clicking an alert chip highlights the tiles that cause that problem and dims the rest. Only one chip is active at a time.

Mapping (chip index → tile indices), stored as a single constant in `hero-interaction.ts`:

| Chip | Label | Highlights tiles |
| --- | --- | --- |
| 1 | Incidents take longer | 1, 2, 3 |
| 2 | Automation breaks | 1, 2 |
| 3 | Audits get harder | 1 |
| 4 | Security gaps go unseen | 4 |

Behaviour:

1. Chips are `<button>` elements, so Enter, Space and Tab work for free. Clicking a chip sets `aria-pressed="true"` and `.is-active` on it, clears both from the other three, adds `.is-highlighted` to the mapped tiles and `.is-dimmed` to the unmapped ones.
2. Clicking the active chip again deselects it and returns all tiles to neutral.
3. Hovering (or focusing) a chip previews its highlight at half strength (`.is-previewed` on tiles: border brightens, no dimming of the others). Leaving restores the active chip's state. Skip the preview on touch devices (`@media (hover: none)`).
4. Each tile is linked to its chips for assistive tech with `aria-describedby` pointing at the active chip's id; the chip row has `role="group" aria-label="Consequences of data disagreement"`.
5. Chips are inert (`disabled` attribute removed only on `ready`) until the Phase 4 sequence finishes, so clicks during the intro do nothing.
6. Idle demo: 2 s after `ready`, if the user has not interacted, auto-activate chips 1→4 in turn every 2.5 s, looping. Any click, hover or keyboard focus on a chip stops the loop permanently for that session. Under reduced motion, do not run the loop.

Done when: each chip highlights exactly the tiles in the table, keyboard operation works, the idle loop runs and stops on first interaction.

## Phase 6 — Scroll cover effect and header transition

Goal: scrolling makes the white content rise and cover the hero while the hero recedes behind it; the header adapts its look as the boundary passes.

1. **Cover.** The stacking contract from Phase 1 already pins the hero (`position: sticky; top: 0`) under the content (`z-index: 10`), so the white block slides over the dark one as the user scrolls. Keep the hero at exactly `100vh` so it never scrolls on its own. Use CSS sticky for the pin rather than ScrollTrigger `pin: true`; it is cheaper and avoids pin-spacer layout shifts in Next's hydration.
2. **Recede.** One ScrollTrigger-driven timeline with `scrub: 0.4`, `trigger` the content section, `start: 'top bottom'`, `end: 'top top'`. It tweens the hero inner wrapper `scale` 1 → 0.94, `autoAlpha` 1 → 0.4, `y` 0 → -40, and the background ring layer `y` 0 → 60 for depth. Register it inside the same `gsap.context()` as the intro timeline and call `ScrollTrigger.refresh()` after fonts load.
3. **Shadow edge.** Add a soft upward shadow on the content's top edge (`box-shadow: 0 -24px 48px rgba(0,0,0,0.35)`) so the overlap reads as a sheet lifting over the hero.
4. **Header transition.** A second ScrollTrigger on the content section with `start: 'top 72px'` toggles `.is-on-light` on the header via `onEnter` / `onLeaveBack` (pass the header ref into `SiteHeader` through a shared store or a `data-` attribute on `<html>`). On light: nav pill gets a dark translucent fill and light text becomes dark; logo swaps to its dark variant via a second `<img>` or `currentColor` SVG. Transition 250 ms.
5. **Hero pause.** Use the recede trigger's `onLeave` / `onEnterBack` to stop the Phase 5 idle loop and the caret blink when the hero is fully covered, and resume when it returns.
6. Under reduced motion (`gsap.matchMedia()`), keep the cover (it is layout, not animation) but do not create the recede timeline, and drop the header colour transition duration.
7. Clean-up: everything created in `useGSAP` is reverted on unmount; call `ScrollTrigger.refresh()` on route change and on `resize` (debounced), since the Next layout keeps the header mounted across pages.

Done when: a slow scroll recording shows the white sheet rising over a shrinking, fading hero, and the header flips style the moment the sheet reaches it.

## Phase 7 — QA, accessibility, performance

Goal: the page ships without visual, accessibility or performance regressions across the common browsers.

- [ ] Visual diff against Figma at 1440, 1024 and 390 px; fix anything off by more than 2 px.
- [ ] Chrome, Safari (macOS and iOS), Firefox, Edge: intro sequence, chip interaction, scroll cover and header flip all behave the same; confirm the ScrollTrigger scrub stays smooth on iOS Safari when the address bar resizes the viewport, and that nothing animates during server render or hydration (no flash of hidden content).
- [ ] Keyboard-only pass: Tab order is header → search → chips → form → CTA → footer; focus rings visible on dark and light backgrounds.
- [ ] Screen reader pass (VoiceOver): tiles announce title and values; chips announce label and pressed state; typed input announces once at the end.
- [ ] `prefers-reduced-motion` pass: no motion anywhere, all content visible on load.
- [ ] Lighthouse: Performance ≥ 90, Accessibility 100, no layout shift from fonts or the hero (reserve heights, `font-display: swap` with size-adjust or `optional`).
- [ ] Images: hero background and card icons compressed, `width`/`height` set, `loading="lazy"` below the fold only.
- [ ] Scroll performance: no long tasks during scroll; transforms and opacity only in the recede animation; `will-change` set on the hero wrapper and removed after the cover completes.
- [ ] No console errors; form submission stub logs the payload; all `href="#"` nav links replaced with real URLs or marked TODO for the owner.
- [ ] Final commit `phase-7: release candidate` with a `README.md` covering run, build, asset directory and the two dev hooks (`__heroReplay`, motion scale).

## Enhancements and mockup notes for the owner

Four enhancements are already written into the phases above because they make the demo land harder; three are optional; and three items in the mockup look like errors to confirm before implementation.

**Already included (remove from the plan if unwanted):**

1. *Idle demo loop* (Phase 5.6): chips auto-cycle until the user interacts, so visitors who never click still see the tiles respond.
2. *Hover preview* (Phase 5.3): a half-strength highlight on hover makes the chips feel connected to the tiles before committing a click.
3. *Mismatch flicker* (Phase 4.7): the amber/red values blink in after the tiles, drawing the eye to the actual disagreement the headline talks about.
4. *Hero recede* (Phase 6.2): the hero shrinks and fades as the sheet covers it, which reads as depth rather than a flat overlap.

**Optional, ask before adding:**

- Draw thin connector lines from the active chip up to its highlighted tiles (SVG overlay, 300 ms draw-on). Strong visual, but needs careful responsive handling.
- Let the search input accept real typing after `ready`; any other value shows a short "demo only" hint. Makes the hero feel live without a backend.
- A `Replay` ghost button that appears in the hero corner after the sequence, for people who missed the intro.

**Mockup items to confirm:**

- Headline reads `When your IT tools disagrees,` — should be `disagree`. Also check whether the trailing comma is intentional (it suggests a second line that is missing).
- The Phone number field uses the email placeholder `name@company.com`; it probably needs a phone placeholder such as `+1 555 000 0000`.
- The deliverables heading `What you are going to get ?` has a space before the question mark; confirm whether that is deliberate styling or a typo.
