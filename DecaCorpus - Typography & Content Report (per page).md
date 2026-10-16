# DecaCorpus Website - Typography & Content Report

Source file: DecaCorpus\_Build\_Whats\_Next.html | Pages: Home, Services, Work, Studio, Insights, Careers, Contact | Measured at a 1440 x 900 desktop viewport | Prepared 12 Oct 2026

## 1. How to read this report

This report lists the written content of every page together with the exact font treatment of each piece of text. Values are the final computed styles after every CSS override layer in the file was applied, read from a real render of each page (not guessed from the stylesheet).

- **IN** = Inter (display/heading font). **IS** = Instrument Sans (body/UI font).
- Weights: 300 Light, 400 Regular, 500 Medium, 600 SemiBold, 700 Bold.
- **ls** = letter-spacing (em). **UC** = rendered UPPERCASE through CSS text-transform (the source text is mixed case).
- Sizes are for a 1440 px wide window. Most sizes use clamp(), so they scale with the viewport; the clamp ranges are in the type-scale table below.
- Colour codes: cream #f2f0ea, muted #9a968a, silver #c9c6bd, ink #0a0a0a, white #ffffff.
- Italic: nothing on the site is italic. A final override ("no italic serif accents anywhere") forces every em.sf accent word to Inter, upright, same weight as its heading.
- Underline: none, except where stated (email links use a 1 px bottom border, not a text underline).
- Repeated items (for example the technology marquee, which repeats each pill 4 times) are listed once.

## 2. Type system at a glance

### 2.1 Font families and loading

| Font | Role | Weights loaded | Notes |
| --- | --- | --- | --- |
| Inter | All headings (H1, H2, H3), big numbers, menu, process steps | 400, 500, 600, 700 | Stack: Inter, "Inter Fallback", sans-serif |
| Instrument Sans | Body copy, labels, buttons, nav, tags, forms | 400, 500, 600 | Stack: "Instrument Sans", system-ui, sans-serif. No 700 is loaded, so nothing uses 700 in this font |
| Instrument Serif (italic) | Loaded from Google Fonts but not displayed anywhere | 400 italic | Overridden to Inter everywhere; the request is unused |

### 2.2 Type scale (1440 px)

| Role | Font | Weight | Size | Letter-spacing | Where it is used |
| --- | --- | --- | --- | --- | --- |
| H1 | IN | 700 | 72px (fixed on every screen size) | -0.035em | Hero and page titles on all pages |
| Closing CTA H2 | IN | 700 | 100px | -0.035em | "Have something to build?" band |
| Process step title | IN | 700 | 112px | -0.04em | Home > How we get there |
| H2 | IN | 700 | 58px (clamp 30-58) | -0.035em | Section headings |
| H2 variants | IN | 700 | 64px / 68px / 86.4px | -0.035em | Services steps, Home perspectives, Home philosophy |
| H3 | IN | 700 | 24-30px | -0.01em to -0.02em | Cards, steps, questions |
| H4 | IN | 600 | 20-32px | -0.01em to -0.02em | Drawer sub-heads, dashboard title |
| Lead paragraph | IS | 500 | 19-23px (44px in Studio philosophy panel) | normal | Intro sentences under H1 |
| Body | IS | 400 | 16px (14px in cards and tables) | normal | Paragraphs |
| Button | IS | 600 | 14px | normal | All buttons |
| Eyebrow / label | IS | 400 | 12px | 0.08em, UC | Section labels |

### 2.3 Bold usage

- **700 Bold**: only H1, H2 and H3 (Inter).
- **600 SemiBold**: buttons, brand name, dashboard title, drawer sub-heads, menu links, process list, FAQ questions, stat badges.
- **500 Medium**: lead paragraphs, chips, numbering (01, 02...), the dashboard KPI numbers, tabs, captions.
- **400 Regular**: all other body text.

### 2.4 Text colours by surface

| Surface | Heading | Body | Label / muted |
| --- | --- | --- | --- |
| Dark page (default) | #f2f0ea | #9a968a (paragraphs), #c9c6bd (lists, tags) | #9a968a |
| Cream/white panels (bigger picture, FAQ, studio philosophy, perspective cards, CTA band, invitation panel) | #0a0a0a | #3b3a36 (matte panels) or #0a0a0a | #4b4a44 |
| Contact form card (cream) | #0a0a0a | #4b4a44 | #4b4a44 |

## 3. Shared elements (appear on every page)

### 3.1 Loading screen (first visit only)

| Element | Content | Style |
| --- | --- | --- |
| Status line | INITIALIZING DIGITAL SYSTEM... | IS 500 - 11.7px - ls 0.22em - #9a968a |
| Counter | 000 to 100 | IN 600 - 150px - ls -0.05em - #f2f0ea |
| Percent sign | % | IN 600 - 45px - #f2f0ea |

### 3.2 Navigation pill

