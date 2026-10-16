# DecaCorpus website

A React + FastAPI rebuild of the prototype `DecaCorpus_Build_Whats_Next.html`, which is the source of truth. The gap analysis, decisions and plan are in [docs/06_Gap_Analysis_and_Plan.md](docs/06_Gap_Analysis_and_Plan.md).

## Run it

Frontend (http://localhost:5173):

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Backend (http://localhost:8000, docs at `/docs`). The frontend proxies `/api` to it. The site renders fully without it; only contact submissions and poll votes are sent there.

```bash
pip install -r backend/requirements.txt
python -m uvicorn main:app --app-dir backend --port 8000
```

Backend tests:

```bash
pip install -r backend/requirements-dev.txt
python -m pytest backend
```

## How the frontend stays a replica

- `frontend/src/styles/prototype.css` is the prototype's stylesheet **copied verbatim, in its original order**. It is made of about 45 patch layers where later rules override earlier ones, so do not reorder or "clean up" it. It is the only stylesheet.
- The components render the same DOM structure and class names as the prototype's page templates, so that stylesheet applies unchanged. Behaviour (loader, canvas, curtain, reveals, slideshow, drawer, process, wizard and so on) is ported from the prototype script in `lib/`, `components/` and `pages/`.
- `frontend/src/data/content.js` holds the prototype's data arrays, copied character for character (curly quotes, dashes and bullets included).
- The only runtime dependency besides React is `lenis@1.1.20`, the same smooth-scroll library and version the prototype loads.
- Visible prototype quirks are replicated on purpose (for example "Start a saas product project"). Part D of the plan lists them, with optional fixes.

## Backend

There is no database (project decision). Contact submissions and poll votes are appended to `backend/data/*.jsonl` (git-ignored). Content endpoints serve `backend/app/data/content.json`. After editing `content.js`, regenerate that file:

```bash
node scripts/export_content.mjs
```

Endpoints: `GET /api/services`, `/api/services/{1-7}`, `/api/process-steps`, `/api/articles?filter=ai|design`, `/api/faq`, `/api/career-roles`, `/api/contact-questions`; `POST /api/contact-submissions`, `/api/poll-votes` (`{"option_index": 0|1}`).
