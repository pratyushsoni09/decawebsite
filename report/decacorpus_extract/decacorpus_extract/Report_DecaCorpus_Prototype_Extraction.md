# DecaCorpus — “Build What’s Next.” · Prototype Extraction Report

**Source file:** `DecaCorpus_Build_Whats_Next.html` (646,622 bytes · 868 lines · 1 HTML document)
**Purpose:** a complete, unmodified inventory of the prototype so it can be rebuilt as production code. Nothing has been changed, added or removed from the design or the copy. Where the prototype contradicts itself, I report both sides and do not pick one (see §15).

---

## 0. How this report was made, and how to trust it

1. I read the whole file: all CSS (~87 KB), all 7 page templates, every script, and decoded all 7 embedded images.
2. I also **rendered every route** in headless Chromium at 1440×900 and 390×844 and recorded the *computed* typography and section geometry, so values are the final result of the cascade, not my guess from reading overlapping rules.
3. Copy is quoted verbatim, including typographic apostrophes (’) and the “•” and “/” separators.

**Limits (so you are not surprised later):**
- Google Fonts and the Lenis CDN script were unreachable in my sandbox. Sizes and font-family requests are exact; I could not visually check glyph shapes or Lenis smooth-scroll feel.
- Hover, drag and scroll-driven behaviours are documented from the code, not from video.
- The screenshots in `reference_screenshots_desktop_viewport/` are first-viewport only, with fallback fonts.

**Files delivered** (all in `decacorpus_extract/`):

| File | What it is |
|---|---|
| `Report_DecaCorpus_Prototype_Extraction.md` | This report |
| `Appendix_A_Computed_Typography.md` | ~280 measured type styles, every page, desktop + mobile |
| `source/styles.css` | The complete CSS, byte-for-byte, in original order |
| `source/app.js` | The main script (base64 images replaced by a placeholder, everything else untouched) |
| `source/loader.js` | The tiny first script (loader counter + failsafe) |
| `source/computed_probe_raw.json` | Raw measurement data behind Appendix A |
| `assets/images/*.jpg` | The 7 embedded images, decoded losslessly from the base64 |
| `reference_screenshots_desktop_viewport/` | 7 first-screen renders |

---

## 1. What the prototype is

- A **single-file, client-rendered, hash-routed site** (`#/`, `#/services`, …). The `<main id="app">` is empty in the HTML; each page is a template function in an object `V` that sets `innerHTML`.
- **7 routes:** `home`, `services`, `work`, `studio`, `insights`, `careers`, `contact`.
- **Dark theme** (near-black), with white/“lm” cream accents and two white “matte” panels.
- **No backend.** The contact form, poll and CRM dashboard are all simulated.
- External dependencies: Google Fonts, Lenis 1.1.20 (CDN). Everything else (icons, charts, illustrations, background) is inline SVG / CSS / canvas.

### 1.1 The CSS is layered — later rules win
The stylesheet was edited in rounds, and the comments mark them: base → `/* v7 */` → `/* v8 */` → `/* v9 multipage */` → `/* v10 references */` → `/* fixes */` → several page redesign blocks → `/* audit pass */` → `/* round 5 */` → `/* ---- requested changes ---- */` → `/* round 2 */` → `/* round 3 */`. **Rule of thumb for the rebuild: the last matching rule is the truth.** The biggest overrides are listed in §15.1.

---

## 2. Dependencies, fonts, meta

| Item | Value |
|---|---|
| `<html lang>` | `en`; class `js` added immediately; class `fail` added on any JS error |
| Charset | utf-8 |
| Viewport | `width=device-width, initial-scale=1, viewport-fit=cover` |
| Title (default) | DecaCorpus \| Build What’s Next. |
| Meta description | Digital products, software systems and technology built for ambitious businesses. |
| Font link | `fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@1&family=Inter:wght@400;500;600;700&display=swap` |
| Script | `cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js` |
| Favicon | none declared |
| Open Graph / Twitter tags | none |
| Canonical / robots | none |

**Per-route document titles** (`T`): home “DecaCorpus | Build What’s Next.” · services “Services | DecaCorpus” · work “Healthcare CRM concept | DecaCorpus” · studio “The Studio | DecaCorpus” · insights “Insights | DecaCorpus” · careers “Careers | DecaCorpus” · contact “Contact | DecaCorpus”.

---

## 3. Design tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0a` | page background |
| `--s1` | `#121212` | surface 1 (cards, slideshow, process bg base) |
| `--s2` | `#1a1a19` | surface 2 |
| `--ln` | `#2a2a28` | hairlines / borders |
| `--tx` | `#f2f0ea` | primary text (warm off-white) |
| `--mu` | `#9a968a` | muted text |
| `--lm` | `#f2f0ea` | accent (same as `--tx`; “lime” renamed to cream) |
| `--t2` | `#c9c6bd` | secondary text (audit pass) |
| `--wh` | `#fff` | white panels, CTA band, page-transition slab |
| `--pad` | `clamp(20px,5vw,64px)` (nav: `clamp(20px,4vw,48px)` at ≥1100px) | horizontal page padding |
| `--d` | `Inter, "Inter Fallback", sans-serif` | display font |
| `--b` | `"Instrument Sans", system-ui, sans-serif` | body font |
| `--sf` | `"Instrument Serif", Georgia, serif` | serif (declared; **overridden away**, see §15.1) |
| `--p` | 0→1 | scroll progress, set on `<html>` by JS |
| `--x/--y` | px | pointer position on card glow (declared in CSS; never set by JS) |

**Other recurring colours:** `#c9c6bd` (secondary text), `#5d5b55` (disabled/inactive), `#55534b`, `#444` (outline buttons), `#3a3a37`, `#4a4a46`, `#6a6860`, `#2b2b2a`, `#161615`, `#1d1d1c`, `#0f0f0e`, `#0d0d0c`, `#141413`, `#111110`, `#e3e0d8` (matte, overridden to white), `#4b4a44` / `#3b3a36` (text on white), `#f2f0ea` form card (overridden to white), `#030303` canvas bg.

**Radius:** cards/panels/inputs `16px` · small tiles `8px` · pills/buttons `999px` · bars `3–4px`.
**Borders:** 1px `--ln` everywhere; hover raises to `--lm` or `#4a4a46`/`#5d5b55`/`#6a6860`.
**Shadows:** hover lift `0 30px 60px -28px #000`; nav `0 18px 50px -20px #000`; button hover `0 10px 30px -10px #f2f0eacc`; white card `0 40px 80px -40px #000`.

---

## 4. Typography (final, effective)

### 4.1 Families and base
- **Body:** `Instrument Sans` 16px / 1.6, `-webkit-font-smoothing: antialiased`, colour `--tx`.
- **Headings:** `Inter`. **h1, h2, h3, `em.sf` are forced to Inter / weight 700 / `font-style: normal` / no variant features with `!important`** (the “round 2” block). The serif italic accent and `--sf` therefore never render.
- **Instrument Serif** is still requested from Google Fonts but is unused in the final render.
- Buttons use `Instrument Sans` (`button{font-family:var(--b)}`).

### 4.2 The type scale that actually renders (desktop 1440 / mobile 390)
| Role | Desktop (measured) | Mobile (measured) | Notes |
|---|---|---|---|
| **h1 (all pages)** | **72px**, Inter 700, line-height 1 (hero: 72px/72px), tracking -.035em (≈ -2.52px) | **72px** (same) | `!important` fixed value; the older `clamp()` rules are dead. Note: at 390px width, 72px is large and will wrap. |
| h2 (default) | **58px** at 1440 (`clamp(30px,4.1vw,58px)` at ≥1100px, `!important`); `clamp(34px,5.4vw,72px)` below 1100 | **34px** at 390 | inline `font-size` on some h2s is overridden at ≥1100 |
| h2 “A different perspective.” | **68px** (`#persp h2`: `clamp(34px,min(5vw,8.5vh),68px)`) | | id-selector beats the default |
| h2 “Technology should feel simple.” | **86.4px** (`#phil .tm`: `clamp(40px,min(6vw,10.5vh),88px)`), line-height 1 | 34px | transparent gradient-clipped fill |
| h2 “Not seven silos. One system.” | **64px** | | |
| h2 “Have something to build?…” (CTA) | **100px** (line-height 102px, tracking -3.5px) | **40px** | `.cta2 h2` |
| h3 process step name | **112px**, line-height 134px | 56px | |
| h4 “Care, connected.” | 32px, weight **600** (h4 is not forced to 700) | 24px | |
| h2 services page | `clamp(32px,4.6vw,64px)` (`.svp2 h2`) | | |
| h2 CTA | `clamp(40px,7vw,100px)`, margin 18px 0 32px | | |
| h3 default | `clamp(20px,2vw,26px)`, line-height 1.2, tracking -.02em | | cards use -.01em |
| Lead | `clamp(17px,1.6vw,21px)` at ≥1100px, Instrument Sans 500, line-height 1.35 | | |
| Body paragraph | 16px, colour `--mu`, max-width 56ch | | |
| Eyebrow `.ey` | **12px, uppercase, tracking .08em**, `--mu`, with 7×7px pulsing dot before it | | margin-bottom 16px |
| Small labels | 12px uppercase tracking .08em, `#9a968a` | | slide labels, chips, table heads |
| Buttons | Instrument Sans 600, 14px (≥1100px) / 16px (below), padding 12×22 / 14×26, min-height 44px | | |
| Nav links | 14px, `#c9c6bd` | hidden ≤860px | |
| Menu links | Inter 600, `clamp(34px,5vw,62px)`, line-height 1.12, tracking -.035em | | numbered `00`–`06` in 12px |
| Footer wordmark | Inter 600, `clamp(40px,10vw,160px)`, line-height .86, tracking -.05em, white | | |
| Page-transition word | Inter 600, `clamp(40px,9vw,140px)`, tracking -.045em, `#0a0a0a` | | |
| Loader counter | Inter 600, `clamp(70px,16vw,150px)`, tracking -.05em | | “%” at .3em |
| Process step title | `clamp(52px,8vw,112px)` (`56px` ≤560px), tracking -.04em | | |
| Process ghost word | Inter 600 `clamp(90px,19vw,280px)` (`30vw` ≤860px), colour `#f2f0ea14` | | |
| Dashboard KPI numbers | `clamp(30px,3.6vw,46px)` Inter 500, tabular+lining numerals (work page: `clamp(24px,2.6vw,34px)`) | | |
| Numerals | `font-variant-numeric: lining-nums tabular-nums` on KPIs, scroll %, timestamp | | |

