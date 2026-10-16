# DecaCorpus — Cross-validation, Gap Analysis and Plan

Prepared 12 Oct 2026. Source of truth: `DecaCorpus_Build_Whats_Next.html` (the prototype).
Inputs checked against it:

- `DecaCorpus - Typography & Content Report (per page).md` ("Typography report")
- `DecaCorpus - Hover, Animation & Interaction Report (per page).md` ("Interaction report")
- The current React/FastAPI code in `frontend/` and `backend/`

## How this was checked

1. The prototype was split into its markup, its CSS (87 KB, 38 `!important` overrides across ~45 patch layers) and its script (50 KB), and the script was read in full.
2. The prototype was served locally and rendered at 1440 x 900 with Inter and Instrument Sans loaded. Computed styles were read from the live DOM on all 7 pages plus the service drawer (about 150 elements: font, weight, size, letter-spacing, colour, background).
3. Interaction claims were checked against the final CSS rules (last rule wins) and the script.
4. The current React build was rendered at the same size and probed the same way.

---

## Part A — Do the two reports match the prototype?

**Verdict: yes, closely.** Every measured font, weight, size, letter-spacing and text colour in the Typography report matched the live render. Every timing, easing and hover value I checked in the Interaction report matched the final CSS and script. Both reports can be used as the build spec, with the corrections below.

### A1. Corrections (the report says something the prototype does not do)

| # | Report and section | Report says | Prototype actually does |
|---|---|---|---|
| 1 | Typography 4.1 | Home H1 "three words on one line" | At 1440 px the H1 wraps to two lines: **"Build what's" / "next."** (H1 box 589 x 153 px) |
| 2 | Typography 2.4, 4.3, 4.12, 10.2 | "Matte cream panels"; contact form is a "cream card" | Bigger picture panel, FAQ panel, studio philosophy panel, open-invitation panel, CTA band and **contact form card are all pure white `#ffffff`**. The only cream (`#f2f0ea`) surface is the 8th service card, "Not sure where to start?" |
| 3 | Typography 10.2 / Interaction 10 | Step 4 is pre-filled "with the service picked earlier" | It is **always** pre-filled. With no pick it falls back to index 0, so it shows "Website" |
| 4 | Interaction 3.8 / Typography 11 | Next-page bar: "only its progress bar remains" | The `.nxp` element still renders as an **empty 174 px band** (86 px vertical padding plus top and bottom borders) after the footer, with the 4 px bar at its bottom. The replica must keep that spacing |
| 5 | Interaction 4.5, 5.1, 5.2 | Service cards reveal "0.06s apart"; engagement steps "0.08s apart" | The reveal pass overwrites every inline `--dl` with `min(siblingIndex, 5) × 0.09 s`, so cards and steps actually stagger **0.09 s apart, capped at 0.45 s** |

### A2. Omissions (true in the prototype, missing from both reports)

| # | Area | Detail |
|---|---|---|
| 5 | Punctuation | The reports normalise characters to "-". The source uses **"•"** (Selected-concept footnote, Work disclaimer), **"–"** (footer tagline "DECACORPUS – Digital technology studio.", "Services / 01–07"), **"—"** ("Pick what you're building — we'll…", "Video preview — footage pending.") and curly quotes everywhere. Copy must come from the source, not the reports |
| 6 | Responsive values | Both reports measure **1440 px only**. Mobile and tablet values (breakpoints 1180 / 1100 / 860 / 560, the clamp ranges, the 42-shard canvas, the 24 s horizontal tech rows) are only in the CSS and in `report/Report_DecaCorpus_Prototype_Extraction.md` |
| 7 | Layout order | The giant DECACORPUS wordmark sits **above** the footer columns (it comes before `<footer>` in the markup), not inside the footer |
| 8 | Dashboard detail | The chart starts with **Friday** highlighted. The tabs map to bar `(tab*2+1) % 7`: Overview → Tue, Patients → Thu, Appointments → Sat, Workflows → Mon, Analytics → Wed. In slide 2 the KPIs are **static** "128 / 24 / 08" (no count-up) |
| 9 | Drawer focus quirk | Every Esc press and every route change calls `closeS()`, which moves focus back to the last drawer opener even when the drawer is already closed |
| 10 | Film timer | Pausing does not reset the counter. Resuming continues from where it stopped |
| 11 | Unused data | `EX` (seven extended service descriptions plus tag lines) and `steps6()` exist in the script, but nothing renders them |
| 12 | Assets | Seven images are embedded as base64 (two article thumbnails, four slide photos, one studio illustration). Lenis is loaded from CDN at **v1.1.20** |

