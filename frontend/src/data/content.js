// Verbatim data from DecaCorpus_Build_Whats_Next.html (arrays SV, P, AR, Q, SI and the FAQ list).
// Copy is character-for-character: curly quotes, en/em dashes and bullets are intentional.

/* Services: [name, tagline, chipLabel, overview, [group1Title, items], [group2Title, items], pullQuote, keyFeatures, technologies] */
export const SV = [
["Web Development","Modern websites engineered for performance, conversion and scale.","Website","Web development as an end-to-end process of designing, building and maintaining sites and web apps, with a focus on business goals, high-performance architecture and good user experience.",["Core areas",["Front-end: HTML, CSS, JavaScript, React, Next.js, Tailwind.","Back-end: servers, databases and APIs with Node.js, Python, PostgreSQL, MongoDB.","Full-stack: CI/CD, automated testing, observability."]],["Trends",["Headless architecture","UI/UX tied to conversion and accessibility","Core Web Vitals, SEO and mobile-first work","Progressive Web Apps"]],"The digital front door for brand trust, engagement and ROI.",["High Performance","SEO Optimized","Responsive Design","Dynamic Content"],["Next.js","React","TypeScript","Tailwind CSS","Prisma"]],
["Software Development","Custom software systems designed around your unique business processes.","Software","Scalable, secure, maintainable systems that solve complex business problems, fitted to existing operations.",["Core areas",["Enterprise architecture: backends that handle high transaction volumes.","System integration: connecting legacy software and third-party APIs.","Custom workflows: logic built around your business rules."]],["Principles",["Scalability first: clean, modular code","Security by design: encryption, access control at every layer","Agile delivery in iterative cycles"]],"From internal management tools to operational systems, a foundation to scale on.",["Custom Architecture","API Integration","Enterprise Security","Modular Codebase"],["Node.js","Python","PostgreSQL","Redis","Docker","AWS"]],
["SaaS Systems","From MVP to scalable SaaS infrastructure.","SaaS product","SaaS needs multi-tenant architecture, subscription billing, and a strong focus on onboarding and retention.",["Lifecycle",["MVP development: core value first, validated with real users.","Multi-tenant architecture: isolated customer data on one codebase.","Billing: Stripe or Paddle for recurring, usage-based and tiered plans."]],["Components",["Onboarding flows that lower churn","Cloud-native auto-scaling infrastructure","Admin dashboards for system health, users and revenue"]],"Aimed at new products and at companies moving from on-premise to cloud.",["Multi-tenant Architecture","Subscription Billing","Admin Dashboards","Analytics"],["Next.js","Node.js","Stripe","PostgreSQL","AWS"]],
["CRM Systems","Intelligent pipelines and operational networks.","CRM","CRMs as the “central nervous system” of sales and support. A custom CRM is an alternative when Salesforce or HubSpot are too rigid or expensive.",["Why custom",["Perfect fit: matches your pipeline without bloat.","Data ownership: no vendor lock-in.","Cost efficiency: no per-user licence fees as teams grow."]],["Features",["Automated lead routing, stage progression and forecasting","Communication hubs for Gmail/Outlook, VoIP and SMS","Custom reporting dashboards"]],"A CRM that drives sales and retention by removing admin work.",["Custom Pipelines","Email/VoIP Integration","Automated Workflows","Custom Analytics"],["React","Node.js","GraphQL","PostgreSQL","SendGrid/Twilio"]],
["AI & Automation","Intelligent workflows that reduce repetitive work.","AI or automation","AI as a practical tool for operational efficiency: models and automation logic that replace repetitive tasks.",["Capabilities",["LLMs: GPT-4, Claude and open-source models for chatbots, document analysis and content tools.","Workflow automation: API integrations and webhooks.","Predictive analytics: forecasting trends, inventory and customer behaviour."]],["Applications",["Automated customer support from a proprietary knowledge base","Data extraction from invoices, receipts and forms","Personalisation engines"]],"Teams stop doing robotic tasks and focus on creative problem-solving.",["LLM Integration","Workflow Automation","Predictive Modeling","OCR"],["Python","OpenAI API","LangChain","TensorFlow","Node.js"]],
["Mobile Experiences","Native and cross-platform mobile architecture.","Mobile app","Native-feeling apps for iOS and Android that combine design with solid performance.",["Approaches",["Cross-platform: mainly React Native, one codebase for both platforms.","PWAs: installable from the browser with no app store."]],["Capabilities",["Offline support with automatic sync","Camera, GPS, FaceID/TouchID and push notifications","Memory management, 60fps animation and low battery use"]],"Mobile experiences that users love to keep on their home screens.",["Cross-Platform","Offline Support","Push Notifications","Biometrics"],["React Native","Expo","iOS/Swift","Android/Kotlin","Firebase"]],
["Digital Products","End-to-end product design and engineering.","Digital product","Partnering with ambitious brands and funded startups to launch new digital products, from strategy to deployment.",["Lifecycle",["Strategy and scoping: vision, MVP priorities, technical roadmap.","UI/UX design: wireframes, prototypes, design systems.","Full-cycle engineering: frontend, backend and cloud."]],["Why partner",["Design and engineering stay in sync with no handoff friction","Fast time to market","Foundations that scale so the MVP is not thrown away"]],"From consumer apps to enterprise tools, bold ideas turned into engineered products.",["Product Strategy","UI/UX Design","Prototyping","Full-Stack Engineering"],["Figma","React","Next.js","Node.js","Cloud Infrastructure"]]];