**For every element on every page, the exact measured size/weight/line-height/tracking/case/colour is in Appendix A.** That appendix is the one to code from.

### 4.3 Special text treatments
- **Hero h1:** three inline-block words (`Build` / `what’s` / `next.`) in a flex-wrap row, each fades up 10px with staggered delays .4s / .6s / .8s. Word 1 colour `--tx`, word 2 `--tx`, word 3 `--lm` (same cream). The squiggle-underline SVG styling exists (`.sg svg path`) but there is **no SVG in the markup**, so no underline renders.
- **“tm” shimmer heading** (“Technology should feel simple.”): transparent text with a 2-layer gradient clipped to text; vertical gradient position follows `--p` (page scroll); a diagonal white highlight sweeps on a 6s loop.
- **Word-by-word scroll reveal** (`#ph` paragraph): every word in a `<span>` at opacity .16, switching to 1 as the paragraph scrolls into view.
- **Outlined marquee text** (`.bt2`, 46s) and serif-italic marquee (`.mq2`, 34s): CSS exists, **no markup uses them**.
- **Rolling link text** (`.rl`): duplicate line slides up on hover (§6.4).

---

## 5. Layout system

- **Container `.w`:** `max-width:1200px` (1160px at ≥1100px), centred. Several pages widen to 1240px (`.svp>.w`, `.std>.w`, `.pgw>.w`, `.svp2 .w`, `.std2>.w`).
- **Section `.sec`:** padding `clamp(56px,8vw,96px)` vertical, `var(--pad)` horizontal.
- **Breakpoints used:** `max-width:560px`, `max-width:860px` (main mobile switch), `max-width:1099px`, `min-width:861px`, `min-width:1100px`, `max-width:1180px` (chapter nav hides), plus `(hover:hover) and (pointer:fine)` for the custom cursor, and `prefers-reduced-motion`.
- **Full-screen heroes on desktop (≥861px):** Home hero, Services hero, Work, Studio hero and Careers hero are all `100svh` tall (home `min-height:560px`); Contact fits one screen via `vh`-based sizing.
- **Common grids:** `.two` 1fr/1.5fr · `.hg` .85fr/1.15fr · `.pz` 1fr/1.25fr · `.pg` .8fr/1.2fr · `.faq` 1fr/1.5fr · `.cc` .85fr/1.15fr · `.cos` 170px/1fr · `.sv7` 4 columns · `.tl4` 4 cols · `.kg.k3` 3 cols · `.kg.k2` 2 cols · `.cs` 2 cols · `.fcl` 1.4/1/1.2/1 fr.
- **Measured section heights, desktop 1440×900 → mobile 390×844:** Home total 14,049px → 15,008px; Services 2,918 → 4,418; Work 2,359 → 3,207; Studio 3,243 → 3,838; Insights 2,308 → 3,081; Careers 3,401 → 4,416; Contact 1,637 → 2,436. Per-section heights are in §8.
- **Z-index stack:** background 0 · content 1 · chapter nav 15 · menu scrim 18 · menu card 19 · nav 20 · drawer scrim 39 · drawer 40 · hover preview 50 · cursor 99 · loader 100 · page transition 90.
- **Safe areas:** `env(safe-area-inset-top/bottom)` applied on `:root` and nav.

---

## 6. Global shell (present on every page)

### 6.1 Loader
- Full-screen `#0a0a0a`, z 100. Centered block `min(420px,80vw)`.
- Small text: **INITIALIZING DIGITAL SYSTEM...** (14px, Instrument Sans 500, tracking .22em, `--mu`).
- Big counter **000 → 100** + “%” (counts over **1.5s** with rAF) and a 1px cream progress line growing to 100% width.
- Ends → `body.rd` is added (this un-pauses all animations; before it, every animation is paused except inside the loader), loader fades out .6s, is removed after 800ms. Failsafe `setTimeout 3200ms`; CSS failsafe animation at 4s. Any JS error adds `html.fail` and `body.rd`.

### 6.2 Background canvas (`.bgz` fixed, z 0, `#030303`)
- **2D canvas “dark galaxy, drifting glass shards”**: 130 stars (0.4–1.5px squares, twinkle) + **80 shards** (42 when width < 700): 3–4-point polygons with depth `z` .25–1, light-grey fill (`rgba(215,215,215,…)`, hue variant `205,205,205` when `h>.8`) with white 0.8px strokes, flipping in 3D via `scaleX(cos)` (min .12), slow rotation and drift; scroll velocity nudges them; mouse parallax (60×z px horizontally, 40×z px vertically, eased .04).
- Two pulsing white radial glows (left edge at 52% height, radius .7×H, α .07; right edge, radius .5×H, α .04).
- DPR capped at 1.5. Resize rebuilds. Under reduced motion it draws one static frame.
- **Vignette:** `radial-gradient(ellipse at 50% 40%, transparent 35%, #000000cc 100%)`.
- **Film grain:** SVG `feTurbulence` (baseFrequency .85, 2 octaves) 160×160 tile at **opacity .07**.
- Entrance animation `bz` 1s (fade + scale 1.2→1).

### 6.3 Navigation — floating pill (`nav` fixed, top `14px + safe-area`, centred)
**Markup order:** logo · links · scroll % · Menu button · scroll-progress line.

| Part | Spec |
|---|---|
| Container `.pn` | pill, bg `#121212f5`, border `1px #ffffff1f`, padding 7/7/7/20 (6/6/6/18 at ≥1100), shadow, `overflow:hidden`. (Blur was removed in the audit pass.) |
| Logo | text **“DecaCorpus”**, Inter 600 18px (16px ≥1100), → `#/` |
| Links | **Work → `#/work` · Services → `#/services` · Studio → `#/studio` · Insights → `#/insights` · Careers → `#/careers` · Contact → `#/contact`** — 14px `#c9c6bd`, padding 9×14 (8×12 ≥1100), pill hover/current bg `#ffffff14` + white text; current page gets `aria-current="page"` |
| Scroll % | `#pc`, 12px tabular, text “0%”…“100%”; hidden ≤560px |
| Menu button | `#mb`, cream bg, black text, 600 14px (12px ≥1100), min-width 78px; hover scale 1.06; label toggles **Menu / Close**; `aria-expanded`, `aria-controls="mcard"` |
| Progress line | `#sp` 2px cream line along the pill bottom, `scaleX(--p)` |
| Entrance | `nv` .9s `cubic-bezier(.22,1.2,.36,1)` after .3s: drops from -100px |
| **Collapsed state** | when `scrollY > 140` the pill gets `.sm`: links collapse to `max-width:0`; they expand again on pill **hover or focus-within** (0.7s spring) |
| Mobile (≤860px) | links hidden, only logo + Menu (pill left padding 16px) |

*(There is also CSS for a mobile dropdown `.lk`/`.mn` and a nav status `.stt`, and a round “nr” arrow button; none exist in the markup.)*

### 6.4 Rolling link effect
`rollAll()` wraps the contents of nav links, footer links (except logo), menu links and in-page `.ml` links in a 1.3em-high clipped box containing the text twice; on hover/focus-visible the stack translates -100% over **.55s `cubic-bezier(.7,0,.2,1)`**.

### 6.5 Full-screen menu (`#mcard`, dialog, aria-modal)
- Opens from the Menu button. Dark blurred scrim `#000a` + blur 10px (z 18); card (z 19) at top `82px`, width `min(980px, 100% - 2×pad)`, max-height `100svh - 108px`, bg `#121212`, border `#ffffff22`, radius 16, padding `clamp(20px,3vw,38px)`. Enters with opacity + translateY -24→0 + scale .96→1 over .65s `cubic-bezier(.34,1.3,.5,1)`.
- Left column — big links, each prefixed by a small index:
  `00 Home` · `01 Work¹` · `02 Services⁷` · `03 Studio` · `04 Insights²` · `05 Careers` · `06 Contact` (the superscripts are literal `<sup>` values 1, 7, 2).