| Element | Content | Style |
| --- | --- | --- |
| Logo | DecaCorpus | IN 600 - 16px - ls -0.01em - #f2f0ea |
| Links | Work - Services - Studio - Insights - Careers - Contact | IS 400 - 14px - #c9c6bd (hover and current page: #ffffff) |
| Scroll readout | 0% to 100% | IS 500 - 12px - tabular numbers - #9a968a |
| Menu button | Menu / Close | IS 600 - 12px - #0a0a0a on a cream pill |

### 3.3 Menu overlay

| Element | Content | Style |
| --- | --- | --- |
| Large links | Home - Work - Services - Studio - Insights - Careers - Contact | IN 600 - 62px - ls -0.035em - #f2f0ea |
| Index numbers (before each link) | 00 to 06 | IS 500 - 12px - ls 0.08em - #f2f0ea |
| Counters (superscript) | Work 1 - Services 7 - Insights 2 | IN 600 - 38.4px - #f2f0ea |
| Film preview tile label | Studio film preview (with a play triangle) | IS 600 - 14px - #0a0a0a on a cream pill |
| Bottom line | Build what's next. | IS 400 - 14px - #9a968a |
| Bottom button | Start a Project (arrow) | IS 600 - 14px - #0a0a0a on a cream pill |

### 3.4 Footer

| Element | Content | Style |
| --- | --- | --- |
| Logo | DecaCorpus | IN 600 - 16px - #9a968a |
| Tagline | DECACORPUS - Digital technology studio. | IS 400 - 16px - #f2f0ea |
| Column labels | Studio - Services - Reach us | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Studio column links | Work, Services, Studio, Insights, Careers, Contact | IS 400 - 14px - #c9c6bd |
| Services column links | Web Development, Software Development, SaaS Systems, CRM Systems, AI & Automation, Mobile Experiences, Digital Products | IS 400 - 14px - #c9c6bd |
| Reach us links | hello@decacorpus.com, careers@decacorpus.com, LinkedIn, X / Twitter | IS 400 - 14px - #c9c6bd |
| Bottom bar | (c) 2026 DECACORPUS - Privacy - Terms | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Giant wordmark | DECACORPUS | IN 600 - 144px - ls -0.05em - solid white fill, fading out toward the bottom edge |

### 3.5 Closing CTA band (Home, Services, Work, Studio)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | Let's build what's next | IS 400 - 12px - UC - ls 0.08em - #55534b |
| Heading | Have something to build? Let's make it real. ("real." is an accent word with the same style) | IN 700 - 100px - ls -0.035em - #0a0a0a on a white band |
| Button | Start a Project | IS 600 - 14px - #f2f0ea on an ink pill |
| Email link | hello@decacorpus.com | IS 400 - 24px - #0a0a0a - 1 px bottom border |

### 3.6 Care / OS dashboard component (Home section 3, Home slide 2, Work page)

The same component appears three times. Sizes differ slightly between the Home section and the Work page (compact version).

| Element | Content | Home style | Work page style |
| --- | --- | --- | --- |
| Sidebar title | Care / OS | IN 600 - 18px - #f2f0ea | IN 600 - 16px |
| Sidebar tabs | Overview (active) - Patients - Appointments - Workflows - Analytics | IS 500 - 14px - #c9c6bd (active #0a0a0a on cream) | IS 500 - 12px |
| Sidebar note | Concept workspace | IS 400 - 12px - UC - ls 0.08em - #9a968a | same |
| Panel title | Care, connected. | IN 600 - 32px - ls -0.02em - #f2f0ea | 26px |
| Panel subtitle | Concept preview / sample data | IS 400 - 12px - UC - ls 0.08em - #9a968a | same |
| Badge | Demo workspace | IS 400 - 12px - #c9c6bd | same |
| KPI numbers | 128 - 24 - 08 | IN 500 - 46px - tabular - #f2f0ea | 34px |
| KPI labels | Active records - Appointments - Follow-ups | IS 400 - 14px - #9a968a | same |
| Chart title | Care activity | IS 400 - 14px - #c9c6bd | same |
| Chart caption | Sample week | IS 400 - 12px - UC - ls 0.08em - #9a968a | same |
| Chart axis | M T W T F S S | IS 400 - 12px - #9a968a | same |
| Workflow title | Next in the workflow | IS 400 - 14px - #ffffff | same |
| Workflow items | Appointment reminder - Post-visit check-in - Record review | IS 400 - 12px - #c9c6bd | same |
| Workflow states | Ready - Ready - Review | IS 400 - 12px - #9a968a | same |
| Workflow note | Illustrative workflow states | IS 400 - 12px - #9a968a | same |
| Table title | Patient workflow | IS 600 - 14px - #ffffff | same |
| Table header | Record - Next action - Status | IS 400 - 12px - UC - ls 0.08em - #9a968a | same |
| Table rows | Sample 01 / Intake review / Review; Sample 02 / Visit reminder / Queued; Sample 03 / Care follow-up / Scheduled | IS 400 - 14px - #c9c6bd | same |