/* Process steps: [name, description] */
export const P = [["Idea","Define the problem, the opportunity and what success should mean."],["Structure","Map business logic, user journeys and the system architecture."],["Design","Make complexity understandable through considered interfaces."],["Build","Engineer, integrate and test the product as one connected system."],["Launch","Prepare the release, refine the details and support the handover."],["Evolve","Learn from use and improve the system as the business changes."]];

/* Articles: [title, meta, text, filterKey] */
export const AR = [["Why Business Software Is Changing","AI / 5 min","From rigid tools to adaptive systems: how AI can reshape the way business software understands context and supports decisions.","ai"],["The Death of the Dashboard","Design / 8 min","More charts do not always mean more clarity. A look at interfaces that help people act, rather than simply watch.","design"]];

/* Contact questions: [question, label, placeholder, hint (unused by the prototype), inputType] */
export const Q = [["What is your name?","Your name","Enter your name","What should we call you?","text"],["Where can we reach you?","Email","you@company.com","We’ll only use this to reply.","email"],["Which company are you with?","Company","Company name","Optional if it’s a personal project.","text"],["What do you want to build?","Project","A product, a platform, a rebuild","A sentence is enough.","text"],["When would you like to start?","Timeline","e.g. next month","A rough idea helps.","text"],["Anything else we should know?","Notes","Optional","Share links or context if you like.","text"]];

/* Service icons (inner SVG markup, 24x24 viewBox) */
export const SI = [
'<path d="M3 6h18v12H3z"/><path d="M3 10h18"/><path d="M7 8h.01M10 8h.01"/>',
'<path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m13.5 6-3 12"/>',
'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
'<circle cx="12" cy="8" r="3"/><path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6"/>',
'<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m12 8 1.6 2.4L16 12l-2.4 1.6L12 16l-1.6-2.4L8 12l2.4-1.6z"/>',
'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
'<path d="M12 2.5 20 7v10l-8 4.5L4 17V7z"/><path d="M4 7l8 4.5L20 7M12 11.5v10"/>'];

export const FAQ = [["What does DecaCorpus build?","Websites, custom software, SaaS platforms, CRMs, AI automation, mobile apps and full digital products."],["How does a project run?","In six steps: Idea, Structure, Design, Build, Launch and Evolve."],["Why a custom CRM?","It matches your pipeline without bloat, you own your data with no vendor lock-in, and there are no per-user licence fees as teams grow."],["Are you hiring?","This is an open invitation to connect, not a list of open roles. Write to careers@decacorpus.com."]];

