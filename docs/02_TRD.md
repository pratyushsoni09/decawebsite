# DecaCorpus Website — Technical Requirements Document (TRD)

Section numbers (§) in this document refer to the numbering of `Report_DecaCorpus_Prototype_Extraction.md`. Text taken from the report is reproduced without change.

## A. Stack

| Layer | Specified by the project owner | Reference from the report |
|---|---|---|
| Frontend | **React** | The report's tech section (§8.1, block 8) lists under *Frontend*: React · Next.js · Three.js · GSAP |
| Backend | **Python** | The same section lists under *Backend*: Node.js · Python · FastAPI · Prisma, and under *Infrastructure*: PostgreSQL · MongoDB · AWS · Docker |
| Authentication / authorisation | **None — no login, no RBAC** | — |

The backend framework and database are not fixed by the report; FastAPI and PostgreSQL appear in its technology list. Confirm before building.

## B. Routing (from §1 and §7)
The prototype is a single-file, client-rendered, **hash-routed** site with 7 routes: `#/`, `#/services`, `#/work`, `#/studio`, `#/insights`, `#/careers`, `#/contact`. Each page is a template that sets the content of `<main id="app">`; an unknown hash falls back to Home. Page titles, nav order, menu order and the "next page" order are in §7 (see 01_PRD).

## C. Backend scope (what the report makes dynamic)
The report states **"No backend. The contact form, poll and CRM dashboard are all simulated."** (§1). The Python backend therefore covers the pieces the prototype simulates and holds the data the report lists. Every endpoint below is public (no login).

| Endpoint | Purpose | Report source |
|---|---|---|
| `POST /api/contact-submissions` | Receive the six answers of the contact wizard | §8.7 (questions), §13 (Contact: 6-step wizard, fake submit) |
| `POST /api/poll-votes` | Record a vote for one of the two articles | §8.5 (Poll), §13 (`dc_poll`) |
| `GET /api/services`, `GET /api/services/{position}` | The 7 services | §9.1 |
| `GET /api/process-steps` | The 6 process steps | §9.2 |
| `GET /api/articles` | The 2 articles (with filter key) | §9.3, §8.5 |
| `GET /api/faq` | The 4 FAQ items | §8.1 block 11 |
| `GET /api/career-roles` | The 4 role cards | §8.6 |
| `GET /api/contact-questions` | The 6 form steps | §8.7 |

The GET endpoints are only needed if the content is served from the database; the report's own suggestion (§16) is a single typed `services` data file in the frontend. Table definitions: 04_Backend_Schema.

---

## Report sections — technical content

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
