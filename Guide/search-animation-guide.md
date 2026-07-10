# Search Animation Simulation — Implementation Guide (v2, GSAP)

## Overview

This guide walks through building a front-end search simulation on an existing HTML dashboard using **GSAP** for all animation orchestration. The animation is triggered by the Search button and progresses through timed states, ending when the user clicks "Stop searching" on the ServiceNow source.

**Tech stack assumptions:**
- GSAP 3.x available (CDN or installed)
- No ScrollTrigger needed — all animations are time-based
- CSS handles the gradient text sweep (GSAP class-toggling only — see Phase 3 for reason)

---

## Phase 1 — Audit & Scaffold

### Step 1.1 — Audit the existing HTML

Locate the following elements in the existing HTML file and assign stable IDs or `data-` attributes if they don't already have them:

- The **Search button** (top-right area) → `id="search-btn"`
- The **status bar items** → `data-source="dynatrace|servicenow|vmwvrops"` on each source wrapper
- The **three result sections** below → `id="section-dynatrace|section-servicenow|section-vmwvrops"` with class `source-section`

### Step 1.2 — Define the state model

Add this as a reference comment at the top of `search-animation.js`:

```js
/*
  State transitions per source:

  Dynatrace  : searching → done           (at 1.5s)
  VMW VROPS  : searching → done           (at 1.5s)
  ServiceNow : searching → found          (at 1.5s)
               found     → found_cancel   (at 15s)
               found_cancel → stopped     (on click)
*/
```

### Step 1.3 — Hide result sections initially

```css
.source-section {
  opacity: 0;
  visibility: hidden;
}
```

GSAP will handle the reveal — do not add CSS transitions here, as GSAP manages easing directly.

---

## Phase 2 — SVG Progress Ring Markup

Each source logo in the status bar (and the ServiceNow section header) gets a rotating SVG ring overlay during working mode.

### Step 2.1 — Wrap each source icon

```html
<span class="source-icon-wrap" data-source="dynatrace">
  <!-- existing logo img or inline svg -->
  <svg class="progress-ring" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle
      class="progress-ring__arc"
      cx="16" cy="16" r="13"
      fill="none"
      stroke="#009900"
      stroke-width="2"
      stroke-linecap="round"
      stroke-dasharray="25 57"
    />
  </svg>
</span>
```

Brand stroke colours:
- Dynatrace: `#009900`
- ServiceNow: `#62D84E`
- VMW VROPS: `#1D428A`

### Step 2.2 — CSS for ring positioning only

```css
.source-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.source-icon-wrap img,
.source-icon-wrap .icon {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 1;
}

.progress-ring {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transform-origin: center center;
}
```

> ⚠️ Do **not** add a CSS `animation` to `.progress-ring__arc` — GSAP owns the rotation.

---

## Phase 3 — Gradient Text Sweep

### Why CSS, not GSAP

GSAP cannot reliably tween `background-position` on elements using `-webkit-background-clip: text` across all browsers. The sweep is implemented as a **CSS animation class** that GSAP toggles at the right moment via callbacks.

### Step 3.1 — CSS sweep classes

```css
.status-text.sweeping {
  background: linear-gradient(
    90deg,
    #999 0%,
    #999 25%,
    #111 50%,
    #999 75%,
    #999 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: text-sweep 1.8s linear infinite;
}

@keyframes text-sweep {
  0%   { background-position: 100% center; }
  100% { background-position: -100% center; }
}

.status-text.static {
  animation: none;
  -webkit-text-fill-color: unset;
  background: none;
  color: #333;
}
```

### Step 3.2 — "Stop searching" link style

```css
.stop-searching-link {
  display: inline;
  margin-left: 8px;
  color: #0066CC;
  font-size: inherit;
  text-decoration: underline;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
}

/* GSAP drives opacity — no CSS transition needed here */
```

---

## Phase 4 — GSAP Animation Controller

All orchestration lives in a single master GSAP timeline. This is the core change from a raw `setTimeout` approach — one `masterTl.kill()` call stops everything cleanly.

