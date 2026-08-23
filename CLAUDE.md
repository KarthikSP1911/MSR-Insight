# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

MSR-Insight is a **distributed monolith** with four independently runnable components — do not assume any one of them is the whole picture:

1. **Frontend** (`frontend/`) — Next.js 16 App Router, TypeScript, Tailwind v4. Talks only to Express (never directly to FastAPI, except the RAG/Agentic chat panels which hit Express which proxies to FastAPI).
2. **Express — "Logic Gateway"** (`backend/express/`) — orchestrates business logic, Prisma/PostgreSQL, Redis sessions, Puppeteer scraping/PDF rendering, RabbitMQ producer/consumer, and is the *only* component allowed to call third-party send APIs (Resend, Twilio).
3. **FastAPI — "Intelligence Service"** (`backend/fastapi/`) — Python service for AI remark generation (Groq), the RAG chatbot (Gemini + LangChain + PGVector), and the Agentic AI chatbot (Gemini + LangGraph). Never calls Resend/Twilio directly — it calls back into Express's internal routes to do that.
4. **Chrome Extension** (`_extension/`, Manifest V3) — detects a proctor session in `localStorage` on `localhost:3000` and drives batch re-scrapes via Express.

Data flows through PostgreSQL (Neon, via Prisma in Express; raw `psycopg2`/`psycopg` in FastAPI — **two ORMs, one schema**, see below), Redis (session cache only), RabbitMQ/CloudAMQP (async email PDF jobs), and Cloudinary (PDF archival).

### Two independent chatbots — do not conflate them

The project deliberately runs **two separate LLM-backed chatbots** that never import from each other:

| | RAG Chatbot | Agentic AI Chatbot |
|---|---|---|
| Purpose | Answer questions about student data | Analyze, prioritize, and *act* — with approval |
| Framework | Plain LangChain LCEL chain | LangGraph `StateGraph` (tool-calling loop) |
| Files | `rag_router.py`, `rag_service.py`, `ProctorChatbot.tsx` | `backend/fastapi/agent/**`, `AgentPanel.tsx` |
| Routes | `/api/rag/*` | `/api/agent/*` |
| Auth | None — frontend calls FastAPI directly with a bare `proctor_id` | Session-verified: frontend → Express (`verifyProctorAccess`) → FastAPI (shared secret) |
| Side effects | Read-only | Can send email/WhatsApp, gated by human confirmation |

**When touching one, do not modify the other's files.** This isolation is intentional (see `notes_hr/11-agentic-ai-langgraph.md` for the full rationale) — the RAG chatbot's files must stay untouched by Agentic AI work and vice versa.

### Agentic AI internals (`backend/fastapi/agent/`)

One LangGraph agent dynamically decides which tools a request needs (never four separate bots): at-risk analysis, weekly insights, student lookup/reminders, and parent communication.

- `graph.py` — the `StateGraph`: an `agent` node (Gemini + `bind_tools()`) looping with a `ToolNode` until the model stops requesting tools.
- `service.py` — `chat()`/`confirm()`, both call `graph.invoke(...)` (not `.stream()`).
- `checkpointer.py` — `PostgresSaver`, persists conversation + interrupt state per `thread_id` (`ids.py`: `f"proctor:{proctor_id}"` — one thread per proctor, forever).
- `tools/communication_tools.py` — `send_email`/`send_whatsapp` are the **only** tools that reach outside the system. Each calls `interrupt()` before doing anything real; the graph pauses, hands `{"action_type", "usn", "subject"/"message"}` back to the caller as `status: "pending_confirmation"`, and only resumes (`Command(resume={"approved": bool})`) after the proctor clicks Confirm in `AgentPanel.tsx`. Reject short-circuits before Express is ever called.
- **Authorization is defense-in-depth, not a single trust boundary**: `proctor_id` is bound from the session via `InjectedState`, never LLM-supplied. Every tool touching a specific student independently re-checks `proctor_student_map` ownership — once in the FastAPI tool, again after interrupt-resume, and a *third* time in Express's `/api/agent/internal/*` route before touching parent contact data. When adding a new tool that touches student data, replicate this triple-check pattern rather than trusting an earlier check.
- Every tool call (auto-executed or confirmed) is logged to `agent_action_log` via `tools/logging.py`.
- The two ORMs: Prisma is the schema source of truth (`agent_action_log`/`agent_alerts`/`agent_reminders` live in `schema.prisma`), but the FastAPI agent reads/writes them with raw SQL via its own `psycopg2` helper (`agent/db.py`) — independent of Prisma's generated client and of the RAG chatbot's own DB access code.

### `details` JSONB — the core student data shape

`students.details` (Prisma `Json` column) is the normalized scrape output and is read directly (no ORM model) by report generation, RAG chunking, and Agentic AI tools alike: `{ usn, name, class_details, cgpa, last_updated, subjects: [{code, name, marks, attendance, attendance_details, assessments}], exam_history: [{semester, sgpa, credits_earned, courses}] }`. Proctor remarks live at `details.remarks`. Any new feature reading student data should read this shape rather than re-deriving it from raw scrape output.