- Right column (desktop only; hidden ≤860px) — preview tile `#mpv` (min-height 260, bg `#0d0d0c`) showing a scaled-down rotating-rings SVG and a cream pill **“▶ Studio film preview”**. Clicking it closes the menu, goes Home if elsewhere, and after **1700ms** scrolls to the film section.
- Footer row: **“Build what’s next.”** left · **“Start a Project ↗”** (`#/contact`) right.
- Closes on: Menu/Close button, scrim, Esc, any menu link, CTA, and on every route change. Lenis is stopped while open.

### 6.6 Page transition (`#vt`)
White full-screen slab (`#fff`) shows the destination name (`Home, Services, Work, Studio, Insights, Careers, Contact`) in near-black type. Sequence: slide up over the page (.58s `cubic-bezier(.7,0,.2,1)`), route swap at 580ms, slide off the top (.65s), reset at 700ms more. **First load skips it.** Hidden entirely under `prefers-reduced-motion`.

### 6.7 Scroll behaviour
- **Lenis** smooth scroll (`duration 1.15`, easing `min(1, 1.001 - 2^(-10t))`), disabled under reduced motion; stopped while the menu or drawer is open; `data-lenis-prevent` on menu and drawer.
- Route change scrolls to top immediately.
- `scroll-padding-top:76px`, `scroll-behavior:smooth` on `<html>` (Lenis sets `auto`).
- In-page `#anchor` links (non `#/`) scroll with `offset:-70` via Lenis.

### 6.8 Scroll-reveal system
Every element matching a long selector list (`.ey, h1, h2, .lead, .cd, .fc, .kc, .tile, .cos, .chips, .pp, .hl>*, …`) gets class `rv`, then fades up when it enters the viewport (IntersectionObserver, threshold .1, bottom margin -5%). Animation `rv` .9s `cubic-bezier(.2,.7,.1,1)`, from `translateY(34px)`. **Stagger:** `--dl = min(index among siblings, 5) × .09s`. Services cards use their own `--dl = i × .06s` (CTA card .42s). Safety net: after 1.8s anything on-screen is forced visible; `html.fail` shows everything. Reveal also triggers the KPI count-up.

### 6.9 Custom cursor (fine pointers only)
Cream teardrop 20×20 (`border-radius:50% 50% 50% 0`, rotated -45°, 1.5px black ring), follows the mouse with 0.3 easing; native cursor hidden. Elements carry `data-cur` hints (*Drag, Open, Go, Start, Toggle, Jump, Preview, Play/Pause, Live view, Type, Pick*), but the final CSS **hides the label and keeps the “big” state the same size**, so no label bubble or growth appears.

### 6.10 Chapter dots (home only)
Fixed on the right edge (18px), vertically centred, z 15; 8 dots built from the numbered eyebrows. Appears after `scrollY > 420`; hidden ≤1180px. Labels (shown on hover/active, 12px uppercase): **The bigger picture · What we build · Selected concept · Our philosophy · How we get there · Built on strong foundations · Ideas in progress · Studio film**. Active dot enlarges ×1.6 and turns cream. Click scrolls to the section (offset -10).

### 6.11 “Next page” scroll bar (`#nxp`)
Link below the footer. Its text (“Keep scrolling” / “Next: …”) is set in JS but **hidden by `display:none`**, leaving an empty 175px-tall bordered block with a 4px cream progress line along the bottom. Behaviour: when at the bottom, accumulating wheel-down delta (up to 900) fills the bar; reaching 900 navigates to the next page in the order **Home → Services → Work → Studio → Insights → Careers → Contact → Home**. Any scroll-up or non-bottom wheel drains it by 90 per event.

### 6.12 Footer
**Order on every page:** Wordmark → Footer → Next bar.
- **Wordmark `#wm`:** “DECACORPUS”, centred, solid `#fff`, vertical fade mask (`#000 38% → transparent 96%`), non-interactive. (A moving neon/shine gradient and scroll-linked CSS vars exist but the final CSS sets `background-image:none`, so only solid white shows.)
- **4-column grid** (`1.4fr 1fr 1.2fr 1fr`, gap 32; 2 cols ≤860, 1 col ≤560):
  1. Logo “DecaCorpus” + **“DECACORPUS – Digital technology studio.”**
  2. **Studio:** Work · Services · Studio · Insights · Careers · Contact
  3. **Services:** Web Development · Software Development · SaaS Systems · CRM Systems · AI & Automation · Mobile Experiences · Digital Products — *each links to `#/services` but carries `data-s=0…6`, so a click opens the service drawer instead of navigating.*
  4. **Reach us:** hello@decacorpus.com (mailto) · careers@decacorpus.com (mailto) · LinkedIn (`#`) · X / Twitter (`#`)
- **Bottom row:** “© 2026 DECACORPUS” left · “Privacy” (`#`) “Terms” (`#`) right; 12px uppercase tracking .08em.
- Labels (“Studio”, “Services”, “Reach us”): 12px uppercase `#9a968a`. Links 14px `#c9c6bd`, hover cream.

### 6.13 Service drawer (`#dr`, right side panel)
Opened by any element with `data-s` (service cards, “Read the overview”, footer service links). **Panel:** fixed right, `min(580px,100%)`, bg `#0f0f0e`, left border, padding `92px clamp(22px,3vw,40px) 48px`, scrolls internally; slides in over .65s `cubic-bezier(.22,1.1,.36,1)`; scrim `#000b`. **Close** button top-right (22px) “Close”; also Esc and scrim click. On open: focus moves to Close, Lenis stops, focus returns to the trigger on close, and the Home “Made around you” selection is synced.

**Content template (in order):** small “Service 0N” → h2 service name (`clamp(34px,4.4vw,52px)`) → subtitle (white 18px) → h4 “Overview” + paragraph → h4 list-1 heading + bullet list → h4 list-2 heading + bullet list → pull-quote (Inter 500 20px, white) → h4 “Key features” + tags → h4 “Technologies” + tags → **“Start a Project”** button (`#/contact`, closes drawer). List items whose text has a `Label: text` pattern (colon within the first 30 characters) render the label in bold white. h4s are 600 20px cream. All text per service is in §9.1.

### 6.14 Focus & accessibility baseline
`:focus-visible` 2px solid **white** (`!important`), offset 3px; buttons/links min-height 44px; ARIA used on slideshow (`role=region`, `aria-roledescription=carousel`, `aria-label=Featured`, each slide `aria-label="N of 5"`), menu and drawer (`role=dialog aria-modal`), accordion (`aria-expanded`), chips/filters (`aria-pressed`), live region on personalisation panel (`aria-live=polite`). `prefers-reduced-motion` stops all animation/transition and disables smooth scroll, the page slab and the canvas loop.

---

## 7. Routing & navigation map

| Route | Hash | Title | Nav link | Menu index | Footer “Studio” col |
|---|---|---|---|---|---|
| Home | `#/` (or empty / unknown) | DecaCorpus \| Build What’s Next. | logo | 00 | — |
| Work | `#/work` | Healthcare CRM concept \| DecaCorpus | ✔ | 01 | ✔ |
| Services | `#/services` | Services \| DecaCorpus | ✔ | 02 | ✔ |
| Studio | `#/studio` | The Studio \| DecaCorpus | ✔ | 03 | ✔ |
| Insights | `#/insights` | Insights \| DecaCorpus | ✔ | 04 | ✔ |
| Careers | `#/careers` | Careers \| DecaCorpus | ✔ | 05 | ✔ |
| Contact | `#/contact` | Contact \| DecaCorpus | ✔ | 06 | ✔ |

**Order used for “next page” scroll:** home → services → work → studio → insights → careers → contact (note: differs from the nav order, where Work comes before Services).
**Unknown hash →** falls back to Home.
**All CTAs:** “Start a Project” → `#/contact` (hero, round arrow button, menu, drawer, CTA band, home personalisation panel). “See the concept” → `#/work`. “Explore services” → `#/services`. “Explore Insights” → `#/insights`. “Meet the studio” → `#/studio`. “Join the team” → `#/careers`.
**CTA band appears on:** Home, Services, Work, Studio. **Not on:** Insights, Careers, Contact.

---

## 8. Pages — structure, copy, layout, effects

> Colour tokens, type scale and shell (loader, nav, menu, footer, wordmark, next bar) apply to every page and are not repeated.

### 8.1 HOME — `#/`  (13 blocks)

Desktop section heights (1440px): hero 900 · bigger-picture 512 · made-around-you 753 · what-we-build 893 · selected concept 963 · philosophy 707 · process 5,040 (560vh) · tech 700 · perspective 703 · studio film 864 · FAQ 556 · CTA 530 · wordmark 188 · footer 525 · next-bar 175.