### Step 4.1 — File structure

Create `search-animation.js`. Keep it separate from any existing scripts.

```js
// search-animation.js
// Requires GSAP 3.x

let masterTl = null;
let ringTweens = {}; // stores per-source ring rotation tweens for targeted kill
```

### Step 4.2 — Reset function

```js
function resetAll() {
  // Kill any running animation
  if (masterTl) masterTl.kill();
  Object.values(ringTweens).forEach(t => t.kill());
  ringTweens = {};

  // Reset section visibility
  gsap.set('.source-section', { opacity: 0, visibility: 'hidden', y: 8 });

  // Reset status texts
  ['dynatrace', 'servicenow', 'vmwvrops'].forEach(id => {
    setStatusText(id, 'Searching…', true);
  });

  // Reset progress rings — restore opacity and rotation
  gsap.set('.progress-ring', { opacity: 1, rotation: 0 });

  // Hide stop-searching links
  gsap.set('.stop-searching-link', { opacity: 0, pointerEvents: 'none' });
}
```

### Step 4.3 — Helper: setStatusText

```js
function setStatusText(sourceId, text, sweeping) {
  // Targets both the status bar item AND the matching section header
  const els = document.querySelectorAll(
    `[data-source="${sourceId}"] .status-text,
     #section-${sourceId} .section-status-text`
  );
  els.forEach(el => {
    el.textContent = text;
    el.classList.toggle('sweeping', sweeping);
    el.classList.toggle('static', !sweeping);
  });
}
```

### Step 4.4 — Ring spin helper

```js
function startRing(sourceId) {
  const rings = document.querySelectorAll(
    `[data-source="${sourceId}"] .progress-ring__arc,
     #section-${sourceId} .progress-ring__arc`
  );
  rings.forEach(ring => {
    ringTweens[sourceId] = gsap.to(ring, {
      rotation: 360,
      duration: 1,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    });
  });
}

function stopRing(sourceId) {
  if (ringTweens[sourceId]) {
    ringTweens[sourceId].kill();
    delete ringTweens[sourceId];
  }
  gsap.to(
    document.querySelectorAll(
      `[data-source="${sourceId}"] .progress-ring,
       #section-${sourceId} .progress-ring`
    ),
    { opacity: 0, duration: 0.3 }
  );
}
```

### Step 4.5 — Section reveal helper

```js
function revealSection(sectionId) {
  gsap.to(`#${sectionId}`, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    ease: 'power2.out',
    visibility: 'visible',
  });
}
```

### Step 4.6 — Master timeline

```js
function startSearchAnimation() {
  resetAll();

  // Start all three rings immediately
  startRing('dynatrace');
  startRing('servicenow');
  startRing('vmwvrops');

  masterTl = gsap.timeline();

  // ── T = 1.5s : Dynatrace → result mode ──────────────────────────────
  masterTl.add(() => {
    stopRing('dynatrace');
    setStatusText('dynatrace', '6 a-types', false);
    revealSection('section-dynatrace');
  }, 1.5);

  // ── T = 1.5s : VMW VROPS → result mode ──────────────────────────────
  masterTl.add(() => {
    stopRing('vmwvrops');
    setStatusText('vmwvrops', '8 b-types', false);
    revealSection('section-vmwvrops');
  }, 1.5);

  // ── T = 1.5s : ServiceNow → intermediate state ───────────────────────
  masterTl.add(() => {
    // Ring keeps spinning, sweep keeps going, text updates
    setStatusText('servicenow', '1 found · Deep searching for related results', true);
    revealSection('section-servicenow');
  }, 1.5);

  // ── T = 15s : ServiceNow → show "Stop searching" ─────────────────────
  masterTl.add(() => {
    // Stop text sweep, keep ring
    setStatusText('servicenow', '1 found · Deep searching for related results', false);

    // Reveal Stop searching links (status bar + section)
    gsap.to('.stop-searching-link', {
      opacity: 1,
      duration: 0.3,
      ease: 'power1.out',
      onComplete: () => {
        document.querySelectorAll('.stop-searching-link')
          .forEach(el => el.style.pointerEvents = 'auto');
      }
    });
  }, 15);
}
```

### Step 4.7 — Stop searching handler

```js
function stopSearching() {
  // Kill master timeline — no more pending callbacks
  if (masterTl) masterTl.kill();

  // Stop ServiceNow ring
  stopRing('servicenow');

  // Finalise text states
  setStatusText('servicenow', '1 found', false);

  // Hide stop-searching links
  gsap.to('.stop-searching-link', {
    opacity: 0,
    duration: 0.2,
    onComplete: () => {
      document.querySelectorAll('.stop-searching-link')
        .forEach(el => el.style.pointerEvents = 'none');
    }
  });
}
```

### Step 4.8 — Bind event listeners

```js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#search-btn')
    .addEventListener('click', startSearchAnimation);

  // Event delegation for stop-searching links
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('stop-searching-link')) {
      stopSearching();
    }
  });
});
```

---

## Phase 5 — ServiceNow Section Header Markup

The ServiceNow section header mirrors the status bar — same CSS classes, same GSAP targets via the shared `data-source` and section `id` selectors already used in the helpers above.

```html
<section id="section-servicenow" class="source-section">
  <div class="section-header">
    <span class="source-icon-wrap" data-source="servicenow">
      <!-- ServiceNow logo -->
      <svg class="progress-ring" viewBox="0 0 32 32">
        <circle
          class="progress-ring__arc"
          cx="16" cy="16" r="13"
          fill="none" stroke="#62D84E"
          stroke-width="2" stroke-linecap="round"
          stroke-dasharray="25 57"
        />
      </svg>
    </span>
    <span class="section-status-text sweeping">
      1 found · Deep searching for related results
    </span>
    <a class="stop-searching-link">Stop searching</a>
  </div>
  <!-- card grid here -->