## 4. Home page

Order on the page: hero, slideshow, bigger picture, made around you, what we build, selected concept, philosophy, process, technology, perspectives, studio film, FAQ, closing CTA. Shared elements (nav, footer, CTA band) are in section 3.

### 4.1 Hero (first screen)

| Element | Content | Style |
| --- | --- | --- |
| Floating chips (3) | Web - AI - SaaS | IS 500 - 14px - #f2f0ea on a dark pill |
| Eyebrow | Deca Corpus / Digital technology studio | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H1 (three words on one line) | Build - what's - next. | IN 700 - 72px - ls -0.035em - #f2f0ea |
| Sticker | Systems, not silos. | IS 600 - 17px - #0a0a0a on a cream pill |
| Round arrow button | (arrow) | IS 400 - 24px - #0a0a0a on a cream circle |
| Lead | We don't just build websites. We build the systems behind businesses. | IN 600 - 30px - ls -0.02em - #f2f0ea |
| Supporting text | We engineer digital products, software systems, SaaS platforms and business technology built for the real world. | IS 400 - 16px - #9a968a |
| Primary button | Start a Project | IS 600 - 14px - #0a0a0a on cream |
| Ghost button | See the concept | IS 600 - 14px - #f2f0ea, 1 px outline |

### 4.2 Hero slideshow (5 slides)

Every slide has a top-left label, a top-right code and a bottom caption. Label and code: IS 400 - 12px - UC - ls 0.08em - #9a968a. Caption: IS 500 - 16px - #c9c6bd. Arrow buttons (left and right): IS 400 - 16px - #f2f0ea.

| Slide | Top-left label | Code | Caption | Visual and its description |
| --- | --- | --- | --- | --- |
| 1 | Systems, not silos. | DC / 01 | Designed to connect. | Photo - "Team working across connected desks" |
| 2 | Healthcare CRM | DC / 02 | Custom CRM, Automation and Analytics. | The Care / OS dashboard (section 3.6), scaled to fit |
| 3 | Web Development | DC / 03 | Modern websites engineered for performance, conversion and scale. | Photo - "Web design and development concept" |
| 4 | SaaS Systems | DC / 04 | From MVP to scalable SaaS infrastructure. | Photo - "SaaS cloud platform concept" |
| 5 | AI & Automation | DC / 05 | Intelligent workflows that reduce repetitive work. | Photo - "AI assistant helping a person at a laptop" |

### 4.3 The bigger picture (matte cream panel)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 01 / The bigger picture | IS 400 - 12px - UC - ls 0.08em - #4b4a44 |
| Statement | Less fragmentation. More possibility. | IS 400 - 16px - #3b3a36 |
| H2 | We build the systems behind businesses. ("systems" is an accent word, same style) | IN 700 - 58px - ls -0.035em - #0a0a0a |
| Body | A beautiful interface is only the beginning. We connect the product, the processes and the technology into one considered whole. | IS 400 - 16px - #3b3a36 |

### 4.4 Made around you (interactive picker)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | Made around you | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | What are you building? | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Intro | Pick what you're building - we'll show how we'd shape it around you. | IS 400 - 16px - #9a968a |
| Chip labels | Website - Software - SaaS product - CRM - AI or automation - Mobile app - Digital product | IS 500 - 16px - #f2f0ea (selected chip: #0a0a0a on white) |
| Chip numbers | 01 to 07 | IS 500 - 12px - ls 0.08em - #9a968a |
| Result panel title | the selected service name | IN 700 - 30px - ls -0.01em - #0a0a0a (white card) |
| Result panel counter | 01 / 07 ... 07 / 07 | IS 500 - 12px - ls 0.08em - #6b6860 |
| Result panel description and bullets | see table below | IS 400 - 17px - #0a0a0a |
| Result panel tech tags | see table below | IS 400 - 14px - #0a0a0a on light grey pills |
| Panel buttons | Read the overview (white text on ink) - Start a \[type\] project (outlined) | IS 600 - 14px |

Content shown for each chip (the same text feeds the service drawer in section 5.4):