**1 · Hero** (`100svh`, `min-height:560px` on desktop; padding-top `clamp(84px,11vh,120px)`)
- Floating chips (decorative, desktop only, hidden ≤860px): **Web** (right 11%, top 36%), **AI** (right 34%, top 24%), **SaaS** (right 3%, top 50%). Pill style 14px, bg `#161615`; drop in from ±100px (1.2s spring after .8s) then bob forever (6s); hover → cream fill, scale 1.25.
- Eyebrow: **Deca Corpus / Digital technology studio** (uppercase).
- **H1:** “Build what’s next.” (words: *Build* / *what’s* / *next.*).
- Sticker (rotated -7°, cream pill, 600, `clamp(13px,1.3vw,17px)`, floating): **Systems, not silos.** (aria-hidden)
- Round cream arrow button **↗** (`clamp(56px,6vw,84px)` circle) → `#/contact`, `aria-label="Start a project"`; rotates 45° and scales 1.1 on hover. Hidden ≤860px.
- Left text column (`.hl`): bold line **“We don’t just build websites. We build the systems behind businesses.”** (Inter 600, `clamp(19px,1.9vw,25px)`, max 22ch) · sub-line **“We engineer digital products, software systems, SaaS platforms and business technology built for the real world.”** (16px, muted, max 38ch) · buttons **Start a Project** (solid cream) and **See the concept** (outline).
- Right: **slideshow** (see below). Grid `.85fr 1.15fr`.
- Scroll effects: h1 moves up at 0.08×scroll, content row at 0.06×, the whole hero container fades out over 95% of its height, the slideshow shrinks to scale ≥ .92.
- Entry choreography (after loader): eyebrow fade .5s, h1 words .4/.6/.8s, text .9–1.2s, buttons 1.1–1.2s, slideshow 1.3s.

**Hero slideshow** (`#sl`, 5 slides; base aspect-ratio 16/11; on desktop ≥861px it fills its grid cell at 100% height, min-height 300px; ≤860px fixed height 440px / 400px at ≤560px)
- Frame: bg `#121212`, 1px border, radius 16, overflow hidden, `touch-action:pan-y`.
- Every slide shows: top-left label (12px uppercase), top-right **DC / 0N**, centre visual, bottom-left caption (16px, `#c9c6bd`, max 60%).
- Visual frames: image slides use `.slimg` — absolute, `left/right 24px`, `top 70px`, height `100% - 140px`, `object-fit:cover`, radius 12, 1px border.

| # | Top-left label | Top-right | Caption | Visual |
|---|---|---|---|---|
| 1 | Systems, not silos. | DC / 01 | Designed to connect. | Image `slide-1-systems.jpg`, position 50% 50% — alt “Team working across connected desks” |
| 2 | Healthcare CRM | DC / 02 | Custom CRM, Automation and Analytics. | Live miniature of the CRM dashboard (900px wide, auto-scaled to fit, counters static “128 / 24 / 08”) |
| 3 | Web Development | DC / 03 | Modern websites engineered for performance, conversion and scale. | Image `slide-3-web.jpg`, 50% 50% — alt “Web design and development concept” |
| 4 | SaaS Systems | DC / 04 | From MVP to scalable SaaS infrastructure. | Image `slide-4-saas.jpg`, 50% 55% — alt “SaaS cloud platform concept” |
| 5 | AI & Automation | DC / 05 | Intelligent workflows that reduce repetitive work. | Image `slide-5-ai.jpg`, 50% 40% — alt “AI assistant helping a person at a laptop” |

- Controls: progress segments along the **top** (12px from top; 3px bars, cream fill); **← →** round buttons bottom-right (36px, aria “Previous slide” / “Next slide”).
- **Autoplay 6s** per slide, segment fills over the 6s; pauses on hover/focus; off under reduced motion or before loader ends. Crossfade .7s; contents rise in (.9s).
- Input: arrows, segment click, **swipe >50px**, or **click the left third / right third** of the frame.

**2 · “01 / The bigger picture”** — white matte panel (`.mp.two`, radius 16, padding `clamp(28px,4.5vw,64px)`, 7% grain overlay, text `#0a0a0a`/`#3b3a36`). Grid 1fr / 1.5fr, centred.
- Left: eyebrow **01 / The bigger picture** · **Less fragmentation. More possibility.**
- Right: H2 **We build the *systems* behind businesses.** · **A beautiful interface is only the beginning. We connect the product, the processes and the technology into one considered whole.**

**3 · “Made around you”** (personalisation; `padding-top:0`, soft radial glows behind)
- Eyebrow **Made around you** · H2 **What are you building?** · **Pick what you’re building — we’ll show how we’d shape it around you.**
- Left: 7 chips in a 2-column grid (last chip spans both), each = icon tile + label + index. Order and labels: **Website 01 · Software 02 · SaaS product 03 · CRM 04 · AI or automation 05 · Mobile app 06 · Digital product 07**. Selected chip turns white with black text/icon tile. Hover: icon tile tilts -8° and scales 1.08.
- Right: white card (`.pp`, radius 16, padding `clamp(18px,2.2vw,28px)`, `aria-live`): black icon badge (46px) + service name (h3, `clamp(22px,2.2vw,30px)`) + “0N / 07”; subtitle; 4 checklist rows (tick icon + key feature); technology tags; buttons **Read the overview** (opens drawer) and **Start a {chip label in lowercase} project** → `#/contact`.
- Remembers the choice in `localStorage` key `dc_pick` (default = service 01) and also uses it to pre-fill the contact form’s “What do you want to build?” field.
- Panel content swaps with a .6s rise animation.

**4 · “02 / What we build”** (`#what`)
- Eyebrow **02 / What we build** · H2 **Connected thinking. Complete delivery.** · **From the first interface to the infrastructure beneath it.**
- **8-tile grid** (4 columns desktop, 2 columns <1100px, 1 column ≤560px). 7 service tiles (button) + 1 CTA tile. Tile: gradient `#151514→#0e0e0d`, border `--ln`, radius 16, min-height 176px, padding 18×22.
  - Contents: top row = 30px line icon (unique per service) + number 01–07 (12px); name (h3 `clamp(19px,1.7vw,24px)`, Instrument Sans 600); one-line subtitle (14px muted, `min-height:4.35em`, right padding 46px); bottom-right circular **↗** (36px).
  - Hover: lifts 6px, border `#6a6860`, spotlight gradient fades in, icon lifts 3px, arrow circle fills cream and rotates 45°. Click → drawer.
  - Tile texts are the service name + short line in §9.1.
  - **8th tile (cream):** number **08** · **Not sure where to start?** · **Tell us what you’re building.** → `#/contact`; hover turns white.
- Below: outline button **Explore services** → `#/services`.

**5 · “03 / Selected concept”** — eyebrow **03 / Selected concept** (left) · H2 **Healthcare CRM** (right, 2-col grid, aligned to bottom) · **dashboard** (§8.3.1) · caption **CONCEPT PREVIEW • ALL INTERFACE DATA IS ILLUSTRATIVE** (uppercase).

**6 · “04 / Our philosophy”** (`#phil`, fits one screen on desktop: 2 columns 1.3fr/1fr)
- Eyebrow **04 / Our philosophy** · H2 (shimmer) **Technology should feel *simple.*** · scroll-reveal line **Behind every interface is a system. Behind every system is a business. We design both.** · **DecaCorpus is a digital technology studio focused on engineering complex systems with premium design execution.** · outline button **Meet the studio**.
- Right: framed 3-row list (radius 16, hairline separators; hover adds left padding): **01 Business — Goals, logic and growth** · **02 System — Architecture, data and scale** · **03 Interface — Experience and design**.
- Mobile: columns stack, list goes under the text.

**7 · “05 / How we get there” — Process** (`#process`) — **scroll-pinned, 560vh tall on desktop (400vh ≤860px)**, bg `#0a0a0a8c`, borders top/bottom `--ln`; inner stage `position:sticky; top:0; height:100svh; padding-top:120px`.
- Left: eyebrow **05 / How we get there** · H2 **A clear path through complexity.** (`clamp(30px,4vw,56px)`) · vertical stepper of 6 buttons (Inter 600 `clamp(18px,2vw,24px)`; dots on a 1px rail; passed steps `#a9a69c`; current step cream and nudged 8px; rail fill height = step × 20%).
- Right: large step stage — small “Step N of 6”, huge step name, one-line description; crossfade/translate .5–.7s.
- Top-centre **dropdown pill** (at 84px): shows “01 Idea ▾”, opens a 240px list of the 6 steps (spring .45s); closes on outside click or selection.
- **Ghost word** (current step name) huge, bottom-left, `#f2f0ea14`.
- Behaviour: current step = scroll position through the section ÷ 6; clicking a step or dropdown item scrolls to the middle of that step’s slice.
- Steps copy → §9.2. Mobile: stepper becomes a horizontal row of 6 equal buttons (16px, 12px ≤560), rail hidden.

**8 · “06 / Built on strong foundations”** (`#tech`)
- Eyebrow **06 / Built on strong foundations** · H2 **The right tools. Not just the *latest.*** · **We choose technology around the product, the people using it and the system it needs to become.** (2 cols 1.3fr/1fr, aligned bottom)
- 4 columns, each a label (12px uppercase) over a **vertically scrolling pill marquee** (230px window, top/bottom fade mask; list repeated ×4, 16s linear; even columns run in reverse; pauses on hover; pill hover fills cream & nudges 6px):
  - **Frontend:** React · Next.js · Three.js · GSAP
  - **Backend:** Node.js · Python · FastAPI · Prisma
  - **Infrastructure:** PostgreSQL · MongoDB · AWS · Docker
  - **Design:** Figma · Blender · Cinema 4D
