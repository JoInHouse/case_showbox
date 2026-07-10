# Gigaram SVG Animation — Implementation Guide

## Project Overview

Animate the Gigaram.svg asset for web deployment. The SVG contains multiple distinct element groups, each receiving its own animation treatment while maintaining 60fps performance across all mainstream browsers.

---

## 1. SVG Structure Analysis

The Gigaram.svg file (326 lines) contains these key element groups:

| Group | Elements | Role |
|-------|----------|------|
| **Left Paths Set** | ~5 curved `<path>` elements on the left side | Particle travel lanes (left emitter) |
| **Right Paths Set** | ~5 curved `<path>` elements on the right side | Particle travel lanes (right emitter) |
| **Circle Dot Array** | Multiple `<circle>` elements arranged in a pattern | Individual pulsing/scaling dot animations |
| **Center Image** | `<image>` element (embedded or linked) | Subtle floating/breathing movement |
| **Right Outer Path** | Outer boundary `<path>` on the right | Animated gradient border fill |
| **Static Elements** | Remaining `<rect>`, `<g>`, filters, masks, defs | No animation — rendered as-is |

### Element Identification Strategy

Each animatable group should be targeted via:
- Existing `id` attributes in the SVG
- CSS class names added during preprocessing
- DOM query selectors (`querySelectorAll('path')` filtered by position/attributes)

---

## 2. Animation Specifications

### 2A. Particle Systems (Left & Right Paths)

**Concept:** Small glowing particles travel along the SVG path curves, creating a flowing energy/data-stream effect.

**Technical Approach:**
- Extract path data using `SVGGeometryElement.getPointAtLength()` for precise positioning
- Render particles on a **Canvas overlay** (not as SVG elements) for performance
- Each path spawns particles at staggered intervals

**Parameters:**
```
Particle count per path:  8–15 active at any time
Particle size:            2–4px radius (randomized)
Particle speed:           Varies per path, 3–6 seconds full traversal
Particle color:           Match SVG path stroke color with additive glow
Particle opacity:         Fade in at 0%→100% over first 10% of path
                          Fade out at 90%→0% over last 10% of path
Trail effect:             2–3 trailing ghost particles at reduced opacity
Emission rate:            New particle every 300–600ms per path
Loop:                     Continuous — particles recycle on completion
```

**Right-side delay:** Right path particles start 1–2 seconds after left paths begin animating (staggered launch).

### 2B. Circle Dot Array Animation

**Concept:** Each dot pulses independently with a subtle scale + opacity animation, creating a shimmering/twinkling field.

**Technical Approach:**
- Animate directly via **GSAP** on the SVG `<circle>` elements
- Use `gsap.to()` with stagger for wave-like propagation

**Parameters:**
```
Animation type:     Scale (0.6 → 1.0 → 0.6) + Opacity (0.4 → 1.0 → 0.4)
Duration:           1.5–3s per dot (randomized)
Stagger:            0.05–0.15s between adjacent dots
Easing:             sine.inOut
Loop:               Infinite (yoyo: true, repeat: -1)
Direction:          Radial outward from center, or left-to-right wave
```

### 2C. Center Image — Subtle Movement

**Concept:** The center image "breathes" with a slow, gentle floating motion — slight translation + minimal scale.

**Technical Approach:**
- GSAP timeline on the `<image>` element's transform
- CSS `transform-origin: center center`

**Parameters:**
```
Translation X:     ±3–5px oscillation
Translation Y:     ±2–4px oscillation
Scale:             1.0 → 1.015 → 1.0 (barely perceptible)
Rotation:          ±0.5° (optional, very subtle)
Duration:          4–6s full cycle
Easing:            sine.inOut
Loop:              Infinite (yoyo: true)
```

### 2D. Right Outer Path — Gradient Border Effect

**Concept:** An animated gradient sweeps along the outer path's stroke, creating a glowing border that rotates or pulses.

**Technical Approach — Two Options:**

**Option A: Animated `stroke-dashoffset` (simpler, good performance)**
```
stroke-dasharray:   Set to path total length
stroke-dashoffset:  Animate from totalLength → 0 (draw-on effect)
                    Then loop with gradient stroke color
Duration:           3–5s per cycle
```