| Chip | Panel title and description | Bullets | Tech tags | Link button text |
| --- | --- | --- | --- | --- |
| Website | Web Development - Modern websites engineered for performance, conversion and scale. | High Performance - SEO Optimized - Responsive Design - Dynamic Content | Next.js - React - TypeScript - Tailwind CSS - Prisma | Start a website project |
| Software | Software Development - Custom software systems designed around your unique business processes. | Custom Architecture - API Integration - Enterprise Security - Modular Codebase | Node.js - Python - PostgreSQL - Redis - Docker - AWS | Start a software project |
| SaaS product | SaaS Systems - From MVP to scalable SaaS infrastructure. | Multi-tenant Architecture - Subscription Billing - Admin Dashboards - Analytics | Next.js - Node.js - Stripe - PostgreSQL - AWS | Start a saas product project |
| CRM | CRM Systems - Intelligent pipelines and operational networks. | Custom Pipelines - Email/VoIP Integration - Automated Workflows - Custom Analytics | React - Node.js - GraphQL - PostgreSQL - SendGrid/Twilio | Start a crm project |
| AI or automation | AI & Automation - Intelligent workflows that reduce repetitive work. | LLM Integration - Workflow Automation - Predictive Modeling - OCR | Python - OpenAI API - LangChain - TensorFlow - Node.js | Start a ai or automation project |
| Mobile app | Mobile Experiences - Native and cross-platform mobile architecture. | Cross-Platform - Offline Support - Push Notifications - Biometrics | React Native - Expo - iOS/Swift - Android/Kotlin - Firebase | Start a mobile app project |
| Digital product | Digital Products - End-to-end product design and engineering. | Product Strategy - UI/UX Design - Prototyping - Full-Stack Engineering | Figma - React - Next.js - Node.js - Cloud Infrastructure | Start a digital product project |

### 4.5 What we build (service cards)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 02 / What we build | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | Connected thinking. Complete delivery. | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Intro | From the first interface to the infrastructure beneath it. | IS 400 - 16px - #9a968a |
| Card numbers | 01 to 07 | IS 500 - 12px - ls 0.08em - #9a968a |
| Card titles | Web Development - Software Development - SaaS Systems - CRM Systems - AI & Automation - Mobile Experiences - Digital Products | IN 700 - 24px - ls -0.01em - #f2f0ea |
| Card descriptions | Modern websites engineered for performance, conversion and scale. / Custom software systems designed around your unique business processes. / From MVP to scalable SaaS infrastructure. / Intelligent pipelines and operational networks. / Intelligent workflows that reduce repetitive work. / Native and cross-platform mobile architecture. / End-to-end product design and engineering. | IS 400 - 14px - #9a968a |
| Card arrow | (arrow) | IS 400 - 16px - #f2f0ea |
| 8th card (cream card) | 08 - Not sure where to start? - Tell us what you're building. | number IS 500 12px #8a877e; title IN 700 24px #0a0a0a; text IS 400 14px #4b4a44 |
| Button | Explore services | IS 600 - 14px - #f2f0ea, outlined |

### 4.6 Selected concept

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 03 / Selected concept | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | Healthcare CRM | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Dashboard | Care / OS component | See section 3.6 (Home column) |
| Footnote | Concept preview - All interface data is illustrative | IS 400 - 12px - UC - ls 0.08em - #9a968a |

### 4.7 Our philosophy

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 04 / Our philosophy | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | Technology should feel simple. ("simple." is an accent word, same style) | IN 700 - 86.4px - ls -0.035em - painted with a silver-white gradient (transparent text clipped to a gradient) |
| Statement | Behind every interface is a system. Behind every system is a business. We design both. | IN 600 - 28px - ls -0.035em - #f2f0ea (each word is a separate span) |
| Body | DecaCorpus is a digital technology studio focused on engineering complex systems with premium design execution. | IS 400 - 16px - #9a968a |
| Button | Meet the studio | IS 600 - 14px - #f2f0ea, outlined |
| Trio numbers | 01 - 02 - 03 | IS 500 - 12px - ls 0.08em - #9a968a |
| Trio titles | Business - System - Interface | IN 600 - 24px - ls -0.01em - #f2f0ea |
| Trio captions | Goals, logic and growth - Architecture, data and scale - Experience and design | IS 400 - 14px - #9a968a |

### 4.8 How we get there (process)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 05 / How we get there | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | A clear path through complexity. | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Step list (left) | Idea - Structure - Design - Build - Launch - Evolve | IN 600 - 24px - upcoming #5d5b55, finished steps lighter, current #f2f0ea |
| Step counter | Step 1 of 6 ... Step 6 of 6 | IS 400 - 13.3px - #9a968a |
| Step title (large) | Idea / Structure / Design / Build / Launch / Evolve | IN 700 - 112px - ls -0.04em - #f2f0ea |
| Step description | Idea: Define the problem, the opportunity and what success should mean. Structure: Map business logic, user journeys and the system architecture. Design: Make complexity understandable through considered interfaces. Build: Engineer, integrate and test the product as one connected system. Launch: Prepare the release, refine the details and support the handover. Evolve: Learn from use and improve the system as the business changes. | IN 400 - 28px - #c9c6bd |
| Ghost word behind the step | the current step name | IN 600 - 273.6px - ls -0.05em - #f2f0ea at 8% opacity |
| Step selector (pill) | 01 Idea (caret) | number IS 500 11.7px #9a968a; name IS 500 14px #f2f0ea; caret IS 500 14px #9a968a |
| Selector dropdown | 01 Idea - 02 Structure - 03 Design - 04 Build - 05 Launch - 06 Evolve | name IS 500 - 16px - #c9c6bd; number IS 500 - 13.3px - #9a968a |