- Mobile (≤860px): single column; each row becomes a **horizontal** marquee (24s), edge-faded; the container never exceeds screen width.

**9 · “07 / Ideas in progress”** (`#persp`; padding-top `clamp(24px,4vh,56px)` on desktop)
- Eyebrow **07 / Ideas in progress** · H2 **A different *perspective.*** · outline button **Explore Insights** (right-aligned).
- 2 **white article cards** (`.cs`, 2 columns): thumbnail (radius 16, `min-height clamp(210px,min(19vw,30vh),260px)`) with the article image (`object-fit:cover`, zoom 1.04× on hover, top gradient scrim `#000000c4→transparent`) · top-left small label · top-right **↗** · meta line · h3 title · excerpt. Hover lifts 4px. Cards are keyboard-focusable but **have no click action**. Content → §9.3.
- Image positions: card 1 `50% 42%`, card 2 `50% 24%`.

**10 · “08 / Studio film”** (`padding-top:0`)
- Eyebrow **08 / Studio film** · H2 **Studio film preview** · **A closer look at how we think, design and build.**
- Frame `.fc` (radius 16, padding `clamp(14px,2vw,22px)`) containing a 16/7 “film” made of CSS: soft light cone sweeping, a figure silhouette, a scanline, a **76px round ▶ play button**, 2px progress line, timestamp **0:00 / 0:24** (bottom-left).
- Text row: **Video preview — footage pending.** · outline button **Watch preview**.
- Play (either button) toggles **play/pause** (▶ / ❚❚, `aria-label` “Play studio film preview” / “Pause film preview”): runs light sweep (9s), scanline (5s), progress bar 24s linear; timestamp ticks every second 0:00→0:24 and loops. There is **no real video**.

**11 · FAQ** (matte white panel `.mp.faq`, grid 1fr / 1.5fr)
- Eyebrow **FAQ** · H2 **Questions, answered.**
- Accordion (any number can be open; “+” rotates 45°; answer height animates .4s spring; button gets 10px left shift on hover):

| Question | Answer |
|---|---|
| What does DecaCorpus build? | Websites, custom software, SaaS platforms, CRMs, AI automation, mobile apps and full digital products. |
| How does a project run? | In six steps: Idea, Structure, Design, Build, Launch and Evolve. |
| Why a custom CRM? | It matches your pipeline without bloat, you own your data with no vendor lock-in, and there are no per-user licence fees as teams grow. |
| Are you hiring? | This is an open invitation to connect, not a list of open roles. Write to careers@decacorpus.com. |

**12 · CTA band** (white `.cta2.lm`, black text) — eyebrow **Let’s build what’s next** · H2 **Have something to build? ⏎ Let’s make it *real.*** · cream-on-black button **Start a Project** + underlined mail link **hello@decacorpus.com**. Same band is reused on Services, Work and Studio.

### 8.2 SERVICES — `#/services`
1. **Hero (100svh on desktop)** — eyebrow **Services / 01–07** · H1 **Systems for what’s *next.*** · the same **8-tile grid** as Home (7 services + the cream “Not sure where to start?” tile); on desktop the grid fills the rest of the screen in two equal rows; ≤1099px it becomes 2 columns with `min-height:auto`; ≤560px 1 column (tile `min-height:150px`).
2. **“One connected engagement”** (bg `#0a0a0acc`) — eyebrow **One connected engagement** · H2 **Not seven silos. One system.** (`.svp2-h` max 640px) · 4-step row (hairline top border turns cream on hover; 4 cols, 2 cols <1100px, 1 col ≤560px):

| # | Step | Text |
|---|---|---|
| 01 | Discover | Define the problem and the goal. |
| 02 | Shape | Map the scope and architecture. |
| 03 | Deliver | Build, integrate and test. |
| 04 | Improve | Learn from use and refine. |

3. CTA band.

### 8.3 WORK — `#/work`
Title tag: “Healthcare CRM concept”. Desktop = one-screen, 2-column (`.8fr 1.3fr`, max-width 1240px).
- Left: eyebrow **Work / Concept preview** · H1 **Healthcare *CRM*** · lead **A connected system for the care journey, bringing patient relationships, workflows and analytics together.** (max 30ch) · tags **Custom CRM · Automation · Analytics** · note **ILLUSTRATIVE CONCEPT • NOT A DELIVERED CASE STUDY** (12px uppercase).
- Right: the **dashboard** (compact variant: aside 128px, smaller padding, bar chart 76px).
- Then CTA band.
- (An auto-highlighting “workflow” list `#wf` is scripted — 1.6s cycle across 3 rows — but **no `#wf` element exists**, so nothing runs.)

#### 8.3.1 The CRM dashboard component (`.cos`) — used on Home §5, Work, and Home slide 2
- Container: bg `#141413`, border `--ln`, radius 16, padding `clamp(14px,2vw,26px)`, shadow `0 40px 80px -50px #000`; grid `170px | 1fr` (≤860px: stacked, aside becomes a scrolling row).
- **Sidebar:** bold **Care / OS** (Inter 600 18px) · buttons **Overview** (active, cream) · **Patients** · **Appointments** · **Workflows** · **Analytics** · small **CONCEPT WORKSPACE**.
- **Header:** h4 **Care, connected.** (`clamp(24px,2.6vw,32px)`) · **CONCEPT PREVIEW / SAMPLE DATA** · chip **Demo workspace**.
- **3 KPI tiles** (bg `#1d1d1c`, radius 8, hover rises 3px + cream border): **128** Active records · **24** Appointments · **08** Follow-ups (count up from 0 over 1.1s with ease-out cubic when revealed; single-digit values are zero-padded).
- **Care activity** card: title + **Sample week**; 7 bars **M T W T F S S** with heights **38 / 58 / 44 / 74 / 100 / 62 / 42 %** (Friday highlighted by default; each bar has tooltip “Sample day”; bars grow in with a 1s animation; hover brightens).
- **Next in the workflow** card: **Appointment reminder — Ready** · **Post-visit check-in — Ready** · **Record review — Review** · note **Illustrative workflow states**.
- **Patient workflow** table: header **Record / Next action / Status** · **Sample 01 / Intake review / Review** · **Sample 02 / Visit reminder / Queued** · **Sample 03 / Care follow-up / Scheduled** (row hover: background + 16px left shift).
- **Interactions:** sidebar buttons switch the active item and move the highlighted bar (Overview→Tue, Patients→Thu, Appointments→Sat, Workflows→Mon, Analytics→Wed; bar heights never change); the whole card **tilts in 3D** with the mouse (±2.5° Y, ±2° X, perspective 900) and **scales .88→1 as it scrolls into view**.

### 8.4 STUDIO — `#/studio`
1. **Hero (100svh desktop, 2 columns `1.05fr / .95fr`)**
   - Eyebrow **People / Perspective / Practice** · H1 **The *Studio*** · lead **We are a team of engineers, designers, and strategists obsessed with pushing the boundaries of what’s possible.** (max 30ch) · **white** button **Join the team** → `#/careers`.
   - Right: square tile (radius 16, gradient `#1c1c1a→#111110`, border) with `studio-culture-tile.jpg` rendered **inverted + screen-blend, 94% size, opacity .94** (white line-art on dark), `role="img"`, aria-label “The DecaCorpus team at work.”, empty alt, caption **CULTURE** (12px uppercase bottom-left).
2. **Philosophy** (padding-top 0) — white panel (radius 16, padding `clamp(24px,4vw,56px)`), 2 columns: eyebrow **Our philosophy** + lead **At DecaCorpus, we don’t just write code or design interfaces. We engineer holistic systems that scale.** (`clamp(24px,3.2vw,44px)`, max 22ch) | **True digital transformation needs a deep understanding of business logic, user psychology, and cutting-edge technology.**
3. **How we work** — eyebrow + 3 cards (3 cols), each: 48px rounded icon tile (turns cream and tilts -6° on hover), h3, text; card hover lifts 3px.
   - cube icon — **Iterative** — We ship early, learn fast, and refine.
   - eye icon — **Radically transparent** — You see the architecture, trade-offs, and progress.
   - code icon — **Uncompromising on quality** — Design and engineering get equal care.
4. CTA band.

### 8.5 INSIGHTS — `#/insights`
- Eyebrow **Ideas / Systems / New perspectives** · H1 **Thinking out *loud.*** · lead (right-aligned on desktop) **Notes on the changing relationship between business, design and technology. A preview of the conversations we want to open.**
- **Filter bar** (top/bottom hairlines): pill buttons **All perspectives** (pressed by default) · **AI** · **Design** + counter **02 EDITORIAL PREVIEWS / NO ARTICLES PUBLISHED YET** (becomes “01 Editorial preview / …” when a filter leaves one card). Filtering hides non-matching cards instantly (`display:none`).
- **2 article cards** (same white cards as Home §9; content §9.3).
- **Poll** (`.poll`, radius 16, bg `#121212`): eyebrow **Small poll** · h3 **Which idea should we write up first?** · two answer buttons (the two article titles) · hint **Your vote stays in this browser. It is a demo, not a survey.** → after voting: choice highlighted cream, both disabled, hint **Noted. We’ll weigh it when we start writing.** Saved in `localStorage` key `dc_poll`.
- No CTA band.

