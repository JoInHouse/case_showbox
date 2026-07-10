# SolutionDiagram — Animation Handoff

Handoff brief for animating `SolutionDiagram.layered.svg` for the DevAI solution-introduction page.

## What this artwork is

A circular "solution hub" diagram. A central mascot (DevAI bot, embedded as raster pattern fill) sits inside a glowing teal sphere, surrounded by 14 third-party tool logos (Cisco AnyConnect, Webex, Meraki, VMware, Jira, Zscaler, Microsoft Word, Surface, etc.) arranged on and around a circular orbit ring. Dashed lines (spokes) connect each logo to the center, representing DevAI mediating between the user and their tool stack.

The artwork was exported from Figma as a single flat SVG. This layered version preserves every original element and only adds semantic `<g id="...">` grouping plus `id`/`class`/`data-*` attributes on animatable items. **Rendering is pixel-identical to the source** (verified by sha256 of rasterised output).

## File: `SolutionDiagram.layered.svg`

- Viewbox: `0 0 763 737`
- Visual centre: approximately `(386.5, 384.5)` — use this for any transform-origin involving the orbit
- Orbit ring radius: `294.5`
- All gradients, filters, masks, patterns, and the embedded raster mascot live in the bottom `<defs>` block, untouched.

## Layer structure (back → front)

```
<svg>
  <mask id="mask0_7540_2644">                ← inline mask def used by Layer 1
  <g id="layer-1-ambient">                   ← ANIMATED (gradient breathe)
    <g id="ambient-glow">                    ← target this for breathe
  <g id="layer-2-arcs-and-text">             ← STATIC
    <g id="arcs">
    <g id="curved-text">
  <g id="layer-3-orbit">
    <g id="orbit-halo">                      ← STATIC (wide blurred halo)
    <g id="orbit-ring-and-dots">             ← conceptual wrapper
      <g id="orbit-track">                   ← ANIMATED (rotate continuously)
        <circle id="orbit-ring" .../>
      <g id="orbit-dots">                    ← STATIC position, but each dot twinkles
        24 × <path class="orbit-dot" data-dot-index="1..24">
  <g id="layer-4-spokes">                    ← ANIMATED (hero)
    25 × <path id="spoke-01..25" class="spoke">
  <g id="layer-5-icons-and-center">          ← STATIC (with optional entrance)
    14 × <g id="icon-NN-position">
    <g id="icon-labels">
    <g id="center-logo">
  <defs>
```

## Animation plan per layer

### Layer 1 — Ambient breathe (subtle)

Two blurred gradient rectangles inside `#ambient-glow` create the teal sphere glow. Animate the opacity of the group on a slow sine loop:

```css
#ambient-glow {
  animation: breathe 6s ease-in-out infinite;
  transform-origin: 386.5px 384.5px;
}
@keyframes breathe {
  0%, 100% { opacity: 0.85; }
  50%      { opacity: 1.00; }
}
```

Optionally add a hair of scale (1.00 ↔ 1.02) for extra life — but keep it tiny; the gradient is large and even small scale pumps feel exaggerated.

### Layer 2 — Light arcs & curved text

**Fully static.** No animation. The arcs and curved decorative text are part of the brand composition; leave them alone.

### Layer 3 — Orbit ring + twinkling dots

The 1px orbit ring (`#orbit-ring`) carries a vertical linear gradient (`paint9_linear_7540_2644`) running from bright teal `#3CF9D1` at the bottom to transparent at the top, with the brightest "hot spot" at the bottom. The element already has a baked `transform="rotate(90 386.5 384.5)"`, so the hot spot visually starts at the **3 o'clock (right) position**.

**Verified behaviour:** SVG `userSpaceOnUse` gradients rotate with the element's transform in all major renderers (Chrome, Safari, Firefox, cairo). So rotating `#orbit-ring` rotates the hot spot with it — exactly the effect we want.

**Ring rotation:**

```js
import { gsap } from 'gsap';

gsap.to('#orbit-ring', {
  rotation: '+=360',
  transformOrigin: '386.5px 384.5px',
  duration: 20,             // 20s per revolution; tune to taste
  ease: 'none',
  repeat: -1,
});
```

Note: the static `transform="rotate(90 ...)"` attribute on the `<circle>` will be overwritten when GSAP sets its own transform. To preserve the initial rotation, either strip the attribute and set initial rotation via GSAP, or use a CSS-based approach:

```js
gsap.set('#orbit-ring', { rotation: 90, transformOrigin: '386.5px 384.5px' });
gsap.to('#orbit-ring', { rotation: '+=360', duration: 20, ease: 'none', repeat: -1 });
```

**Dot twinkles synced to the hot spot:**

The dots are at fixed positions around the ring. Calculate each dot's angle from the centre once, then on every animation frame, check which dot is closest to the current hot-spot angle and trigger its twinkle.

