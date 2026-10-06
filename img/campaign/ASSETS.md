# DevAI Campaign Page — Asset map

Figma frame: `DevAI_Site` › `GetYourDataTruthScore` (node `9796:4992`).
Page: `pages/devai-campaign.html`. All paths below are relative to the repo root.

| Figma layer (node) | Used for | File on disk | Status |
| --- | --- | --- | --- |
| `Group 1` (9796:4994) | Header logo | `img/devai-logo.svg` (inlined into the page so the grey strokes can flip to dark via `currentColor` on light backgrounds) | ✅ |
| `Group 48096468` (9940:4203) | Hero background rings | `img/campaign/FocusArea_bg.svg` | ✅ |
| `Icon/Dark/Server` (10045:4530) | Hero summary line icon | `img/campaign/Server.svg` | ✅ |
| `warning-triangle--frame-alert-…` (10050:4572 ×4) | Alert chip icon | `img/campaign/warning-triangle--frame-alert-warning-triangle-exclamation-caution.svg` | ✅ |
| `Icon/Digits/1` (10064:4772) | How-it-works step 1 | `img/campaign/1.svg` | ✅ |
| `Icon/Digits/2` (10064:4776) | How-it-works step 2 | `img/campaign/2.svg` | ✅ |
| `Icon/Digits/3` (10064:4780) | How-it-works step 3 | `img/campaign/3.svg` | ✅ |
| `shield-check--shield-protection-…` (10063:4759) | Security banner icon | `img/campaign/shield-lock.svg` | ✅ |
| `Discrepancy` (10060:4632) | Deliverable card icon | `img/campaign/Discrepancy.svg` | ✅ |
| `Waste` (10060:4639) | Deliverable card icon | `img/campaign/Waste.svg` | ✅ |
| `Missing` (10060:4650) | Deliverable card icon ("Security blind spots") | `img/campaign/Missing.svg` | ✅ |
| `Readiness` (10060:4663) | Deliverable card icon | `img/campaign/Readiness.svg` | ✅ |
| `Roadmap` (10060:4676) | Deliverable card icon | `img/campaign/Roadmap.svg` | ✅ |
| `Icon/Bright/Arrow-Right` (instance of 333:75), grey `#707793` stroke | Nav chevrons (Solution, Newsroom, Book a demo) | `img/campaign/arrow-right.svg` | ❌ **missing** — grey placeholder shown |
| `Icon/Bright/Arrow-Right` (10063:4768), dark `#0D1336` stroke | Sign-up button chevron | `img/campaign/arrow-right-dark.svg` | ❌ **missing** — grey placeholder shown |
| `Linkedin` (9796:6611) | Footer LinkedIn link | `img/campaign/linkedin.svg` | ❌ **missing** — grey placeholder shown |
| `Line 20` (9796:6607) | Footer top divider | — | Drawn in CSS: a 1 px line with a `linear-gradient` (`#3A3A3A` at 0 opacity → `#B4B4B4` → `#3A3A3A` at 0 opacity), copied from the Figma values. Not an exported asset. |

## Missing files: how to drop them in

The page renders each missing asset as a visible grey box of the correct size
(`<span class="asset-ph" data-asset="…">`). At load, a small script tries to load
`img/campaign/<data-asset>`, and **if the file exists it swaps the placeholder
for the real image automatically**. To fix a placeholder, export the file under
the exact name above and reload the page; no code change is needed.

Export sizes: `arrow-right.svg` / `arrow-right-dark.svg` 12×12 frame,
`linkedin.svg` 25×25 frame.

## Fonts

Figma uses Source Sans Pro / Source Sans 3, Lato, and Google Sans Code. No
woff2 exports were provided, so the page loads them from Google Fonts like the
rest of this repo, using `display=swap`. Source Sans 3 is the maintained
successor of Source Sans Pro, with the same metrics.