### 8.6 CAREERS — `#/careers`
1. **Hero (100svh, vertically centred)** — eyebrow **Careers** · H1 **Good minds. *Shared ambition.*** · lead **We’re engineers, designers and strategists building the systems behind ambitious businesses. If that sounds like you, we’d like to know you.** · buttons **Write to us** (`mailto:careers@decacorpus.com`) and outline **Introduce yourself** (`mailto:careers@decacorpus.com?subject=Introduction`). Lead and buttons sit on one row (space-between) on desktop.
2. **“01 / Why DecaCorpus”** — H2 **What it’s like to work here.** — 3 cards:
   - **01** Real systems, not just screens — You’ll work on software, SaaS, CRM, AI and mobile products, from first idea to launch.
   - **02** Design and engineering side by side — No handoff walls, and both get equal care.
   - **03** Open by default — Architecture, trade-offs and decisions are visible to everyone on the team.
3. **“02 / Areas we hire in”** — H2 **Where you could fit** — note **Demo roles, shown as placeholders until real openings exist.** — 4 role cards (2 cols; icon · title on one row, description + **Apply** button on the next):
   - Engineering — Front-end, back-end, full-stack, mobile. → `mailto:careers@decacorpus.com?subject=Interest%20in%20Engineering`
   - Design — UI/UX, product design, motion. → `…?subject=Interest%20in%20Design`
   - Strategy and delivery — Product strategy, project leadership. → `…?subject=Interest%20in%20Strategy%20and%20delivery`
   - AI and automation — Workflow and LLM integration. → `…?subject=Interest%20in%20AI%20and%20automation`
4. **White closing panel** — H2 **Don’t see your role? *Write to us anyway.*** · **This is an open invitation to connect, not a list of confirmed open roles.** · black pill button **careers@decacorpus.com ↗** (mailto).
- No CTA band.

### 8.7 CONTACT — `#/contact`
Desktop: whole page fits one screen (`100vh`-based sizing).
- Eyebrow **01 / Contact** · H1 **Let’s make it *real.***
- Left column: h3 **A good system starts with a good conversation.** · divider area with eyebrow **Prefer email?** and link **hello@decacorpus.com** (Inter 500, `clamp(22px,min(2.2vw,4vh),32px)`; underline removed in final CSS).
- Right: **white form card** (`.fp`, radius 16, padding `clamp(22px,2.8vw,40px)`, min-height `clamp(340px,46vh,440px)`): counter **01 / 06** (12px uppercase) · 6 progress segments (3px, black fill up to the current step) · question h3 (`clamp(24px,min(2.5vw,4.4vh),36px)`) · single borderline input (1.5px bottom border, 3px on focus; placeholder `#8a877f`; font Instrument Sans 500 `clamp(19px,1.7vw,24px)`) · row: **← Previous** (disabled on first) and black **Next** pill (becomes **Send** on step 6).
- One question at a time; **Enter** also advances; answers kept in memory when going back; input is `type=email` on step 2 but no validation (`novalidate`); step 4 is pre-filled with the service chosen on Home.
- Final state replaces the card with **Thanks, {name}. We’ll be in touch.** (inline 34px) and **This prototype doesn’t send messages yet.** If no name was typed: “Thanks. We’ll be in touch.”

| Step | Question (h3) | Label (visually hidden) | Placeholder | Hint (see note) | Input type |
|---|---|---|---|---|---|
| 01 / 06 | What is your name? | Your name | Enter your name | What should we call you? | `text` |
| 02 / 06 | Where can we reach you? | Email | you@company.com | We’ll only use this to reply. | `email` |
| 03 / 06 | Which company are you with? | Company | Company name | Optional if it’s a personal project. | `text` |
| 04 / 06 | What do you want to build? | Project | A product, a platform, a rebuild | A sentence is enough. | `text` |
| 05 / 06 | When would you like to start? | Timeline | e.g. next month | A rough idea helps. | `text` |
| 06 / 06 | Anything else we should know? | Notes | Optional | Share links or context if you like. | `text` |

*(The “Hint” column is in the data but the current form markup does not render hints.)*
- No CTA band.

---

## 9. Verbatim data tables (generated directly from the source arrays)

### 9.1 The 7 services (`SV`) — used by home tiles, services tiles, chips, slides, drawer, personalisation panel

#### Service 01 — Web Development

| Field | Content (verbatim) |
|---|---|
| Name (`SV[0][0]`) | Web Development |
| Short line (card subtitle / slide caption) (`[1]`) | Modern websites engineered for performance, conversion and scale. |
| Chip label on “Made around you” (`[2]`) | Website |
| Overview paragraph (`[3]`) | Web development as an end-to-end process of designing, building and maintaining sites and web apps, with a focus on business goals, high-performance architecture and good user experience. |
| List 1 heading (`[4][0]`) | Core areas |
| • | Front-end: HTML, CSS, JavaScript, React, Next.js, Tailwind. |
| • | Back-end: servers, databases and APIs with Node.js, Python, PostgreSQL, MongoDB. |
| • | Full-stack: CI/CD, automated testing, observability. |
| List 2 heading (`[5][0]`) | Trends |
| • | Headless architecture |
| • | UI/UX tied to conversion and accessibility |
| • | Core Web Vitals, SEO and mobile-first work |
| • | Progressive Web Apps |
| Pull-quote (`[6]`) | The digital front door for brand trust, engagement and ROI. |
| Key features (`[7]`) | High Performance · SEO Optimized · Responsive Design · Dynamic Content |
| Technologies (`[8]`) | Next.js · React · TypeScript · Tailwind CSS · Prisma |
| Unused “extra” copy (`EX[0]`, defined but not rendered anywhere) | Content architecture, responsive interfaces and production-ready builds. / *Web platforms / CMS / Commerce* |

#### Service 02 — Software Development

| Field | Content (verbatim) |
|---|---|
| Name (`SV[1][0]`) | Software Development |
| Short line (card subtitle / slide caption) (`[1]`) | Custom software systems designed around your unique business processes. |
| Chip label on “Made around you” (`[2]`) | Software |
| Overview paragraph (`[3]`) | Scalable, secure, maintainable systems that solve complex business problems, fitted to existing operations. |
| List 1 heading (`[4][0]`) | Core areas |
| • | Enterprise architecture: backends that handle high transaction volumes. |
| • | System integration: connecting legacy software and third-party APIs. |
| • | Custom workflows: logic built around your business rules. |
| List 2 heading (`[5][0]`) | Principles |
| • | Scalability first: clean, modular code |
| • | Security by design: encryption, access control at every layer |
| • | Agile delivery in iterative cycles |
| Pull-quote (`[6]`) | From internal management tools to operational systems, a foundation to scale on. |
| Key features (`[7]`) | Custom Architecture · API Integration · Enterprise Security · Modular Codebase |
| Technologies (`[8]`) | Node.js · Python · PostgreSQL · Redis · Docker · AWS |
| Unused “extra” copy (`EX[1]`, defined but not rendered anywhere) | Map operational logic, connect your tools and ship maintainable applications. / *Internal tools / APIs / Integrations* |

#### Service 03 — SaaS Systems

| Field | Content (verbatim) |
|---|---|
| Name (`SV[2][0]`) | SaaS Systems |
| Short line (card subtitle / slide caption) (`[1]`) | From MVP to scalable SaaS infrastructure. |
| Chip label on “Made around you” (`[2]`) | SaaS product |
| Overview paragraph (`[3]`) | SaaS needs multi-tenant architecture, subscription billing, and a strong focus on onboarding and retention. |
| List 1 heading (`[4][0]`) | Lifecycle |
| • | MVP development: core value first, validated with real users. |
| • | Multi-tenant architecture: isolated customer data on one codebase. |
| • | Billing: Stripe or Paddle for recurring, usage-based and tiered plans. |
| List 2 heading (`[5][0]`) | Components |
| • | Onboarding flows that lower churn |
| • | Cloud-native auto-scaling infrastructure |
| • | Admin dashboards for system health, users and revenue |
| Pull-quote (`[6]`) | Aimed at new products and at companies moving from on-premise to cloud. |
| Key features (`[7]`) | Multi-tenant Architecture · Subscription Billing · Admin Dashboards · Analytics |
| Technologies (`[8]`) | Next.js · Node.js · Stripe · PostgreSQL · AWS |
| Unused “extra” copy (`EX[2]`, defined but not rendered anywhere) | Shape the product model, build multi-tenant foundations and plan for growth. / *MVP / Subscriptions / Architecture* |

#### Service 04 — CRM Systems

| Field | Content (verbatim) |
|---|---|
| Name (`SV[3][0]`) | CRM Systems |
| Short line (card subtitle / slide caption) (`[1]`) | Intelligent pipelines and operational networks. |
| Chip label on “Made around you” (`[2]`) | CRM |
| Overview paragraph (`[3]`) | CRMs as the “central nervous system” of sales and support. A custom CRM is an alternative when Salesforce or HubSpot are too rigid or expensive. |
| List 1 heading (`[4][0]`) | Why custom |
| • | Perfect fit: matches your pipeline without bloat. |
| • | Data ownership: no vendor lock-in. |
| • | Cost efficiency: no per-user licence fees as teams grow. |
| List 2 heading (`[5][0]`) | Features |
| • | Automated lead routing, stage progression and forecasting |
| • | Communication hubs for Gmail/Outlook, VoIP and SMS |
| • | Custom reporting dashboards |
| Pull-quote (`[6]`) | A CRM that drives sales and retention by removing admin work. |
| Key features (`[7]`) | Custom Pipelines · Email/VoIP Integration · Automated Workflows · Custom Analytics |
| Technologies (`[8]`) | React · Node.js · GraphQL · PostgreSQL · SendGrid/Twilio |
| Unused “extra” copy (`EX[3]`, defined but not rendered anywhere) | Bring relationships, tasks and reporting together around the way you work. / *Pipelines / Workflows / Reporting* |