</section>
```

> No extra JS needed — `setStatusText()` and `stopRing()` already query both the status bar and section elements by `data-source` and `#section-{id}` simultaneously.

---

## Phase 6 — Integration Checklist

- [ ] GSAP 3.x loaded before `search-animation.js`
- [ ] Search button has `id="search-btn"`
- [ ] All status bar source wrappers have `data-source="dynatrace|servicenow|vmwvrops"`
- [ ] All result sections have matching `id="section-dynatrace|section-servicenow|section-vmwvrops"` and class `source-section`
- [ ] `.stop-searching-link` exists in both the status bar ServiceNow item and the ServiceNow section header
- [ ] No CSS `animation` on `.progress-ring__arc` — GSAP owns rotation
- [ ] Test re-triggering Search mid-animation — `resetAll()` should cleanly kill and restart

---

## Timing Summary

| Time      | Dynatrace           | ServiceNow                                                  | VMW VROPS           |
|-----------|---------------------|-------------------------------------------------------------|---------------------|
| T = 0     | Ring + sweep        | Ring + sweep · "Searching…"                                 | Ring + sweep        |
| T = 1.5s  | Static · "6 a-types"| Ring + sweep · "1 found · Deep searching…"                  | Static · "8 b-types"|
| T = 15s   | —                   | Ring only · static text · "Stop searching" link appears     | —                   |
| On stop   | —                   | Ring hidden · "1 found" · links removed                     | —                   |

---

## GSAP vs CSS Responsibility Split

| Concern                        | Owner     | Reason                                              |
|-------------------------------|-----------|-----------------------------------------------------|
| Ring rotation                  | GSAP      | `repeat: -1`, precise kill per source               |
| Section reveal (opacity + y)   | GSAP      | Easing control, `visibility` handling               |
| Stop searching link fade       | GSAP      | Coordinated with timeline callbacks                 |
| Gradient text sweep            | CSS class | `background-clip: text` not reliably tweenable      |
| Sweep start / stop             | GSAP      | Class toggle via `setStatusText()` callback         |
