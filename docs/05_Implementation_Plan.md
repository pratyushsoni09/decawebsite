# DecaCorpus Website — Implementation Plan

Section numbers (§) in this document refer to the numbering of `Report_DecaCorpus_Prototype_Extraction.md`. Text taken from the report is reproduced without change.

This plan only orders the work that the report already contains. It adds no scope, no estimates and no new requirements. Stack: **React** frontend, **Python** backend, **no login / no RBAC**.

## Step 1 — Set up
- [ ] React frontend project and Python backend project.
- [ ] Hash routes for the 7 pages with the per-route titles (§1, §2, §7).
- [ ] Fonts and meta as listed in §2; typography as §4 and Appendix A; design tokens as §3.
- [ ] Layout system, breakpoints and z-index stack as §5.

## Step 2 — Data and backend (04_Backend_Schema, 02_TRD §C)
- [ ] Create the tables for services, process steps, articles, FAQ, career roles, form questions, contact submissions and poll votes.
- [ ] Load the verbatim data of §9.1 (7 services), §9.2 (6 steps), §9.3 (2 articles), the 4 FAQ items (§8.1 block 11), the 4 role cards (§8.6) and the 6 form steps (§8.7).
- [ ] Endpoint for contact submissions (6 answers, §8.7).
- [ ] Endpoint for poll votes (§8.5).
- [ ] Read endpoints for the content tables (only if content is served from the database; report §16 suggests a typed data file).

## Step 3 — Global shell (report §6; components per §16)
- [ ] `FloatingNav` (§6.3) · rolling link effect (§6.4)
- [ ] `MenuOverlay` (§6.5)
- [ ] `PageTransition` (§6.6)
- [ ] Loader (§6.1)
- [ ] `BackgroundShards` canvas, vignette, film grain (§6.2)
- [ ] Smooth scroll, route-change scroll, anchor offset (§6.7)
- [ ] Scroll-reveal system (§6.8)
- [ ] Custom cursor (§6.9)
- [ ] `ChapterDots` — Home only (§6.10)
- [ ] `NextPageBar` (§6.11)
- [ ] Footer and wordmark (§6.12)
- [ ] `ServiceDrawer` (§6.13)
- [ ] Focus and accessibility baseline, reduced motion (§6.14)

## Step 4 — Shared components (§16)
- [ ] `ServiceTile` and the single typed `services` data
- [ ] `CareOSDashboard` in three sizes: full / work-page / slide-scaled (§8.3.1)
- [ ] `CtaBand` (appears on Home, Services, Work, Studio — §7)

## Step 5 — Pages (report §8)
- [ ] **Home — 13 blocks:** `Hero`, `HeroSlideshow`, `BiggerPicture`, `MadeAroundYou`, `WhatWeBuild`, `SelectedConcept`, `Philosophy`, `ProcessPinned`, `TechMarquee`, `Perspective`, `StudioFilm`, `FAQ`, `CtaBand` (§8.1)
- [ ] **Services** (§8.2)
- [ ] **Work** (§8.3)
- [ ] **Studio** (§8.4)
- [ ] **Insights** — filter bar, 2 article cards, poll (§8.5)
- [ ] **Careers** (§8.6)
- [ ] **Contact** — `ContactWizard`, 6 steps (§8.7)

## Step 6 — Behaviour checklist (§13)
- [ ] Router · persistent state (`dc_pick`, `dc_poll`) · slideshow · personalisation · drawer · process · dashboard · accordion · film · insights filter + poll · contact wizard · menu/nav · cursor · canvas · resize
- [ ] Motion and animation catalogue (§10)
- [ ] Responsive behaviour at each breakpoint (§12)

## Step 7 — Decisions the report leaves open (§15.1) — close before or during the build
The report says "the last matching rule is the truth" and lists these contradictions, without picking a side:
1. Serif italic accents (`--sf`, `em.sf`)
2. Heading sizes (flat `72px !important` vs `clamp()`)
3. Heading weight (600 vs 700)
4. Background description (contour lines vs shards)
5. Matte panels / form card colours
6. Cursor label bubble
7. Footer wordmark gradient
8. Nav blur
9. "Next page" bar text
10. Slideshow height on mobile
11. Contact link underline
12. Hero h1 colours

## Step 8 — Confirm before dropping (§15.2) and review oddities (§15.3)
- [ ] Code defined but not used by any markup (functions/data and CSS class list in §15.2) — drop only after confirming.
- [ ] Copy / UX oddities listed in §15.3.

## Step 9 — Flags to resolve before launch (§11)
- [ ] Image 3 carries another organisation's credit
- [ ] Image 1 shows corner marks
- [ ] None of the seven images has a source/licence recorded
- [ ] Portrait images 4–5 are cropped by `object-fit:cover` into a wide frame

## Step 10 — Verification limits stated in the report (§0)
- [ ] Check glyph shapes with Inter / Instrument Sans loaded (fonts were unreachable when the report was made)
- [ ] Check Lenis smooth-scroll feel
- [ ] Check hover, drag and scroll-driven behaviours (documented from code, not from video)
- [ ] Compare against the first-viewport screenshots in `reference_screenshots_desktop_viewport/` (rendered with fallback fonts)

## Step 11 — SEO / content integrity notes (§14)
Facts recorded by the report, to be reviewed by the owner: content renders client-side only; no structured data, Open Graph tags, favicon, `robots` or `sitemap`; link targets `#` for LinkedIn, X / Twitter, Privacy and Terms are placeholders.