### 4.9 Built on strong foundations (technology)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 06 / Built on strong foundations | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | The right tools. Not just the latest. ("latest." is an accent word, same style) | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Intro | We choose technology around the product, the people using it and the system it needs to become. | IS 400 - 16px - #9a968a |
| Column labels | Frontend - Backend - Infrastructure - Design | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Frontend pills | React - Next.js - Three.js - GSAP | IS 400 - 16px - #c9c6bd |
| Backend pills | Node.js - Python - FastAPI - Prisma | IS 400 - 16px - #c9c6bd |
| Infrastructure pills | PostgreSQL - MongoDB - AWS - Docker | IS 400 - 16px - #c9c6bd |
| Design pills | Figma - Blender - Cinema 4D | IS 400 - 16px - #c9c6bd |

### 4.10 A different perspective (article previews)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 07 / Ideas in progress | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | A different perspective. | IN 700 - 68px - ls -0.035em - #f2f0ea |
| Button | Explore Insights | IS 600 - 14px - #f2f0ea, outlined |
| Card 1 photo caption and arrow | Intelligence / in context (arrow) | IS 400 - 12px - UC - ls 0.08em - #f2f0ea over the photo |
| Card 1 meta | AI / 5 min | IS 400 - 12px - UC - ls 0.08em - #0a0a0a |
| Card 1 title | Why Business Software Is Changing | IN 700 - 28px - ls -0.01em - #0a0a0a on a white card |
| Card 1 text | From rigid tools to adaptive systems: how AI can reshape the way business software understands context and supports decisions. | IS 400 - 14px - #0a0a0a |
| Card 1 photo description | Illustration of a code gear connected to machinery gears, a speed gauge and a walking figure | image alt text |
| Card 2 photo caption and arrow | Less noise / more signal (arrow) | same as card 1 |
| Card 2 meta | Design / 8 min | same as card 1 |
| Card 2 title | The Death of the Dashboard | same as card 1 |
| Card 2 text | More charts do not always mean more clarity. A look at interfaces that help people act, rather than simply watch. | IS 400 - 14px - #0a0a0a |
| Card 2 photo description | Illustration of a team meeting where a presenter points to charts on a screen while colleagues discuss around a table | image alt text |

### 4.11 Studio film preview

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 08 / Studio film | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | Studio film preview | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Intro | A closer look at how we think, design and build. | IS 400 - 16px - #9a968a |
| Play button | play triangle (changes to a pause symbol while playing) | IS 400 - 20px - #ffffff |
| Timestamp | 0:00 / 0:24 (counts up while playing) | IS 400 - 12px - ls 0.08em - #c9c6bd |
| Caption | Video preview - footage pending. | IS 400 - 16px - #9a968a |
| Button | Watch preview | IS 600 - 14px - #f2f0ea, outlined |

### 4.12 FAQ (matte cream panel)

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | FAQ | IS 400 - 12px - UC - ls 0.08em - #4b4a44 |
| H2 | Questions, answered. | IN 700 - 58px - ls -0.035em - #0a0a0a |
| Questions | What does DecaCorpus build? - How does a project run? - Why a custom CRM? - Are you hiring? | IN 600 - 24px - ls -0.02em - #0a0a0a; plus icon IS 300 - 28px |
| Answer 1 | Websites, custom software, SaaS platforms, CRMs, AI automation, mobile apps and full digital products. | IS 400 - 16px - #3b3a36 |
| Answer 2 | In six steps: Idea, Structure, Design, Build, Launch and Evolve. | same |
| Answer 3 | It matches your pipeline without bloat, you own your data with no vendor lock-in, and there are no per-user licence fees as teams grow. | same |
| Answer 4 | This is an open invitation to connect, not a list of open roles. Write to careers@decacorpus.com. | same |

### 4.13 Closing CTA and section index

The closing CTA band is documented in section 3.5. The Home page also has a vertical dot index on the right edge (visible after scrolling about 420 px, hidden below 1180 px wide) whose labels are: The bigger picture - What we build - Selected concept - Our philosophy - How we get there - Built on strong foundations - Ideas in progress - Studio film. Style: IS 400 - 12px - UC - ls 0.08em - #9a968a.

## 5. Services page

### 5.1 Landing: service grid

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | Services / 01-07 | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H1 | Systems for what's next. ("next." is an accent word, same style) | IN 700 - 72px - ls -0.035em - #f2f0ea |
| Card numbers | 01 to 07 (08 on the cream card) | IS 500 - 12px - ls 0.08em - #9a968a (08: #8a877e) |
| Card titles | Web Development - Software Development - SaaS Systems - CRM Systems - AI & Automation - Mobile Experiences - Digital Products | IN 700 - 24px - ls -0.01em - #f2f0ea |
| Card descriptions | Same seven descriptions as Home section 4.5 | IS 400 - 14px - #9a968a |
| Card arrow | (arrow) | IS 400 - 16px - #f2f0ea |
| 8th card (cream) | Not sure where to start? - Tell us what you're building. | title IN 700 24px #0a0a0a; text IS 400 14px #4b4a44; arrow #0a0a0a |