#### Service 05 — AI & Automation

| Field | Content (verbatim) |
|---|---|
| Name (`SV[4][0]`) | AI & Automation |
| Short line (card subtitle / slide caption) (`[1]`) | Intelligent workflows that reduce repetitive work. |
| Chip label on “Made around you” (`[2]`) | AI or automation |
| Overview paragraph (`[3]`) | AI as a practical tool for operational efficiency: models and automation logic that replace repetitive tasks. |
| List 1 heading (`[4][0]`) | Capabilities |
| • | LLMs: GPT-4, Claude and open-source models for chatbots, document analysis and content tools. |
| • | Workflow automation: API integrations and webhooks. |
| • | Predictive analytics: forecasting trends, inventory and customer behaviour. |
| List 2 heading (`[5][0]`) | Applications |
| • | Automated customer support from a proprietary knowledge base |
| • | Data extraction from invoices, receipts and forms |
| • | Personalisation engines |
| Pull-quote (`[6]`) | Teams stop doing robotic tasks and focus on creative problem-solving. |
| Key features (`[7]`) | LLM Integration · Workflow Automation · Predictive Modeling · OCR |
| Technologies (`[8]`) | Python · OpenAI API · LangChain · TensorFlow · Node.js |
| Unused “extra” copy (`EX[4]`, defined but not rendered anywhere) | Connect data and decision rules with purposeful AI and human oversight. / *AI integrations / Workflow orchestration* |

#### Service 06 — Mobile Experiences

| Field | Content (verbatim) |
|---|---|
| Name (`SV[5][0]`) | Mobile Experiences |
| Short line (card subtitle / slide caption) (`[1]`) | Native and cross-platform mobile architecture. |
| Chip label on “Made around you” (`[2]`) | Mobile app |
| Overview paragraph (`[3]`) | Native-feeling apps for iOS and Android that combine design with solid performance. |
| List 1 heading (`[4][0]`) | Approaches |
| • | Cross-platform: mainly React Native, one codebase for both platforms. |
| • | PWAs: installable from the browser with no app store. |
| List 2 heading (`[5][0]`) | Capabilities |
| • | Offline support with automatic sync |
| • | Camera, GPS, FaceID/TouchID and push notifications |
| • | Memory management, 60fps animation and low battery use |
| Pull-quote (`[6]`) | Mobile experiences that users love to keep on their home screens. |
| Key features (`[7]`) | Cross-Platform · Offline Support · Push Notifications · Biometrics |
| Technologies (`[8]`) | React Native · Expo · iOS/Swift · Android/Kotlin · Firebase |
| Unused “extra” copy (`EX[5]`, defined but not rendered anywhere) | Design focused on-the-go journeys, then engineer reliable mobile experiences. / *iOS / Android / Cross-platform* |

#### Service 07 — Digital Products

| Field | Content (verbatim) |
|---|---|
| Name (`SV[6][0]`) | Digital Products |
| Short line (card subtitle / slide caption) (`[1]`) | End-to-end product design and engineering. |
| Chip label on “Made around you” (`[2]`) | Digital product |
| Overview paragraph (`[3]`) | Partnering with ambitious brands and funded startups to launch new digital products, from strategy to deployment. |
| List 1 heading (`[4][0]`) | Lifecycle |
| • | Strategy and scoping: vision, MVP priorities, technical roadmap. |
| • | UI/UX design: wireframes, prototypes, design systems. |
| • | Full-cycle engineering: frontend, backend and cloud. |
| List 2 heading (`[5][0]`) | Why partner |
| • | Design and engineering stay in sync with no handoff friction |
| • | Fast time to market |
| • | Foundations that scale so the MVP is not thrown away |
| Pull-quote (`[6]`) | From consumer apps to enterprise tools, bold ideas turned into engineered products. |
| Key features (`[7]`) | Product Strategy · UI/UX Design · Prototyping · Full-Stack Engineering |
| Technologies (`[8]`) | Figma · React · Next.js · Node.js · Cloud Infrastructure |
| Unused “extra” copy (`EX[6]`, defined but not rendered anywhere) | Turn a validated opportunity into a coherent product, from discovery to release. / *Strategy / UX & UI / Product engineering* |


**Service icons (24×24 line icons, 1.4 stroke, round caps):** 01 browser window with dots · 02 code brackets `</>` · 03 stacked layers · 04 person (head + shoulders) · 05 sparkle/star-burst with crosshair ticks · 06 phone outline · 07 isometric cube/box. The paths are in `SI` in `source/app.js`.

### 9.2 The 6 process steps (`P`)

| # | Step | Description (verbatim) |
|---|---|---|
| 01 | Idea | Define the problem, the opportunity and what success should mean. |
| 02 | Structure | Map business logic, user journeys and the system architecture. |
| 03 | Design | Make complexity understandable through considered interfaces. |
| 04 | Build | Engineer, integrate and test the product as one connected system. |
| 05 | Launch | Prepare the release, refine the details and support the handover. |
| 06 | Evolve | Learn from use and improve the system as the business changes. |

### 9.3 The 2 articles (`AR`)

| # | Title | Meta | Excerpt | Filter key | Card label |
|---|---|---|---|---|---|
| 1 | Why Business Software Is Changing | AI / 5 min | From rigid tools to adaptive systems: how AI can reshape the way business software understands context and supports decisions. | `ai` | Intelligence / in context |
| 2 | The Death of the Dashboard | Design / 8 min | More charts do not always mean more clarity. A look at interfaces that help people act, rather than simply watch. | `design` | Less noise / more signal |

Images: article 1 → `insight-card-1-ai.jpg` (alt “Illustration of a code gear connected to machinery gears, a speed gauge and a walking figure”); article 2 → `insight-card-2-design.jpg` (alt “Illustration of a team meeting where a presenter points to charts on a screen while colleagues discuss around a table”). Slot alternates `i % 2`.

---

## 10. Animation & motion catalogue

**Keyframes (name → effect · duration · easing):**

| Name | Effect | Used by |
|---|---|---|
| `pu` | pulse scale 1.5 / opacity .5 · 2.4s infinite | eyebrow dot |
| `dr` | hero glow drifts `-6vw, 5vw` · 14s alt infinite | hero radial glow |
| `up`/`up2` | text rise (translateY 10px, fade) · .5s `cubic-bezier(.25,.8,.3,1)` | hero h1 words |
| `fi` | fade + rise 24px · .8s `cubic-bezier(.2,.7,.1,1)` | slide content, panels |
| `fl` | float ±10px · 6–7s ease-in-out infinite | floating chips, sculpt |
| `g` | bar grow from bottom · 1–1.2s | chart bars |
| `wd` | width pulse · 3s | skeleton lines (`.v2`, `.ph5`) |
| `sw`, `sc`, `pr` | film light sweep 9s, scanline 5s, progress 24s | studio film |
| `rv` | reveal rise (default 34px, .9s) | everything revealed on scroll |
| `nv` | nav drop-in · .9s `cubic-bezier(.22,1.2,.36,1)` | nav |
| `bz` | background fade/zoom · 1s | canvas bg |
| `dcin` | chip drop-in · 1.2s `cubic-bezier(.22,1.15,.36,1)` | hero chips |
| `mq` | marquee -50% · 34–46s | (unused markup) |
| `vm`/`vmx` | vertical 16s / horizontal 24s marquee | tech columns |
| `stk` | sticker bob -8px · 5s | hero sticker |
| `tms` | shimmer sweep · 6s | philosophy heading |
| `ldb`,`ldx` | loader bar / failsafe | loader |
| `dr2` | underline draw 1.2s | (no markup) |

**Hover/transition language:** springy cubic-beziers `(.34,1.4–1.8,.5,1)` on buttons, chips, links and cards; smooth `(.2,.7,.1,1)` for reveals and image zoom. Typical durations .25–.65s. Button hover: lift 2px + glow + 78% opacity, arrow nudges 5px; `:active` scale .96.

**Scroll-driven effects:** nav progress line + % · hero parallax/fade · slideshow shrink · dashboard scale-in · process step switching · philosophy word reveal · philosophy shimmer position · chapter-dot activation · next-page bar fill · canvas shard drift/velocity.

**Pointer-driven effects:** cursor follower · dashboard 3D tilt · canvas parallax · hero chip hover.

---

## 11. Images & illustrations inventory

All 7 raster images are **JPEG, base64-embedded** (≈ 500 KB of the 646 KB file). Decoded into `assets/images/`.