**Option B: Animated SVG `<linearGradient>` stops (richer visual)**
```
Gradient stops:     Animate x1/y1/x2/y2 attributes to rotate gradient direction
                    Or animate stop-color/stop-opacity for pulsing glow
Duration:           4–6s per cycle
Method:             GSAP .to() on gradient attributes directly
```

**Recommendation:** Start with Option A for reliability. Layer Option B if the visual needs more richness.

---

## 3. Technical Architecture

### Chosen Stack: GSAP + Canvas Hybrid

```
┌─────────────────────────────────────────┐
│              HTML Container              │
│  ┌───────────────────────────────────┐  │
│  │     Canvas Layer (absolute pos)    │  │  ← Particle systems rendered here
│  │     z-index: 2                     │  │
│  ├───────────────────────────────────┤  │
│  │     SVG Layer (absolute pos)       │  │  ← Original SVG with GSAP animations
│  │     z-index: 1                     │  │     (dots, center image, gradient)
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Why This Stack

| Consideration | Decision | Rationale |
|--------------|----------|-----------|
| **Particle rendering** | Canvas 2D | Hundreds of particles as SVG `<circle>` elements would thrash the DOM. Canvas batch-draws in a single rasterization pass. |
| **Dot/image/gradient animation** | GSAP on SVG DOM | Few elements, GSAP handles transforms efficiently, preserves SVG scalability for these static-ish elements. |
| **Browser compatibility** | GSAP 3.x + Canvas 2D | Both supported in Chrome, Firefox, Safari, Edge. No WebGL dependency. |
| **Performance budget** | requestAnimationFrame loop for Canvas; GSAP's internal ticker for SVG | Keeps main thread lean. Target: <8ms per frame. |
| **Responsiveness** | CSS container + viewBox preservation + Canvas resize listener | SVG scales via viewBox. Canvas redraws on resize with debounce. |

### Dependencies

```json
{
  "gsap": "^3.12.0"
}
```

No other runtime dependencies. GSAP is the only external library needed.

Optional: `DrawSVGPlugin` (GSAP Club) for enhanced stroke animation on the gradient border — but the free GSAP core handles `stroke-dashoffset` natively.

---

## 4. File Structure

```
project/
├── index.html              # Entry point — container markup
├── css/
│   └── animation.css       # Positioning, responsive rules, base styles
├── js/
│   ├── main.js             # Initialization, resize handling, orchestration
│   ├── particleSystem.js   # Canvas particle engine
│   ├── dotAnimations.js    # GSAP circle dot array animations
│   ├── centerImage.js      # GSAP center image floating animation
│   └── gradientBorder.js   # GSAP outer path gradient/stroke animation
├── assets/
│   └── Gigaram.svg         # Source SVG asset
└── README.md
```

---

## 5. Implementation Steps

### Phase 1: Setup & Static Render
1. Inline the SVG into `index.html` (or load via `<object>` / fetch + inject)
2. Create the Canvas overlay element, matching SVG dimensions
3. Establish CSS positioning (both layers absolute within a relative container)
4. Add resize observer / listener with debounced Canvas redraw
5. Verify SVG renders correctly at multiple viewport sizes

### Phase 2: Particle System (Canvas)
1. Extract path data from SVG DOM: `path.getTotalLength()` and `path.getPointAtLength()`
2. Build particle class: position, velocity along path, opacity, size, trail history
3. Create emitter per path with configurable spawn rate and speed
4. Implement the `requestAnimationFrame` render loop: clear → update → draw
5. Add fade-in/fade-out at path endpoints
6. Add trailing ghost particles (store last N positions per particle)
7. Implement right-side delay (setTimeout or frame-count gate)

### Phase 3: Dot Array Animation (GSAP + SVG)
1. Query all `<circle>` elements in the dot array group
2. Apply `gsap.to()` with stagger for scale + opacity
3. Fine-tune stagger timing and easing
4. Verify no layout thrashing (use `transform` not `cx`/`cy` for movement)

### Phase 4: Center Image Animation (GSAP + SVG)
1. Target the `<image>` element
2. Build a GSAP timeline: translateX, translateY, scale oscillations
3. Set `transformOrigin` correctly
4. Test at various viewport sizes to ensure movement stays proportional

### Phase 5: Gradient Border (GSAP + SVG)
1. Calculate `path.getTotalLength()` for the outer path
2. Set initial `stroke-dasharray` and `stroke-dashoffset`
3. Animate with `gsap.to()` for the draw-on / sweep effect
4. Optionally animate `<linearGradient>` attributes for color sweep

### Phase 6: Polish & Optimization
1. Profile with Chrome DevTools Performance tab — target <8ms/frame
2. Test on Safari (especially iOS Safari for Canvas performance)
3. Add `will-change: transform` to GSAP-animated SVG elements
4. Implement visibility API pause (stop animations when tab is hidden)
5. Add reduced-motion media query fallback: `@media (prefers-reduced-motion: reduce)`
6. Responsive testing: mobile, tablet, desktop breakpoints

---

## 6. Performance Optimization Checklist

- [ ] Particles rendered on Canvas, NOT as SVG DOM elements
- [ ] `requestAnimationFrame` for Canvas loop (not `setInterval`)
- [ ] Particle pool / object recycling (avoid GC pressure from `new` on every spawn)
- [ ] Canvas `clearRect` only on the drawn region if possible
- [ ] GSAP animations use `transform` (GPU-composited) not layout properties
- [ ] `will-change: transform, opacity` on animated SVG elements
- [ ] Visibility API: pause all animations when document is hidden
- [ ] Debounced resize handler (100–200ms debounce)
- [ ] `prefers-reduced-motion` respected: disable or simplify all animations
- [ ] Particle count caps: hard max per path to prevent runaway spawning

---

## 7. Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | iOS Safari |
|---------|--------|---------|--------|------|------------|
| Canvas 2D | ✅ | ✅ | ✅ | ✅ | ✅ |
| GSAP 3.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| `getPointAtLength()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| SVG `<image>` transform | ✅ | ✅ | ⚠️ * | ✅ | ⚠️ * |
| CSS `will-change` | ✅ | ✅ | ✅ | ✅ | ✅ |