### 5.2 One connected engagement

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | One connected engagement | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | Not seven silos. One system. | IN 700 - 64px - ls -0.035em - #f2f0ea |
| Step numbers | 01 - 02 - 03 - 04 | IN 500 - 12px - ls 0.08em - #9a968a |
| Step titles | Discover - Shape - Deliver - Improve | IN 700 - 30px - ls -0.02em - #f2f0ea |
| Step texts | Define the problem and the goal. / Map the scope and architecture. / Build, integrate and test. / Learn from use and refine. | IS 400 - 16px - #9a968a |

### 5.3 Closing CTA

See section 3.5 (identical on this page).

### 5.4 Service detail drawer (opens when any service card is clicked)

The drawer slides in from the right. Typography, identical for all seven services:

| Element | Style |
| --- | --- |
| Close button ("Close") | IS 500 - 14px - #f2f0ea - 1 px outlined pill |
| Label (Service 01 ... Service 07) | IS 400 - 13.3px - #9a968a |
| Title | IN 700 - 52px - ls -0.035em - #f2f0ea |
| Tagline under the title | IS 400 - 18px - #ffffff |
| Section headings (Overview, group 1, group 2, Key features, Technologies) | IN 600 - 20px - ls -0.01em - #f2f0ea |
| Overview paragraph | IS 400 - 16px - #9a968a |
| List items | IS 400 - 16px - #c9c6bd; the lead-in before the colon is IS 600 - 16px - #ffffff (bold) |
| Pull quote | IN 500 - 20px - #ffffff |
| Tags (features, technologies) | IS 400 - 14px - #c9c6bd on dark pills |
| Bottom button ("Start a Project") | IS 600 - 14px - #0a0a0a on cream |

Content of the seven drawers (taglines, Key features and Technologies are the same as in the Home table in section 4.4):

| Service | Overview | First group | Second group | Pull quote |
| --- | --- | --- | --- | --- |
| 01 Web Development | Web development as an end-to-end process of designing, building and maintaining sites and web apps, with a focus on business goals, high-performance architecture and good user experience. | Core areas: Front-end: HTML, CSS, JavaScript, React, Next.js, Tailwind. - Back-end: servers, databases and APIs with Node.js, Python, PostgreSQL, MongoDB. - Full-stack: CI/CD, automated testing, observability. | Trends: Headless architecture - UI/UX tied to conversion and accessibility - Core Web Vitals, SEO and mobile-first work - Progressive Web Apps | The digital front door for brand trust, engagement and ROI. |
| 02 Software Development | Scalable, secure, maintainable systems that solve complex business problems, fitted to existing operations. | Core areas: Enterprise architecture: backends that handle high transaction volumes. - System integration: connecting legacy software and third-party APIs. - Custom workflows: logic built around your business rules. | Principles: Scalability first: clean, modular code - Security by design: encryption, access control at every layer - Agile delivery in iterative cycles | From internal management tools to operational systems, a foundation to scale on. |
| 03 SaaS Systems | SaaS needs multi-tenant architecture, subscription billing, and a strong focus on onboarding and retention. | Lifecycle: MVP development: core value first, validated with real users. - Multi-tenant architecture: isolated customer data on one codebase. - Billing: Stripe or Paddle for recurring, usage-based and tiered plans. | Components: Onboarding flows that lower churn - Cloud-native auto-scaling infrastructure - Admin dashboards for system health, users and revenue | Aimed at new products and at companies moving from on-premise to cloud. |
| 04 CRM Systems | CRMs as the "central nervous system" of sales and support. A custom CRM is an alternative when Salesforce or HubSpot are too rigid or expensive. | Why custom: Perfect fit: matches your pipeline without bloat. - Data ownership: no vendor lock-in. - Cost efficiency: no per-user licence fees as teams grow. | Features: Automated lead routing, stage progression and forecasting - Communication hubs for Gmail/Outlook, VoIP and SMS - Custom reporting dashboards | A CRM that drives sales and retention by removing admin work. |
| 05 AI & Automation | AI as a practical tool for operational efficiency: models and automation logic that replace repetitive tasks. | Capabilities: LLMs: GPT-4, Claude and open-source models for chatbots, document analysis and content tools. - Workflow automation: API integrations and webhooks. - Predictive analytics: forecasting trends, inventory and customer behaviour. | Applications: Automated customer support from a proprietary knowledge base - Data extraction from invoices, receipts and forms - Personalisation engines | Teams stop doing robotic tasks and focus on creative problem-solving. |
| 06 Mobile Experiences | Native-feeling apps for iOS and Android that combine design with solid performance. | Approaches: Cross-platform: mainly React Native, one codebase for both platforms. - PWAs: installable from the browser with no app store. | Capabilities: Offline support with automatic sync - Camera, GPS, FaceID/TouchID and push notifications - Memory management, 60fps animation and low battery use | Mobile experiences that users love to keep on their home screens. |
| 07 Digital Products | Partnering with ambitious brands and funded startups to launch new digital products, from strategy to deployment. | Lifecycle: Strategy and scoping: vision, MVP priorities, technical roadmap. - UI/UX design: wireframes, prototypes, design systems. - Full-cycle engineering: frontend, backend and cloud. | Why partner: Design and engineering stay in sync with no handoff friction - Fast time to market - Foundations that scale so the MVP is not thrown away | From consumer apps to enterprise tools, bold ideas turned into engineered products. |

