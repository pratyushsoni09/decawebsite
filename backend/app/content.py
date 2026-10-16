"""Site content, generated verbatim from the prototype's data arrays.

Source: app/data/content.json, produced by `node scripts/export_content.mjs` from
frontend/src/data/content.js, so the API and the site always serve identical copy.
"""
import json
from pathlib import Path

CONTENT = json.loads((Path(__file__).parent / "data" / "content.json").read_text(encoding="utf-8"))

SERVICES = CONTENT["services"]
PROCESS_STEPS = CONTENT["process_steps"]
ARTICLES = CONTENT["articles"]
FAQ = CONTENT["faq"]
CAREER_ROLES = CONTENT["career_roles"]
CONTACT_QUESTIONS = CONTENT["contact_questions"]