| File | Used for | Pixels | Size | What it shows |
|---|---|---|---|---|
| `insight-card-1-ai.jpg` | Insight card 1 (Home + Insights) | 860×572 | 51 KB | orange code-gear + dark gears, speed gauge, walking figure on cream — faint corner marks at the bottom edge |
| `insight-card-2-design.jpg` | Insight card 2 | 736×736 | 59 KB | flat illustration of a presenter at a chart screen with a seated team |
| `slide-1-systems.jpg` | Hero slide 1 | 736×414 | 32 KB | isometric office desks, **contains the printed credit “© Institute of Project Management”** at the bottom |
| `slide-3-web.jpg` | Hero slide 3 | 626×417 | 41 KB | photo-style “WEB DESIGN DEVELOPMENT” cloud diagram with hand |
| `slide-4-saas.jpg` | Hero slide 4 | 736×1104 | 44 KB | purple glowing “SaaS” cloud with device icons (portrait) |
| `slide-5-ai.jpg` | Hero slide 5 | 736×1104 | 94 KB | robot on phone screen + woman at laptop (portrait) |
| `studio-culture-tile.jpg` | Studio hero tile | 736×736 | 57 KB | black line-art of three people at a table (white background; inverted by CSS) |

**Non-raster visuals (all inline, no files):** 7 service icons; check-mark icon; Studio icons (cube, eye, code); Careers icons (code, star, compass, sparkle-plus); rotating-rings SVG (menu preview); abstract UI cards `v1–v4`, phone `ph5` (defined, only the rings are shown); studio-film CSS scene; CRM dashboard; canvas background; SVG grain filter.

**Flags to resolve before launch (not changes):** image 3 carries another organisation’s credit; image 1 shows corner marks; none of these seven images has a source/licence recorded in the file. Portrait images 4–5 are cropped by `object-fit:cover` into a wide frame.

---

## 12. Responsive behaviour summary

| Breakpoint | What changes |
|---|---|
| **≥1100px** | smaller type/layout scale (“page felt zoomed-in”): container 1160px, button 14px, nav 16px logo, h2 `clamp(30px,4.1vw,58px)`, nav padding tighter |
| **≥861px** | one-screen heroes (Home, Services, Work, Studio, Careers, Contact), 2-col desktop layouts, Philosophy + Perspective sized in `vh` |
| **≤1180px** | chapter dots hidden |
| **≤1099px** | Services grid → 2 cols; Services steps → 2 cols |
| **≤860px** | links + preview tile + hero chips + round arrow hidden; Menu button only; hero stacks; slideshow becomes fixed height (640px, 680px ≤560px on the old rule, then 440px / 400px in the later rule — final: **440px, 400px ≤560px**); grids collapse to 1 column (cards `.gr/.g3` 2 cols); process height 400vh with horizontal stepper; tech marquee goes horizontal; footer 2 cols; dashboard sidebar becomes a horizontal tab row; careers/contact/studio stack; hover/drag/tilt reduced |
| **≤560px** | footer 1 col; `.pc` % hidden; grids 1 col; hero h1 `clamp(44px,13vw,64px)` *(overridden — still 72px)*; chips 1 col; role cards stack icon/title, description, button |
| **Reduced motion** | all animation and transition off; no smooth scroll; no slab; canvas static; slideshow won’t autoplay |

Mobile-specific fixes exist for: philosophy ordering (text first, list second), perspective-card thumbnails (labels flow in-column instead of overlapping), tech rows (width containment with `contain:paint`), contact form min-height 420px.

---

## 13. JavaScript behaviour & state

| Feature | Behaviour |
|---|---|
| Router | `hashchange` → page slab → `doRoute()` swaps `#app`, sets title, `aria-current`, scrolls to 0, re-inits |
| Persistent state | `localStorage["dc_pick"]` (service index 0–6), `localStorage["dc_poll"]` (article index) — both wrapped in try/catch |
| Greeting | `gt` (“Good morning/afternoon/evening”) is computed but **not displayed anywhere** |
| Slideshow | auto 6s, pause on hover/focus, swipe, thirds-click, segment buttons |
| Personalisation | chip → `pz(i)` re-renders panel, saves pick |
| Drawer | `openS(i)` / `closeS()`; also updates `pz(i)` |
| Process | scroll position → step index; stepper + dropdown jump |
| Dashboard | KPI count-up, sidebar highlight, tilt, scale |
| Accordion | toggle `.open`, update `aria-expanded` |
| Film | toggle; 1s timestamp timer |
| Insights | filter + counter; poll |
| Contact | 6-step wizard, in-memory answers, fake submit |
| Menu / nav | pill collapse at 140px scroll; menu card; chapter dots; next-bar |
| Cursor | follower with lerp .3 |
| Canvas | rAF loop; stops under reduced motion |
| Resize | slide dashboard re-fits (`fitDash`), canvas rebuilds |

---

## 14. SEO / content integrity notes
Everything renders client-side from JS template strings; with JS off the page is empty (`<main id="app">` is blank). No structured data, no OG tags, no favicon, no `robots`/`sitemap`. Link targets `#` (LinkedIn, X / Twitter, Privacy, Terms) are placeholders.

---

## 15. Inconsistencies and leftovers in the prototype (reported, **not** altered)

### 15.1 Overridden or contradicted rules — decide which wins in the build
1. **Serif italic accents:** `--sf` (Instrument Serif italic) and `em.sf` styling are declared, then removed by `!important` rules (“no italic serif accents anywhere”, “round 2”). Final render = Inter 700 normal. The Google Fonts request for Instrument Serif is therefore unused.
2. **Heading sizes:** many `clamp()` sizes for h1 are overridden by a flat `72px !important` (including mobile).
3. **Heading weight:** 600 in base rules → **700** after the “round 2” block.
4. **Background description:** a comment says “B&W contour lines”, another “dark galaxy, drifting glass shards”; the code draws shards + stars.
5. **Matte panels / form card colours:** `#e3e0d8` and `#f2f0ea` are overridden to `#fff` by `:root{--wh:#fff}`.
6. **Cursor label bubble:** CSS and `data-cur` text exist, final CSS hides it and cancels the enlarge state.
7. **Footer wordmark:** neon/shimmer gradient is defined and then cancelled to solid white.
8. **Nav blur:** `backdrop-filter` defined, then removed in the audit pass.
9. **“Next page” bar text:** built in JS then hidden with `display:none`.
10. **Slideshow height on mobile:** multiple conflicting rules (640 / 680 / 440 / 400px); final = 440 / 400.
11. **Contact link underline:** underline set, then removed by `border-bottom:0!important`.
12. **Hero h1 colours:** later rules make word 3 `--lm` and word 2 `--tx`, which are the same colour.

### 15.2 Code defined but not used by any markup (safe to drop only if you confirm)
Functions/data: `rows()` (list-style service rows), `steps6()`, `EX` (extra service copy), `greeting gt`, `.sr` hover-preview card system (`hv()`, `#hp`, `PM`, `vis[]` visuals other than the rings), `#wf` workflow cycler, `vis[1..4]` UI mockups (the slideshow uses images/dashboard instead).
CSS class selectors with no match in any HTML/JS template (automated scan; a few may be false positives, so confirm before deleting): `ar3 arc b2 bb blk bt2 chain cs3 cta dsh ex fl ft2 g3 gl gr hint it2 jn mk mn mq2 nb nr nt nt2 nv2 o5 pj pop r2 row sculpt sdt sh sm2 sph stk4 stp stt tb tp tx wf` (+ `lenis` classes, which the Lenis library adds itself). Also the hero squiggle underline (`.sg svg path` styles, but no SVG in the markup).

### 15.3 Copy / UX oddities
- Personalisation CTA builds its label from the chip text in lowercase: “Start a **crm** project”, “Start a **saas product** project”, “Start a **ai or automation** project”.
- Nav order (Work, Services, …) differs from the next-page order (Services before Work) and from the footer service labels (“Mobile Experiences” vs chip label “Mobile app”).
- Footer service links navigate via drawer, not to a page.
- Studio-film timestamp loops but the progress bar stops at 100% after 24s.
- Insight cards look clickable (hover, focus) but do nothing.
- Dashboard bars never change height when sidebar items are clicked; only the highlighted bar moves.
- Hero h1 at 72px on a 390px phone wraps to multiple lines.
- Form hints (`Q[n][3]`) exist in data but are not shown.

---

## 16. Suggested mapping to a code structure (for your next step)

| Prototype piece | Natural component |
|---|---|
| `V.home` blocks | `Hero`, `HeroSlideshow`, `BiggerPicture`, `MadeAroundYou`, `WhatWeBuild`, `SelectedConcept`, `Philosophy`, `ProcessPinned`, `TechMarquee`, `Perspective`, `StudioFilm`, `FAQ`, `CtaBand` |
| `SVC()` / `SV` | `ServiceTile`, `ServiceDrawer`, single typed `services` data file |
| `dash()` | `CareOSDashboard` (three sizes: full / work-page / slide-scaled) |
| `.pn`, `#mcard`, `#vt`, `.chn`, `#nxp` | `FloatingNav`, `MenuOverlay`, `PageTransition`, `ChapterDots`, `NextPageBar` |
| canvas IIFE | `BackgroundShards` |
| `Q` | `ContactWizard` |
| CSS layers | consolidate into tokens + components using the **last-wins values** documented here |

---

*End of report. Appendix A holds the measured typography for every element on every page.*