## 6. Work page

### 6.1 Landing: Healthcare CRM concept

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | Work / Concept preview | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H1 | Healthcare CRM ("CRM" is an accent word, same style) | IN 700 - 72px - ls -0.035em - #f2f0ea |
| Lead | A connected system for the care journey, bringing patient relationships, workflows and analytics together. | IS 500 - 19.4px - #f2f0ea |
| Tags | Custom CRM - Automation - Analytics | IS 400 - 12px - #c9c6bd on outlined pills |
| Disclaimer | Illustrative concept - Not a delivered case study | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Dashboard | Care / OS component | See section 3.6 (Work page column) |

### 6.2 Closing CTA

See section 3.5 (identical on this page).

## 7. Studio page

### 7.1 Landing

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | People / Perspective / Practice | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H1 | The Studio ("Studio" is an accent word, same style) | IN 700 - 72px - ls -0.035em - #f2f0ea |
| Lead | We are a team of engineers, designers, and strategists obsessed with pushing the boundaries of what's possible. | IS 500 - 23px - #f2f0ea |
| Button | Join the team | IS 600 - 14px - #0a0a0a on a white pill |
| Illustration caption | Culture | IS 500 - 12px - UC - ls 0.08em - #a09d94 |
| Illustration | Black-and-white team illustration (inverted, blended onto a dark tile); labelled "The DecaCorpus team at work." for screen readers | image |

### 7.2 Our philosophy (white panel) and How we work

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | Our philosophy | IS 400 - 12px - UC - ls 0.08em - #0a0a0a |
| Large statement | At DecaCorpus, we don't just write code or design interfaces. We engineer holistic systems that scale. | IS 500 - 44px - #0a0a0a |
| Body | True digital transformation needs a deep understanding of business logic, user psychology, and cutting-edge technology. | IS 400 - 19px - #0a0a0a |
| Eyebrow | How we work | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Card titles | Iterative - Radically transparent - Uncompromising on quality | IN 700 - 26px - ls -0.01em - #f2f0ea |
| Card texts | We ship early, learn fast, and refine. / You see the architecture, trade-offs, and progress. / Design and engineering get equal care. | IS 400 - 16px - #c9c6bd |

### 7.3 Closing CTA

See section 3.5 (identical on this page).