\* Safari note: SVG transform-origin can behave differently. Use GSAP's built-in `svgOrigin` or `transformOrigin` with pixel values rather than percentages for Safari reliability.

---

## 8. Configuration & Customization

All animation parameters should be centralized in a config object for easy tuning:

```javascript
const CONFIG = {
  particles: {
    countPerPath: { min: 8, max: 15 },
    size: { min: 2, max: 4 },
    speed: { min: 3, max: 6 },       // seconds for full path traversal
    emitInterval: { min: 300, max: 600 }, // ms
    trailLength: 3,
    rightSideDelay: 1500,             // ms delay before right paths start
    glowColor: 'rgba(100, 200, 255, 0.8)',
  },
  dots: {
    scaleRange: [0.6, 1.0],
    opacityRange: [0.4, 1.0],
    duration: { min: 1.5, max: 3.0 },
    stagger: 0.08,
    ease: 'sine.inOut',
  },
  centerImage: {
    translateX: 5,     // px amplitude
    translateY: 4,
    scale: 1.015,
    rotation: 0.5,     // degrees
    duration: 5,
    ease: 'sine.inOut',
  },
  gradientBorder: {
    duration: 4,
    ease: 'none',       // linear for continuous sweep
    method: 'dashoffset', // 'dashoffset' or 'gradient-rotate'
  },
};
```

---

## 9. Getting Started with Claude Code

To continue implementation in Claude Code, place this guide and the SVG in your project root, then:

```bash
claude "Read svg-animation-implementation-guide.md and assets/Gigaram.svg. 
Start with Phase 1: set up the HTML container with the SVG inlined and 
a Canvas overlay. Then proceed to Phase 2: build the particle system."
```

Or add to `CLAUDE.md` for persistent context across sessions:

```markdown
# Project Context
This is a web animation project for Gigaram.svg. 
See svg-animation-implementation-guide.md for the full implementation plan.
Tech stack: GSAP 3.x + Canvas 2D hybrid. No other frameworks.
```
