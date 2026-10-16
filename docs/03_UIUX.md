# DecaCorpus Website — UI/UX Specification

Section numbers (§) in this document refer to the numbering of `Report_DecaCorpus_Prototype_Extraction.md`. Text taken from the report is reproduced without change.

This document is made of the design and interaction sections of the report. Nothing has been added or changed.

- **Per-page layout, copy and effects:** 01_PRD → report §8 (Home, Services, Work, Studio, Insights, Careers, Contact).
- **Measured typography for every element on every page (desktop 1440 and mobile 390):** `Appendix_A_Computed_Typography.md` — the report states this appendix "is the one to code from" (§4.2).
- **Reference renders:** `reference_screenshots_desktop_viewport/` and `source/styles.css` in `decacorpus_extract.zip`.
- **Rule from the report:** the CSS is layered and the last matching rule is the truth (§1.1).

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
