# Project: animation-playground

A personal lab for prototyping web-based animations — SVG animations, UI interaction effects, motion design experiments. Good outcomes get promoted to a public GitHub portfolio.

## Tech Stack

- HTML / CSS / JavaScript (vanilla)
- GSAP (GreenSock) — primary animation library
- CSS Animations & Transitions
- Web Animations API
- SVG (inline preferred for animation control)

## Structure

```
animation-playground/
├── pages/          # Each animation case = one self-contained HTML file
├── css/            # Shared stylesheets (resets, common utilities)
├── js/             # Shared scripts (helpers, reusable animation utilities)
├── images/         # SVGs, assets, reference images
└── CLAUDE.md
```

## Conventions

- Each animation case is a single self-contained HTML page in `/pages/`
- Inline `<style>` and `<script>` within the page unless extracting shared utilities
- Use descriptive filenames: `svg-morphing-loader.html`, `button-hover-ripple.html`
- GSAP loaded via CDN (`https://cdnjs.cloudflare.com/ajax/libs/gsap/...`), not npm
- Include GSAP plugins (DrawSVGPlugin, MorphSVGPlugin, ScrollTrigger) via CDN when needed
- For SVG animation, prefer inline SVG over `<img>` or `<object>` tags
- Each page should be viewable standalone — open directly in browser, no build step

## Animation Preferences

- Favor GSAP timelines over chained tweens for sequenced animations
- Use CSS transitions for simple state changes (hover, focus, toggle)
- Use Web Animations API when CSS alone is limiting but GSAP is overkill
- Prefer `transform` and `opacity` for GPU-accelerated performance
- Always set `will-change` sparingly and remove after animation completes
- Test in both Chrome and Safari — Safari has known SVG animation quirks

## When Creating a New Animation Case

1. Create a new HTML file in `/pages/` with a descriptive name
2. Include a `<title>` and brief comment at top describing the effect
3. Keep it self-contained: all CSS/JS inline unless using shared utilities from `/css/` or `/js/`
4. Add a visible heading or label on the page so the effect is identifiable in a browser tab

## Important Notes

- This is a playground, not production — prioritize experimentation and clarity over optimization
- Pages may eventually be cleaned up for public GitHub showcase, so write readable code
- NEVER hardcode absolute file paths — use relative paths for all assets
- For complex SVG work, see source `.svg` files in `/img/` for original paths and structure