### A3. Checked and confirmed (high-risk claims that hold)

Page curtain 0.58 s in / 0.65 s out (hidden only under reduced motion). Loader pauses all other animations via `body:not(.rd) *`. Process section is 5.6 screens tall and split into 6 zones. Pill collapses at 140 px and re-expands to ~705 px on hover. Floating chips are hidden at ≤ 860 px. The cursor label bubble is hidden by override. The footer wordmark is 144 px at 1440 (`clamp(40px,10vw,160px)`). Drawer is 580 px wide. Button hover is −2 px with 78 % opacity. Service card lift is 6 px. Marquee is 16 s. Article photo zooms to 1.04. Chapter dots appear after 420 px of scroll.

---

## Part B — How far is the current build from the prototype?

The current frontend has the right components and most of the copy (text length per page is within ±5 % of the prototype). Visually and behaviourally, though, it is an **approximation, not a replica**: about 260 lines of CSS plus guessed Tailwind values, against the prototype's 87 KB final cascade.

### B1. Measured differences at 1440 px

| Area | Prototype | Current build |
|---|---|---|
| H1 size | 72 px on every page | 77.8 – 108 px |
| H1 weight | 700 | **400** on Services, Work, Studio, Insights |
| Home H2s | 58 / 68 / 86.4 px | Five H2s render at **16 px** (unstyled): Healthcare CRM, The right tools…, A different perspective., Studio film preview, Questions, answered. |
| Section H2 | 58 px | 68 – 76 px in several places |
| CTA H2 | 100 px | 84 px |
| Fonts loaded | Inter 400/500/600/700, Instrument Sans 400/500/600 | Inter **500 and 600 missing** (faux weights), **Instrument Serif rendered** (should never show) |
| Tab title | Changes per route (7 titles) | Always "DecaCorpus \| Build What's Next." |
| Home section order | Hero → Bigger picture → **Made around you → What we build** → … | What we build appears **before** Made around you |
| Hero layout | Text column left, 5-slide slideshow right, H1 on 2 lines | Different grid, narrow text column, different slideshow proportions |
| Hover and motion | ~140 rule-level behaviours (Interaction report) | Only partly present; most per-element hover values are missing |

### B2. Backend differences against `02_TRD.md` and `04_Backend_Schema.md`

| Area | Spec | Current |
|---|---|---|
| Storage | PostgreSQL tables (04_Backend_Schema §2) | In-memory Python lists, lost on restart |
| Poll | 2 options (the 2 articles), no results shown | 4 options seeded with fake counts, returns percentages |
| Endpoints | `/api/contact-submissions`, `/api/poll-votes`, `/api/services[/{position}]`, `/api/process-steps`, `/api/articles`, `/api/faq`, `/api/career-roles`, `/api/contact-questions` | Prefixed `/api/v1/`; process-steps, faq, career-roles and contact-questions are missing |
| CORS | — | `"*"` combined with `allow_credentials=True` (browsers reject this combination; tighten it) |
| Smooth scroll lib | Lenis 1.1.20 (`lenis` package) | `@studio-freight/lenis` 1.0.42 (deprecated package name) |

---

## Part C — Plan to close the gaps

**Recommended approach: rebuild the presentation layer on the prototype's own CSS and markup, and keep the existing React structure (context, data, API client, component names).**

Patching the current Tailwind values one by one means re-deriving about 45 override layers by hand and would keep drifting. Porting the final CSS and rendering the **same class names and DOM structure** from React components gives a like-for-like cascade, so the replica matches by construction. A measurement harness then proves it.

### Phase 0 — Decisions (confirmed by the owner, 12 Oct 2026)

1. **Rebuild** the frontend presentation layer on the prototype's CSS and markup.
2. **Replicate exactly**, including the visible quirks in Part D. Fixes stay opt-in.
3. **No database.** The backend keeps no SQL store. Contact submissions and poll votes are appended to JSON files under `backend/data/` (git-ignored), and content is served from the in-code data module.
4. **Remove Tailwind**, PostCSS and autoprefixer. The ported CSS is the only stylesheet.

### Dependency audit

The prototype loads exactly one third-party script: **Lenis 1.1.20** (smooth scroll). Every other effect is hand-written and needs no library:

