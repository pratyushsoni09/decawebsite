# DecaCorpus Website — Product Requirements Document (PRD)

Section numbers (§) in this document refer to the numbering of `Report_DecaCorpus_Prototype_Extraction.md`. Text taken from the report is reproduced without change.

**Build constraints given by the project owner**
- Frontend: **React**
- Backend: **Python**
- This is a company website: **no login and no role-based access control (RBAC)** anywhere.

**What this document is made of:** the prototype's own inventory (report §0, §1, §7, §8, §15). No requirement, feature, page, copy or decision has been added to it. Where the report says the prototype contradicts itself, both sides are kept and no choice is made (§15).

**Where the rest of the report went**

| Report section | Document |
|---|---|
| Header, §0, §1, §7, §8, §15 | 01_PRD (this document) |
| §2, §13, §14, §16 | 02_TRD |
| §3, §4, §5, §6, §10, §11, §12 (+ Appendix A by reference) | 03_UIUX |
| §9 (+ form questions §8.7 and poll §8.5 by reference) | 04_Backend_Schema |
| Build order derived from §16 | 05_Implementation_Plan |

---

## Source report — header

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
