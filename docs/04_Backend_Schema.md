# DecaCorpus Website — Backend & Database Schema

Section numbers (§) in this document refer to the numbering of `Report_DecaCorpus_Prototype_Extraction.md`. Text taken from the report is reproduced without change.

**Scope:** company website — **no users, no login, no roles/permissions tables.** All tables hold data that the report itself lists or that the prototype simulates (§1, §8.5, §8.7, §9, §13).
**Database:** PostgreSQL (listed in the report's technology section; confirm). Types below are plain SQL.

## 1. What is stored and where it comes from

| Table | Holds | Report source |
|---|---|---|
| `services` | The 7 services (`SV`), including the unused extra copy (`EX`) | §9.1 |
| `service_lists` | Two headed lists per service (`SV[n][4]`, `SV[n][5]`) | §9.1 |
| `service_list_items` | The bullets of each list | §9.1 |
| `service_tags` | "Key features" and "Technologies" tags per service | §9.1 |
| `process_steps` | The 6 process steps (`P`) | §9.2 |
| `articles` | The 2 articles (`AR`) | §9.3 |
| `faq_items` | The 4 FAQ questions and answers | §8.1 block 11 |
| `career_roles` | The 4 role cards with Apply links | §8.6 |
| `form_questions` | The 6 contact-wizard steps (`Q`) | §8.7 |
| `contact_submissions` | The answers a visitor sends | §8.7 |
| `poll_votes` | Votes for one of the two articles | §8.5, §13 |

**Not modelled** (kept in the frontend, as in the prototype): hero slides (§8.1), tech marquee lists (§8.1 block 8), navigation and footer links (§6.3, §6.12), CRM dashboard sample data (§8.3.1), page copy outside the tables above, and the browser-side keys `dc_pick` and `dc_poll` (§13).

## 2. DDL

```sql
-- ===== services (SV / EX) — report §9.1 =====
CREATE TABLE services (
  id          smallint PRIMARY KEY,            -- 1..7  ("Service 01".."Service 07")
  name        text NOT NULL,                   -- SV[n][0]
  short_line  text NOT NULL,                   -- SV[n][1]  card subtitle / slide caption
  chip_label  text NOT NULL,                   -- SV[n][2]  "Made around you" chip
  overview    text NOT NULL,                   -- SV[n][3]
  pull_quote  text NOT NULL,                   -- SV[n][6]
  extra_copy  text,                            -- EX[n] first line  (defined, not rendered in the prototype)
  extra_tags  text                             -- EX[n] italic line (defined, not rendered in the prototype)
);

-- two headed lists per service: SV[n][4] and SV[n][5]
CREATE TABLE service_lists (
  id          serial PRIMARY KEY,
  service_id  smallint NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  list_no     smallint NOT NULL CHECK (list_no IN (1, 2)),
  heading     text NOT NULL,                   -- e.g. "Core areas", "Trends"
  UNIQUE (service_id, list_no)
);

CREATE TABLE service_list_items (
  id        serial PRIMARY KEY,
  list_id   integer NOT NULL REFERENCES service_lists(id) ON DELETE CASCADE,
  position  smallint NOT NULL,
  text      text NOT NULL,                     -- stored whole; "Label: text" split is a rendering rule (§6.13)
  UNIQUE (list_id, position)
);

CREATE TABLE service_tags (
  id          serial PRIMARY KEY,
  service_id  smallint NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('feature', 'technology')),  -- SV[n][7] / SV[n][8]
  position    smallint NOT NULL,
  text        text NOT NULL,
  UNIQUE (service_id, kind, position)
);

-- ===== process steps (P) — report §9.2 =====
CREATE TABLE process_steps (
  id           smallint PRIMARY KEY,           -- 1..6
  name         text NOT NULL,                  -- Idea, Structure, Design, Build, Launch, Evolve
  description  text NOT NULL
);

-- ===== articles (AR) — report §9.3 =====
CREATE TABLE articles (
  id              smallint PRIMARY KEY,        -- 1..2
  title           text NOT NULL,
  meta            text NOT NULL,               -- "AI / 5 min"
  excerpt         text NOT NULL,
  filter_key      text NOT NULL,               -- 'ai' | 'design'
  card_label      text NOT NULL,               -- "Intelligence / in context"
  image_file      text NOT NULL,               -- insight-card-1-ai.jpg
  image_alt       text NOT NULL,
  image_position  text NOT NULL                -- object-position: '50% 42%' / '50% 24%'
);

-- ===== FAQ — report §8.1 block 11 =====
CREATE TABLE faq_items (
  id        smallint PRIMARY KEY,
  question  text NOT NULL,
  answer    text NOT NULL
);

-- ===== career role cards — report §8.6 =====
CREATE TABLE career_roles (
  id           smallint PRIMARY KEY,
  title        text NOT NULL,                  -- Engineering, Design, Strategy and delivery, AI and automation
  description  text NOT NULL,
  apply_href   text NOT NULL                   -- mailto:careers@decacorpus.com?subject=...
);

-- ===== contact wizard questions (Q) — report §8.7 =====
CREATE TABLE form_questions (
  step         smallint PRIMARY KEY,           -- 1..6
  question     text NOT NULL,                  -- h3
  label        text NOT NULL,                  -- visually hidden label
  placeholder  text NOT NULL,
  hint         text NOT NULL,                  -- in the data, not rendered in the prototype
  input_type   text NOT NULL                   -- 'text' | 'email'
);

-- ===== contact submissions — report §8.7 =====
-- The prototype has no validation (form is novalidate) and a missing name is a valid state
-- ("Thanks. We'll be in touch."), so the answer columns are nullable. Validation rules are not defined in the report.
CREATE TABLE contact_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,        -- step 1  What is your name?
  email       text,        -- step 2  Where can we reach you?
  company     text,        -- step 3  Which company are you with?
  project     text,        -- step 4  What do you want to build?  (pre-filled with the service chosen on Home)
  timeline    text,        -- step 5  When would you like to start?
  notes       text,        -- step 6  Anything else we should know?
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ===== poll votes — report §8.5 =====
CREATE TABLE poll_votes (
  id          bigserial PRIMARY KEY,
  article_id  smallint NOT NULL REFERENCES articles(id),   -- the two answers are the two article titles
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

## 3. Field mapping for the contact wizard (report §8.7)

| Step | Question | Column | Input type |
|---|---|---|---|
| 01 / 06 | What is your name? | `name` | text |
| 02 / 06 | Where can we reach you? | `email` | email |
| 03 / 06 | Which company are you with? | `company` | text |
| 04 / 06 | What do you want to build? | `project` | text |
| 05 / 06 | When would you like to start? | `timeline` | text |
| 06 / 06 | Anything else we should know? | `notes` | text |

## 4. Mapping of the service array indexes (report §9.1)

| Array index | Column / table |
|---|---|
| `SV[n][0]` | `services.name` |
| `SV[n][1]` | `services.short_line` |
| `SV[n][2]` | `services.chip_label` |
| `SV[n][3]` | `services.overview` |
| `SV[n][4]` | `service_lists` (`list_no` = 1) + `service_list_items` |
| `SV[n][5]` | `service_lists` (`list_no` = 2) + `service_list_items` |
| `SV[n][6]` | `services.pull_quote` |
| `SV[n][7]` | `service_tags` (`kind` = 'feature') |
| `SV[n][8]` | `service_tags` (`kind` = 'technology') |
| `EX[n]` | `services.extra_copy`, `services.extra_tags` |

---

## Source data to load (report §9, unchanged)

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