| Effect | Prototype technique | Library needed |
|---|---|---|
| Smooth scroll, anchor glide, scroll lock | Lenis | **`lenis@1.1.20`** (the current package name for the same library) |
| Reveals, curtain, drawer, menu, marquees, sticker, chips, film beam, gradient sweep | CSS keyframes and transitions (28 `@keyframes`) | none |
| Glass-shard background | Canvas 2D, `requestAnimationFrame` | none |
| Rotating rings in the menu tile | SVG SMIL (`<animate>`, `<animateTransform>`) | none |
| Counters, tilt, parallax, process pinning, word light-up | Plain JS on scroll and pointer events | none |
| Icons | Inline SVG paths (in the source) | none |
| Fonts | Google Fonts CSS link | none |

So the frontend dependencies become `react`, `react-dom` and `lenis@1.1.20`, plus Vite and its React plugin. `framer-motion`, `lucide-react`, `clsx`, `@studio-freight/lenis` (deprecated), `tailwindcss`, `postcss` and `autoprefixer` are removed: a second animation or icon system would produce motion and glyphs that differ from the prototype.

### Phase 1 — Single source of truth

- Extract the prototype CSS into `frontend/src/styles/prototype.css` **in its original order**, so every last-wins override is preserved. Load it once, globally.
- Extract the 7 base64 images into `frontend/public/assets/images/` and byte-compare them with the existing files. Keep the original object-positions (50 % 50 %, 50 % 55 %, 50 % 40 %).
- Move all copy and data into one typed module, `src/data/content.js`, copied character-for-character from the source arrays `SV`, `P`, `AR`, `Q`, FAQ, roles and slides (this fixes the A2-5 punctuation).
- Fonts: the exact Google Fonts URL from the prototype. Meta and default title as in TRD §2. Switch to the `lenis@1.1.20` package.

### Phase 2 — Global shell (markup and behaviour identical to the prototype)

| Component | Must match |
|---|---|
| `Preloader` | 000→100 in 1.5 s, bar, fade 0.6 s, removed at 0.8 s, forced by 3.2 s; adds `body.rd`, which un-pauses all animations |
| `BackgroundCanvas` | 80/42 shards, 130 stars, two breathing glows, pointer parallax (4 %/frame), scroll velocity push, DPR ≤ 1.5, one still frame under reduced motion |
| Router and `PageCurtain` | Hash routes, 0.58 s in → swap → 0.65 s out, no curtain on first load, per-route titles, `aria-current`, scroll to 0, unknown hash → Home |
| `FloatingNav` | Text-roll links, 2 px progress line plus %, collapse at 140 px, hover/focus re-expand (desktop), Menu/Close toggle |
| `MenuOverlay` | Scrim with 10 px blur, card 96→100 %, counters 1/7/2, film tile with rotating-rings SVG (26 s / 34 s), film tile scrolls to the film section after ~1.7 s, Esc/scrim/link close, scroll lock |
| `ServiceDrawer` | 580 px, drawer spring, focus to Close, focus restore, Lenis stop/start, lead-in bolding rule (text before ": " when under 30 characters), opens from cards, the "Read the overview" button and footer service links |
| `CustomCursor` | Teardrop, lerp 0.3, fine pointers only, no label bubble |
| `useReveal` | IntersectionObserver at threshold 0.1 / −5 %, per-sibling delay 0.09 s capped at 5 steps, 1.8 s fallback, `html.fail` shows everything; KPI count-up 1.1 s ease-out-cubic |
| `ChapterDots` | Home only, built from the "0N / Title" eyebrows, shown after 420 px, active = section above mid-screen |
| `NextPageBar` | Keep the empty 174 px band (A1-4); wheel-only fill to 900, drain 90 per opposite tick, order Home → … → Contact → Home |
| `Wordmark` + `Footer` | Wordmark above the footer (A2-7); footer service links open the drawer |

### Phase 3 — Pages (port the `V` templates to JSX one-to-one)

- **Home (13 blocks, correct order):** hero (2-line H1, chips, sticker, round arrow, entrance delays, scroll parallax and fade, slideshow scale to 0.92), slideshow (6 s autoplay, segments, arrows, thirds-click, 50 px swipe, hover/focus pause, slide-2 dashboard fit with static KPIs), bigger picture, Made around you (`dc_pick` persistence), What we build, Selected concept (dashboard scale 0.88→1, tilt, tab-to-bar mapping from A2-8), philosophy (gradient sweep, word-by-word light-up), process (560 vh pinned, 6 zones, list/pill/dropdown jumps to the centre of each zone), tech conveyors, perspective cards, studio film (fake playback and timer per A2-10), FAQ (multi-open), CTA.
- **Services:** grid that fills the viewport (4 × 2, then 2 columns below 1100 px and 1 column below 560 px), four steps, CTA.
- **Work:** two-column landing, compact dashboard, CTA.
- **Studio:** landing with the illustration tile, white philosophy panel, three "How we work" cards, CTA.
- **Insights:** filters with counter text, cards, poll (`dc_poll`, disabled after voting), no CTA.
- **Careers:** full-height landing, mailto subjects, role cards, open-invitation panel.
- **Contact:** 6-step wizard (Enter = Next, Previous disabled on step 1, step 4 always pre-filled), thank-you state. Send also POSTs to the backend, and the UI is unchanged whether or not the call succeeds.