```js
const CENTER = { x: 386.5, y: 384.5 };
const HOT_SPOT_BASE_ANGLE = 90;   // bottom of gradient = +Y direction in SVG coords
                                  //   = +90° in standard math, but SVG y is inverted
                                  // After the baked rotate(90), hot spot is at the right (0°)
                                  // → adjust the offset empirically by 90° if needed.

// Build a sorted list of dots with their fixed angle
const dots = Array.from(document.querySelectorAll('.orbit-dot')).map(el => {
  const bbox = el.getBBox();
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  let angle = Math.atan2(cy - CENTER.y, cx - CENTER.x) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  return { el, angle };
});

const ringEl = document.querySelector('#orbit-ring');
let lastTriggered = -1;

gsap.ticker.add(() => {
  // Get current rotation of the ring
  const ringRotation = (gsap.getProperty(ringEl, 'rotation') + HOT_SPOT_BASE_ANGLE) % 360;
  const hotSpotAngle = (ringRotation + 360) % 360;
  // Find the nearest dot
  let nearest = -1, nearestDist = 999;
  dots.forEach((d, i) => {
    let diff = Math.abs(d.angle - hotSpotAngle);
    diff = Math.min(diff, 360 - diff);
    if (diff < nearestDist) { nearestDist = diff; nearest = i; }
  });
  // Trigger twinkle once per dot crossing (when hot spot is within ~7° of the dot)
  if (nearestDist < 7 && nearest !== lastTriggered) {
    twinkle(dots[nearest].el);
    lastTriggered = nearest;
  }
});

function twinkle(el) {
  gsap.fromTo(el,
    { fillOpacity: 0.5, scale: 1 },
    { fillOpacity: 1.0, scale: 1.4, duration: 0.25, yoyo: true, repeat: 1,
      transformOrigin: '50% 50%', ease: 'sine.inOut' }
  );
}
```

**Tuning notes:**
- The 7° threshold and 20s ring duration are starting points. Watch the result: if multiple dots twinkle simultaneously, narrow the threshold; if there are visible gaps, widen it.
- The `HOT_SPOT_BASE_ANGLE` offset depends on which end of the gradient you treat as "hot" and the initial `rotate(90)`. Tune empirically — the value in this snippet is a placeholder.
- For a softer effect, twinkle a small window of 3 dots (the nearest plus its two neighbours) with decaying intensity.

### Layer 4 — Spokes (hero animation, INWARD flow)

Each spoke is a `<path>` with `stroke-dasharray="2 2"`. Animate `stroke-dashoffset` in the **negative** direction so the dash pattern flows from icon toward centre.

```js
const spokes = document.querySelectorAll('.spoke');

spokes.forEach((spoke, i) => {
  // Direction is uniform: negative offset → dashes appear to travel
  // along the path's parametric direction. Since each spoke is drawn
  // from icon → centre (M starts at icon, ends at centre), a negative
  // dashoffset makes the dashes flow toward the centre.
  gsap.to(spoke, {
    strokeDashoffset: '-=40',     // arbitrary distance; the loop hides this
    duration: 2 + (i % 5) * 0.2,  // mild speed variation so they're not in lockstep
    repeat: -1,
    ease: 'none',
    delay: i * 0.05,              // stagger
  });
});
```

**Important — verify path direction:** Each spoke's `d` attribute starts with `M <icon-x> <icon-y>` and ends near `(386, 385)`. The first `M` should be at the icon (outer) end; sample a few to confirm. If any spoke is drawn centre → icon instead, its dashes will appear to flow outward; flip the sign of `strokeDashoffset` for that one, or pre-process to make all paths run icon → centre.

**Optional improvement: comet trail effect.** For more visual punch, replace the static `stroke-dasharray="2 2"` with a longer asymmetric pattern (e.g. `dasharray="8 24"`) so each "dash" reads as a particle. Combine with a fading stroke gradient along the path for a true comet feel — borrows from the river-flow project's stroke-dashoffset approach.

### Layer 5 — 14 tool logos + center mascot

**Static** after entrance. There are 14 distinct icon groups:

| ID | Position (x,y of base) | Visual |
|---|---|---|
| `icon-01-top` | 281, 75 | White circle — Microsoft Word document with green check |
| `icon-02-left` | 77, 279 | Dark — Microsoft Surface device illustration |
| `icon-03-bottom-left-center` | 280, 632 | Dark teal — Cisco Webex bow-tie/microphone |
| `icon-04-top-right` | 501, 102 | Dark — Cisco AnyConnect green shield |
| `icon-05-bottom-right` | 559, 557 | Blue square — Microsoft Teams "people" silhouette |
| `icon-06-right-lower` | 605, 498 | Dark — Cisco Meraki radio/signal mark |
| `icon-07-left-lower` | 75, 427 | Gradient — VMware-like cube/symbol |
| `icon-08-right-upper` | 605, 210 | Dark — Cisco arrow-cluster (Catalyst/Nexus mark) |
| `icon-09-right` | 644, 354 | Blue — Microsoft 4-window logo |
| `icon-10-bottom-left` | 212, 605 (circle) | Dark — Cisco Webex with arc/dots |
| `icon-11-bottom-center` | 355, 643 | Gradient — Cisco Webex (alt mark) |
| `icon-12-top-left` | 150, 149 | Red — ZAB / JAB-style text mark |
| `icon-13-bottom-right-inner` | 430, 634 | Gradient — Microsoft logo squares |
| `icon-14-bottom-left-inner` | 150, 558 | Dark — secondary logo |