### Async report email flow

`POST /api/report/send-email` returns `202` immediately after publishing to `email_reports_queue` (CloudAMQP). A background consumer (`backend/express/src/services/rabbitmq/email.consumer.js`) does the actual Puppeteer PDF render + Cloudinary upload + Resend send, with failures routed to a DLQ. This is distinct from the Agentic AI's `send_email`, which sends plain text synchronously via `sendCustomEmail` (no PDF, no queue) — don't assume the two share a send path.

## Commands

### Run each service (development)

```bash
# FastAPI (Intelligence Service) — backend/fastapi/
uv sync
uv run dev                          # requires .env: GROQ_API_KEY, GEMINI_API_KEY, DATABASE_URL, AGENT_GATEWAY_SECRET

# Express (Logic Gateway) — backend/express/
npm install
npx prisma generate
node prisma/seed.js                 # populates initial proctor data
npm run dev                         # nodemon, requires .env: DATABASE_URL, REDIS_URL, FASTAPI_URL, RABBITMQ_URL, AGENT_GATEWAY_SECRET, PORT=5001

# Frontend — frontend/
npm install
npm run dev                         # requires .env: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_FASTAPI_URL
```

Windows quick-launch for all three: `start-all.bat`.

### Docker (full stack incl. Postgres/PGVector, Redis, RabbitMQ)

```bash
cp .env.example .env                # fill in Groq/Gemini/Resend/Cloudinary keys
docker compose up --build
docker compose down -v              # tear down + volumes
```

### Tests

```bash
# Express — Jest with native ESM (--experimental-vm-modules), 70% coverage threshold (jest.config.js)
cd backend/express
npm run test
npm run test -- --coverage
npm run test -- path/to/file.test.js                 # single file
npm run test -- -t "test name substring"              # single test by name

# FastAPI — Pytest, 70% coverage floor on services+routers (pytest.ini: --cov-fail-under=70)
cd backend/fastapi
uv run python -m pytest --cov=.
uv run python -m pytest tests/test_report_router.py   # single file
uv run python -m pytest tests/test_report_router.py::test_name -v   # single test
```

Both suites mock DB drivers and external APIs (PGVector, Groq, Resend, Twilio) — no test hits a real external service or production database.

### Frontend lint/build

```bash
cd frontend
npm run lint
npm run build
```

## Conventions worth knowing before editing

- **USN and proctor IDs are always uppercase** — comparisons and lookups assume this; don't add case-insensitive fallbacks without checking existing normalization first.
- **Auth is cookie-based** (`HttpOnly`, `Secure`, `SameSite=Strict`, validated against Redis), with a legacy `x-session-id` header fallback for non-browser clients. No JWTs anywhere in the system.
- **`AGENT_GATEWAY_SECRET`** must match between Express and FastAPI `.env` files — it's the shared-secret gate on `/api/agent/internal/*` (Express) and `/api/agent/*` (FastAPI), independent of the cookie/session auth used for browser-facing routes.
- One proctor per student per academic year is enforced at the DB level (`proctor_student_map` has `@@unique([student_id, academic_year])`) — don't bypass this with raw queries when reassigning students.
- LangGraph's own checkpoint tables (`checkpoints`, `checkpoint_writes`, `checkpoint_blobs`) live in the same Postgres instance but are **not** part of the Prisma schema — managed entirely by `langgraph-checkpoint-postgres`.

## Git workflow

Before starting any task that will change code:

1. Run `git status` and `git branch` first. If there are uncommitted changes, stashed work, or other branches with unmerged/in-progress work, **stop and tell the user** what exists before doing anything else — don't silently work around or on top of it.
2. Do the work on a branch, never directly on `main`/`master`. If a branch for this task already exists, use it; otherwise create one from an up-to-date `main`.
3. **Branch naming** (`<type>/<short-kebab-description>`), type from the same set as commits below:
   - `feature/report-pdf-agent-tool`, `fix/agent-thread-reset`, `refactor/report-html-builder`, `chore/update-deps`
4. **Commit at each meaningful step**, not one giant commit at the end — e.g. one commit for the new Express route, another for the FastAPI tool, another for the frontend UI, rather than squashing an entire feature into one commit.
5. **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<optional scope>): <short summary>`, imperative mood, no trailing period, body only when the "why" isn't obvious from the diff.
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`, `build`, `ci`
   - Examples: `feat(agent): add generate_report_pdf tool with remarks toggle`, `fix(agent-panel): reset thread id on new conversation`, `test(report): cover proctor-remarks-omitted PDF path`
6. Never force-push, rebase-interactively, or rewrite history on a shared branch without explicit approval for that specific action.
7. Never delete a branch (local or remote) without the user's explicit confirmation for that specific branch, even after it's merged.
