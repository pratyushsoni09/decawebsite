// Regenerates backend/app/data/content.json from the frontend's verbatim data module,
// so the API and the site serve identical copy. Run: node scripts/export_content.mjs
import { writeFileSync } from "node:fs";

globalThis.matchMedia ??= () => ({ matches: false });
const { SV, P, AR, Q, FAQ, IMGS, CARD_CAPTIONS } = await import("../frontend/src/data/content.js");

const roles = [
  ["Engineering", "Front-end, back-end, full-stack, mobile."],
  ["Design", "UI/UX, product design, motion."],
  ["Strategy and delivery", "Product strategy, project leadership."],
  ["AI and automation", "Workflow and LLM integration."],
];

const content = {
  services: SV.map((s, i) => ({
    id: i + 1, name: s[0], short_line: s[1], chip_label: s[2], overview: s[3],
    lists: [{ list_no: 1, heading: s[4][0], items: s[4][1] }, { list_no: 2, heading: s[5][0], items: s[5][1] }],
    pull_quote: s[6], key_features: s[7], technologies: s[8],
  })),
  process_steps: P.map((p, i) => ({ id: i + 1, name: p[0], description: p[1] })),
  articles: AR.map((a, i) => ({
    id: i + 1, title: a[0], meta: a[1], excerpt: a[2], filter_key: a[3],
    card_label: CARD_CAPTIONS[i], image_file: IMGS[i][0], image_alt: IMGS[i][1],
  })),
  faq: FAQ.map((f, i) => ({ id: i + 1, question: f[0], answer: f[1] })),
  career_roles: roles.map((r, i) => ({
    id: i + 1, title: r[0], description: r[1],
    apply_href: "mailto:careers@decacorpus.com?subject=" + encodeURIComponent("Interest in " + r[0]),
  })),
  contact_questions: Q.map((q, i) => ({ step: i + 1, question: q[0], label: q[1], placeholder: q[2], hint: q[3], input_type: q[4] })),
};

writeFileSync(new URL("../backend/app/data/content.json", import.meta.url), JSON.stringify(content, null, 2) + "\n");
console.log("wrote content.json:", Object.fromEntries(Object.entries(content).map(([k, v]) => [k, v.length])));