export const ARR = "↗";

export const TECH = [["Frontend", ["React", "Next.js", "Three.js", "GSAP"]], ["Backend", ["Node.js", "Python", "FastAPI", "Prisma"]], ["Infrastructure", ["PostgreSQL", "MongoDB", "AWS", "Docker"]], ["Design", ["Figma", "Blender", "Cinema 4D"]]];

/* Article thumbnails: [src, alt] and photo captions, by card index */
export const IMGS = [["/assets/images/insight-ai.jpg", "Illustration of a code gear connected to machinery gears, a speed gauge and a walking figure"], ["/assets/images/insight-design.jpg", "Illustration of a team meeting where a presenter points to charts on a screen while colleagues discuss around a table"]];
export const CARD_CAPTIONS = ["Intelligence / in context", "Less noise / more signal"];

/* Hero slides: [label, caption, image key or null for the dashboard slide, alt, object-position] */
export const SLI = { sys: "/assets/images/slide-systems.jpg", web: "/assets/images/slide-web.jpg", saas: "/assets/images/slide-saas.jpg", ai: "/assets/images/slide-ai.jpg" };
export const SL = [
  ["Systems, not silos.", "Designed to connect.", "sys", "Team working across connected desks", "50% 50%"],
  ["Healthcare CRM", "Custom CRM, Automation and Analytics.", null],
  ["Web Development", SV[0][1], "web", "Web design and development concept", "50% 50%"],
  ["SaaS Systems", SV[2][1], "saas", "SaaS cloud platform concept", "50% 55%"],
  ["AI & Automation", SV[4][1], "ai", "AI assistant helping a person at a laptop", "50% 40%"],
];

export const T = { home: "DecaCorpus | Build What’s Next.", services: "Services | DecaCorpus", work: "Work | DecaCorpus", studio: "The Studio | DecaCorpus", insights: "Insights | DecaCorpus", careers: "Careers | DecaCorpus", contact: "Contact | DecaCorpus" };
export const NM = { home: "Home", services: "Services", work: "Work", studio: "Studio", insights: "Insights", careers: "Careers", contact: "Contact" };
export const ORD = ["home", "services", "work", "studio", "insights", "careers", "contact"];
export const href = (k) => (k === "home" ? "#/" : "#/" + k);

/* Work projects shown before the Healthcare CRM concept (Work page and Home).
   Copy is drawn from the projects' own code bases in /Work. */
export const WORK = [
  {
    key: "haven",
    eyebrow: "Work / Real estate showcase",
    title: "Haven",
    lead: "A walkable 3D residence. The Oak Mansion is presented room by room, with floor plans that open straight into the model and a first-person tour on web, iOS and Android.",
    tags: ["3D walkthrough", "Floor plans", "iOS & Android"],
    note: "Illustrative residence • Renders are AI-generated",
    img: "/assets/images/work/haven.webp",
    alt: "Haven website hero: The Oak Mansion, a two-storey oak and ivory house at dusk",
    pos: "0% 50%",
    card: "Five bedrooms over two floors, presented as a website and a walkable 3D model.",
  },
  {
    key: "terashoes",
    eyebrow: "Work / 3D commerce",
    title: "TeraShoes",
    lead: "A concept store where every product image is a live 3D render. Six colourways, a scroll-told product story and a full bag-and-checkout flow for the Flux 01 trainer.",
    tags: ["Live 3D product", "E-commerce", "Three.js"],
    note: "Concept store, no real orders • 3D model © 2021 Shopify, CC BY 4.0",
    img: "/assets/images/work/terashoes.webp",
    alt: "TeraShoes store hero: the Flux 01 trainer in amber floating above the brand wordmark",
    pos: "50% 40%",
    card: "A concept store built around a live 3D trainer you can recolour and rotate.",
    link: ["/work/terashoes/index.html", "Explore the store"],
  },
];