### Phase 4 — Backend to spec

- No database (decision 3). Writes are appended to `backend/data/contact_submissions.jsonl` and `backend/data/poll_votes.jsonl` behind a lock. Content comes from the in-code data module, which holds the verbatim source arrays.
- Endpoints exactly as TRD §C under `/api/…`. Poll limited to `option_index ∈ {0,1}`. Pydantic validation, explicit CORS origins.
- The frontend uses the bundled data first and the API only for writes (contact, poll), so the site renders with the backend down, as the prototype does.

### Phase 5 — Verification (proves "replica")

1. **Style-diff harness:** a script that loads the prototype and the React app side by side at **1440 x 900, 1024 x 768 and 390 x 844**. It reads computed font, size, weight, letter-spacing, colour, background and bounding box for every probed element on all 7 pages and the drawer. Target: zero differences, apart from the opt-in fixes.
2. **Screenshot comparison** for each section at the same three sizes.
3. **Behaviour checklist:** every row of the Interaction report, ticked in the browser (hover, click, keyboard, drag, wheel-to-next-page, reduced motion).
4. **Backend tests:** pytest for each endpoint, plus contact and poll round-trips.

---

## Part D — Prototype quirks (replicate by default, optional fixes)

| Quirk | Prototype behaviour | Possible fix |
|---|---|---|
| Service CTA label | "Start a saas product project", "Start a ai or automation project" | Proper casing and "an" before vowels |
| H1 on phones | Fixed 72 px | Restore the responsive clamp |
| Article and culture cards | Lift on hover but do nothing on click | Remove the hover lift or add links |
| Slideshow | No visible pause control | Add a pause button (WCAG 2.2.2) |
| Wheel-to-next-page | Mouse and trackpad only | Add a touch equivalent or a visible link |
| Drawer focus | Focus jumps on every Esc and every route change (A2-9) | Restore focus only if the drawer was open |
| Contact | No validation; step 4 always "Website" | Email validation; pre-fill only after a real pick |
| Dead code | `EX`, `steps6`, preview-card hover, workflow ticker, wordmark shimmer, Instrument Serif request | Leave it out of the React build (it has no visible effect) |
| Placeholder links | LinkedIn, X / Twitter, Privacy, Terms point to `#` | Real URLs when available |

---

## Part E — Implementation status (12 Oct 2026)

Phases 1–4 are implemented on the decisions above. Results of Phase 5 verification:

| Check | Result |
|---|---|
| Style diff: prototype vs React, all 7 pages, at 1440 x 900, 1024 x 768 and 390 x 844 (nav, menu, dots, main, wordmark, footer, next bar, drawer: every element's font, weight, size, letter-spacing, colour, background, display and box) | **Identical element counts on every page** (Home 887, Services 305, Work 280, Studio 240, Insights 225, Careers 259, Contact 214). No style or geometry differences apart from timing artefacts: slideshow progress width, and CSS transitions frozen mid-way because the test pane was hidden |
| Interactions run in both builds side by side: drawer (card and footer link), Esc close, chips and panel, dashboard tabs, FAQ, film timer, slideshow arrows, menu open and close, 6-step wizard with Back, step-4 pre-fill and thank-you, Insights filter and counter, poll | **Identical DOM after every step** |
| Page curtain | `vt in` → page swap, title and `aria-current` at 580 ms → `vt out` → reset, matching the prototype |
| Real wheel scrolling (Lenis) | Reveals, pill collapse, chapter dots and the dashboard scale-in work |
| Backend | 16 pytest tests pass (content endpoints, verbatim copy, 404s, contact round-trip, poll validation) |
| Production build | Passes; CSS 85 kB / JS 216 kB (68 kB gzip). `npm audit --omit=dev`: 0 vulnerabilities |

Not yet verified: keyboard-only navigation, `prefers-reduced-motion`, and real touch devices. Vite 5 carries a moderate advisory that affects only the local dev server (GHSA-67mh-4wv8-2f99); the fix is a major Vite upgrade, left as a follow-up.