Some IDs are best-guess from visual inspection. **If you can confirm the actual brand each icon represents from the Figma source, rename the IDs accordingly** (e.g. `icon-microsoft-word`, `icon-cisco-anyconnect`) — semantic names will help future maintainers far more than positional ones.

**Entrance animation:**

```js
gsap.set('[id^="icon-"]', { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
gsap.to('[id^="icon-"]', {
  scale: 1, opacity: 1,
  duration: 0.5,
  ease: 'back.out(1.7)',
  stagger: { each: 0.06, from: 'random' },   // random stagger feels alive
  delay: 0.3,
});
```

Trigger on `IntersectionObserver` so it plays when the diagram scrolls into view, not on initial page load.

The center mascot (`#center-logo`) can either fade in last (after icons, ~0.3s after the final icon) or remain static. A very gentle continuous scale breathe (0.98 ↔ 1.02 over 5s) reads as alive without being distracting.

## Suggested implementation stack

This matches the `animation-playground` project conventions:

- **GSAP** for spoke tweens and the orbit ring rotation (timeline control, easy ticker access for the twinkle sync).
- **CSS animations** for L1 ambient breathing (keeps it off the main JS thread).
- **IntersectionObserver** to gate the whole animation to visible viewport.
- **`prefers-reduced-motion`** check: degrade to static rendering or single subtle pulse on the centre.

## Animation orchestration order

When the diagram scrolls into view:

1. `t = 0.0s` — L1 breathing kicks in (CSS animation already running from page load; just becomes visible)
2. `t = 0.0s` — Orbit ring starts rotating (was paused; resume)
3. `t = 0.3s` — Icons begin staggered entrance (random order, ~0.06s between)
4. `t = 1.5s` — All icons settled; spokes begin flowing inward (staggered)
5. `t = 2.0s` — Dot twinkles begin firing as ring rotation passes them

## Performance budget

- 25 simultaneous spoke tweens + 1 ring rotation + per-frame angle check for twinkle = cheap on desktop.
- On mid-range mobile, the per-frame `gsap.getProperty(ringEl, 'rotation')` lookup is fine, but consider memoising the dot positions outside the ticker (already done in the snippet above).
- Wrap everything in `IntersectionObserver` to pause when offscreen.
- Target 60fps; below 50fps on a real mobile device, drop the dot-twinkle feature first (it's the most expensive bit).

## Asset weight

The SVG is ~590 KB because the mascot is embedded as base64 PNG inside `<defs>`. For a marketing landing page this matters.

**Recommendation:** extract the mascot to an optimised external `.webp` and replace the `<pattern>` fill with an `<image>` element pointing to it. This drops the SVG to ~30 KB.

```svg
<!-- replace this in <defs> -->
<pattern id="pattern0_7540_2644" patternContentUnits="objectBoundingBox" width="1" height="1">
  <use xlink:href="#image0_7540_2644" transform="scale(0.00121065)"/>
</pattern>

<!-- with -->
<pattern id="pattern0_7540_2644" patternContentUnits="objectBoundingBox" width="1" height="1">
  <image href="/assets/devai-mascot.webp" width="1" height="1" preserveAspectRatio="xMidYMid slice"/>
</pattern>
```

And remove the giant `<image id="image0_7540_2644">` block from `<defs>`.

## What NOT to animate

- `#orbit-halo` (wide blurred ellipse) — atmospheric anchor, leave static.
- L2 arcs and curved text — fully static per spec.
- Icon internals (the rects and paths inside `icon-NN-*` groups) — animating logo internals harms brand recognition.
- Icon text labels (`#icon-labels`) — must stay legible.

## Verification before merging

1. Render the static SVG (JS disabled) and confirm it matches the original pixel-for-pixel.
2. Performance panel with CPU throttled 4×: spoke animation should stay above 50fps.
3. Toggle `prefers-reduced-motion: reduce` in DevTools and confirm graceful degradation.
4. On Safari: confirm `userSpaceOnUse` gradient rotates with the `<circle>` transform (it should, but Safari occasionally surprises).

## Open follow-ups

- Confirm actual brand mapping for the 14 icons and rename IDs semantically.
- Decide whether icons get hover state (e.g. scale 1.05, brighten touching spokes).
- Decide whether the mascot has micro-interaction on hover (eye blink, small bob). Currently scoped as static or gentle breathe.
- Extract mascot to external `.webp` to reduce file weight.