## 8. Insights page

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | Ideas / Systems / New perspectives | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H1 | Thinking out loud. ("loud." is an accent word, same style) | IN 700 - 72px - ls -0.035em - #f2f0ea |
| Lead | Notes on the changing relationship between business, design and technology. A preview of the conversations we want to open. | IS 500 - 21px - #f2f0ea |
| Filter buttons | All perspectives (selected: #0a0a0a on cream) - AI - Design | IS 500 - 14px - #c9c6bd, outlined pills |
| Counter | 02 Editorial previews / No articles published yet (becomes 01 Editorial preview / ... when filtered) | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Article cards | Same two cards as Home section 4.10 (captions, meta, titles, texts, photo descriptions) | Same styles as 4.10 |
| Poll eyebrow | Small poll | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Poll question | Which idea should we write up first? | IN 700 - 34px - ls -0.02em - #f2f0ea |
| Poll options | Why Business Software Is Changing - The Death of the Dashboard | IS 500 - 16px - #f2f0ea (voted option: #0a0a0a on cream) |
| Poll hint (before voting) | Your vote stays in this browser. It is a demo, not a survey. | IS 400 - 14px - #9a968a |
| Poll hint (after voting) | Noted. We'll weigh it when we start writing. | IS 400 - 14px - #9a968a |

This page has no closing CTA band.

## 9. Careers page

### 9.1 Landing

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | Careers | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H1 | Good minds. Shared ambition. (second sentence is an accent phrase, same style) | IN 700 - 72px - ls -0.035em - #f2f0ea |
| Lead | We're engineers, designers and strategists building the systems behind ambitious businesses. If that sounds like you, we'd like to know you. | IS 500 - 21px - #f2f0ea |
| Primary button | Write to us | IS 600 - 14px - #0a0a0a on cream |
| Ghost button | Introduce yourself | IS 600 - 14px - #f2f0ea, outlined |

### 9.2 Why DecaCorpus

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 01 / Why DecaCorpus | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | What it's like to work here. | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Card numbers | 01 - 02 - 03 | IS 500 - 12px - ls 0.08em - #9a968a |
| Card titles | Real systems, not just screens - Design and engineering side by side - Open by default | IN 700 - 26px - ls -0.01em - #f2f0ea |
| Card texts | You'll work on software, SaaS, CRM, AI and mobile products, from first idea to launch. / No handoff walls, and both get equal care. / Architecture, trade-offs and decisions are visible to everyone on the team. | IS 400 - 16px - #9a968a |

### 9.3 Areas we hire in

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 02 / Areas we hire in | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H2 | Where you could fit | IN 700 - 58px - ls -0.035em - #f2f0ea |
| Note | Demo roles, shown as placeholders until real openings exist. | IS 400 - 14px - ls 0.04em - #9a968a |
| Role titles | Engineering - Design - Strategy and delivery - AI and automation | IN 700 - 26px - ls -0.01em - #f2f0ea |
| Role texts | Front-end, back-end, full-stack, mobile. / UI/UX, product design, motion. / Product strategy, project leadership. / Workflow and LLM integration. | IS 400 - 16px - #9a968a |
| Role buttons (x4) | Apply (opens an email to careers@decacorpus.com with the role in the subject) | IS 600 - 14px - #0a0a0a on cream |

### 9.4 Open invitation (white panel)

| Element | Content | Style |
| --- | --- | --- |
| H2 | Don't see your role? Write to us anyway. | IN 700 - 58px - ls -0.035em - #0a0a0a |
| Note | This is an open invitation to connect, not a list of confirmed open roles. | IS 400 - 14px - #3b3a36 |
| Email pill | careers@decacorpus.com (arrow) | IS 600 - 16px - #f2f0ea on an ink pill |

## 10. Contact page

### 10.1 Landing

| Element | Content | Style |
| --- | --- | --- |
| Eyebrow | 01 / Contact | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| H1 | Let's make it real. ("real." is an accent word, same style) | IN 700 - 72px - ls -0.035em - #f2f0ea |
| Left heading | A good system starts with a good conversation. | IN 700 - 36px - ls -0.03em - #f2f0ea |
| Email eyebrow | Prefer email? | IS 400 - 12px - UC - ls 0.08em - #9a968a |
| Email link | hello@decacorpus.com | IN 500 - 31.7px - #f2f0ea |

### 10.2 Multi-step form (cream card)

| Element | Content | Style |
| --- | --- | --- |
| Step counter | 01 / 06 ... 06 / 06 | IS 400 - 12px - UC - ls 0.08em - #4b4a44 |
| Question heading | see list below | IN 700 - 36px - ls -0.02em - #0a0a0a |
| Answer field | typed text | IS 500 - 24px - #0a0a0a, underline-only input (placeholder IS 400 - #8a877f) |
| Field label | visually hidden, read by screen readers only | IS 400 - 14px - #0a0a0a |
| Back button | Previous (with a left arrow) | IS 500 - 14px - #4b4a44 |
| Next button | Next (becomes Send on step 6) | IS 600 - 14px - #f2f0ea on an ink pill |
| Finished state heading | Thanks, \[name\]. We'll be in touch. | IN 700 - 34px - ls -0.02em - #0a0a0a |
| Finished state note | This prototype doesn't send messages yet. | IS 400 - 16px - #4b4a44 |

The six questions, with their placeholder text and hidden label:

| Step | Question | Placeholder | Hidden label |
| --- | --- | --- | --- |
| 1 | What is your name? | Enter your name | Your name |
| 2 | Where can we reach you? | you@company.com | Email |
| 3 | Which company are you with? | Company name | Company |
| 4 | What do you want to build? | A product, a platform, a rebuild (pre-filled with the service picked earlier, for example "Website") | Project |
| 5 | When would you like to start? | e.g. next month | Timeline |
| 6 | Anything else we should know? | Optional | Notes |

## 11. Observations from the typography review

- **Instrument Serif is loaded but never shown.** The final override turns every serif accent word into Inter, so the font request can be removed.
- **H1 is fixed at 72 px on every screen size** (an !important rule beats the earlier responsive clamp rules), so on phones the hero title is relatively large.
- **Button labels built from the service name read oddly**: "Start a saas product project", "Start a crm project", "Start a ai or automation project" (lower-casing is applied to the whole label, and "a" is used before a vowel).
- **Hidden text**: the "Keep scrolling / Next: \[page\]" label at the bottom of every page is styled but set to display:none; only its progress bar remains active.
- **Unused copy in the form**: each of the six questions has a helper hint (for example "We'll only use this to reply.") defined in the script, but it is not displayed.
- **No italics anywhere and bold = 700 only on headings**, which keeps the typographic voice consistent across all seven pages.
