Here is the complete reference document:

---

# Smart Report Generator — Complete Project Reference

---

## 1. Project Summary

- **System**: An AI-powered academic performance reporting platform for engineering colleges (specifically built around M S Ramaiah Institute of Technology, Bangalore).
- **Problem it solves**: Automates the process of collecting, processing, and presenting student academic data (attendance, CIE marks, CGPA, exam history) — data that must otherwise be manually pulled from a college portal. Generates professional PDF performance reports with AI-written remarks, and emails them to parents.
- **Target users**:
  - **Students** — view their own dashboard (marks, attendance, exam history, AI remarks)
  - **Proctors (Faculty)** — monitor their assigned students, receive attendance alerts, view detailed per-student reports
  - **Admins** — manage the proctor roster and proctor-student assignments

---

## 2. Functional Overview

### Major Features

| Feature | Description |
|---|---|
| Student Login | Auth via USN + Date of Birth (no password) |
| Proctor Login | Auth via Proctor ID + Password (bcrypt) |
| Admin Panel | CRUD for proctors; assign/remove students from proctors |
| Student Dashboard | Full academic view: subjects, attendance, CIE marks, CGPA, exam history, AI remark |
| Proctor Dashboard | Card grid of all assigned proctees with lowest attendance highlight |
| Proctee Details | Deep-dive per student from proctor's view |
| Report Page | A4-formatted printable/downloadable report with editable remarks via Tiptap |
| PDF Email | Generates PDF via Puppeteer, uploads to Cloudinary, sends to parents via Resend |
| Data Scraping | Selenium headless scraper logs into the MSRIT parent portal, collects attendance + CIE + exam history |
| Data Normalization | Converts raw scraped HTML into a clean structured JSON schema |
| AI Remark Generation | Groq `llama-3.1-8b-instant` generates a 2-line academic performance summary |
| Attendance Alerts | Proctor notification inbox flags students with any subject < 75% attendance |
| Session Management | Redis-backed stateless session hybrid with 30-day TTL |

### Entry Points

- **UI**: React SPA at `http://localhost:5173` (default Vite port)
- **Express API**: `http://localhost:5001/api/*`
- **FastAPI**: `http://localhost:8000/api/*`

---

## 3. Codebase Structure

```
Smart-Report-Generator/
├── backend/
│   ├── express/                    # Node.js API Gateway
│   │   ├── server.js               # Entry point — starts Express
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # DB schema (Student, Proctor, Parent, ProctorStudentMap)
│   │   │   └── seed.js             # Initial data seeder
│   │   └── src/
│   │       ├── app.js              # Express app wiring (routes, CORS, error handler)
│   │       ├── config/
│   │       │   ├── db.config.js    # Prisma + pg pool setup
│   │       │   └── redis.config.js # Upstash Redis client
│   │       ├── controllers/
│   │       │   ├── auth.controller.js
│   │       │   ├── admin.controller.js
│   │       │   ├── proctor.controller.js
│   │       │   └── report.controller.js
│   │       ├── middlewares/
│   │       │   ├── session.middleware.js   # Redis session validation
│   │       │   ├── auth.middleware.js      # Re-exports session middleware
│   │       │   └── error.middleware.js     # Global error handler
│   │       ├── repositories/
│   │       │   ├── user.repository.js      # Prisma queries for Student model
│   │       │   └── proctor.repository.js   # Prisma queries for Proctor + Map
│   │       ├── routes/
│   │       │   ├── auth.routes.js
│   │       │   ├── admin.routes.js
│   │       │   ├── proctor.routes.js
│   │       │   ├── report.routes.js
│   │       │   ├── student.routes.js       # /api/students/sync
│   │       │   └── notification.routes.js
│   │       ├── services/
│   │       │   ├── auth.service.js         # Login, register, session logic
│   │       │   ├── report.service.js       # FastAPI proxy (scrape + remark)
│   │       │   ├── studentService.js       # Dashboard reads + JSONB sync
│   │       │   └── email.service.js        # Puppeteer PDF + Resend + Cloudinary
│   │       └── utils/
│   │           └── dateUtils.js            # DOB format normalization
│   │
│   └── fastapi/                    # Python Intelligence Service
│       ├── main.py                 # FastAPI app entry point
│       ├── requirements.txt
│       ├── config/
│       │   └── settings.py         # Pydantic settings from .env
│       ├── models/
│       │   └── request_models.py   # Pydantic request schemas
│       ├── routers/
│       │   └── report_router.py    # /api/scrape and /generate-remark endpoints
│       └── services/
│           ├── scraping_service.py     # Selenium scraper + HTML parser
│           ├── normalization_service.py # Raw data → clean schema
│           ├── sync_service.py          # POST normalized data to Express
│           ├── ai_service.py            # Validates input + calls LLM
│           ├── prompt_builder.py        # Builds structured prompt for Groq
│           └── llm_provider.py          # Groq SDK wrapper
│
└── frontend/                       # React 19 + Vite SPA
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx                # React entry
        ├── App.jsx                 # Router, Navbar, InboxPanel, route definitions
        ├── config/
        │   └── api.config.js       # VITE_API_URL export
        ├── pages/
        │   ├── Home.jsx            # Landing page
        │   ├── StudentLogin.jsx    # USN + DOB login form
        │   ├── StudentDashboard.jsx # Full student view
        │   ├── ProctorLogin.jsx    # Proctor ID + password login
        │   ├── ProctorDashboard.jsx # Proctee card grid
        │   ├── ProcteeDetails.jsx  # Individual student view for proctor
        │   ├── Report.jsx          # A4 report with Tiptap editor + PDF export
        │   ├── AdminPanel.jsx      # Admin CRUD UI
        │   └── SubjectDetail.jsx   # Detailed per-subject view
        └── components/
            ├── CustomDropdown.jsx  # Academic year picker dropdown
            ├── DOBSelector.jsx     # Date of birth input component
            └── Editor.jsx          # Tiptap rich text editor wrapper
```

---

## 4. System Architecture

**Architecture type**: Distributed monolith — three independently runnable services communicating over HTTP.

### Component Interaction (Text Diagram)

```
Browser (React SPA)
       │
       │  HTTP (Axios)  x-session-id header
       ▼
Express API (Port 5001)  ──── Redis (Upstash) ────  [Session Store]
       │                               ▲
       │  HTTP (Axios)                 │ session TTL refresh
       ▼                               │
FastAPI Service (Port 8000)            │
       │                               │
       │  Selenium + requests          │
       ▼                               │
MSRIT Parent Portal (external)         │
       │                               │
       │  POST /api/students/sync      │
       └──────────────────────────────►Express
                                       │
                                       ▼
                               PostgreSQL (Neon)
                                  [students JSONB]
```

### Data Flow

1. **Login flow**: Frontend → Express `/api/auth/login` → Prisma (validate USN+DOB) → Redis (create session) → return `sessionId`
2. **Dashboard load**: Frontend → Express `/api/report/student/:usn` → Prisma (read JSONB) → if empty, trigger FastAPI scrape → return data
3. **Scrape flow**: Express → FastAPI `/api/scrape` → Selenium login → parse HTML → normalize → POST back to Express `/api/students/sync` → Prisma upsert JSONB
4. **AI remark**: Frontend → Express `/api/report/:usn` → FastAPI `/generate-remark` → Groq LLM → return 2-line remark
5. **Email report**: Frontend sends HTML string → Express `/api/report/send-email` → Puppeteer renders PDF → Cloudinary upload → Resend delivers to parents

---

## 5. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19.x |
| Frontend build | Vite | 7.x |
| Frontend routing | React Router DOM | 7.x |
| CSS | Tailwind CSS v4 + Vanilla CSS | 4.2.x |
| Charts | Recharts | 3.x |
| Rich text | Tiptap | 3.x |
| PDF (client-side) | html2pdf.js | 0.14.x |
| HTTP client | Axios | 1.x |
| Icons | Lucide React | 0.577.x |
| API gateway | Express | 4.18.x |
| ORM | Prisma | 7.4.x |
| DB driver | pg (node-postgres) | 8.x |
| Database | PostgreSQL (Neon cloud) | — |
| Session cache | Redis (Upstash, TLS) | redis@4.x |
| Password hashing | bcrypt | 6.x |
| PDF (server-side) | Puppeteer | 22.x |
| Email delivery | Resend | 3.x |
| File/PDF storage | Cloudinary | 1.x |
| Python API | FastAPI + Uvicorn | latest |
| Web scraping | Selenium + ChromeDriver | latest |
| HTML parsing | BeautifulSoup4 | latest |
| LLM provider | Groq SDK (llama-3.1-8b-instant) | latest |
| Config (Python) | pydantic-settings | latest |
| Package manager | npm (Node), pip (Python) | — |
| Dev runner | nodemon (Express), uvicorn --reload (FastAPI) | — |

---

## 6. Key Components Deep Dive

### `scraping_service.py`
- **Responsibility**: Drives Headless Chrome to log into `https://parents.msrit.edu/newparents/`, collect dashboard HTML, then concurrently fetch per-subject attendance and CIE detail pages + exam history page.
- **Input**: `usn: str`, `day: str`, `month: str`, `year: str`
- **Output**: Raw dict `{dashboard: html, attendance: {code: html}, cie: {code: html}, exams: html}`
- **Algorithm**:
  1. Launch headless Chrome (prefers Brave if path exists, falls back to system Chrome)
  2. Fill USN, select DOB dropdowns, click login
  3. Transfer browser cookies to a `requests.Session`
  4. Parse dashboard HTML to extract course codes + attendance/CIE links
  5. Fetch all links concurrently with `ThreadPoolExecutor(max_workers=5)`
  6. Call `parse_and_process_data()` → `DataNormalizer.normalize_student_record()` → `SyncService.sync_to_express()`
- **Risk**: Hardcoded Brave binary path (`/Applications/Brave Browser.app/...`) is macOS-specific; Windows path is commented out. Browser detection is best-effort.

### `normalization_service.py` — `DataNormalizer`
- **Responsibility**: Converts raw scraped data into the canonical subject schema consumed by the frontend and AI service.
- **Input**: Raw scraped record dict with `current_semester` array
- **Output**: Structured dict with `subjects[]`, each containing `{code, name, marks, attendance, attendance_details, assessments[]}`
- **CIE marks formula**: `test_avg = avg(T1, T2)` if both > 0, else `max(T1, T2)`. `total_marks = test_avg + AQ1 + AQ2` (max 50)
- **Assessment standardization**: Regex maps raw test names like "T 1", "A/Q 1" → canonical `T1`, `AQ1`, etc.

### `auth.service.js`
- **Responsibility**: Student and proctor authentication lifecycle, Redis session management.
- **Session format**: `session:<uuid>` → `student:<USN>` or `proctor:<ID>` (30-day TTL = 2,592,000s)
- **Reverse index**: `usn:<USN>` → `<sessionId>` and `proctor:<ID>` → `<sessionId>` (for re-use and cleanup)
- **On student login**: Fires background scrape (`triggerScrape`) via dynamic import — fire-and-forget, errors are swallowed.
- **Proctor login**: Re-uses existing session if one exists (refreshes TTL instead of creating duplicate).

### `session.middleware.js`
- **Responsibility**: Guards protected routes by validating `x-session-id` header against Redis.
- **Attaches to `req`**: `req.user = {usn, role}`, `req.userId`, `req.userRole`
- **Side effect**: Refreshes session TTL on every authenticated request (sliding window).

### `email.service.js`
- **Responsibility**: Full PDF generation and email delivery pipeline.
- **Pipeline**: `htmlContent` string → Puppeteer renders on A4 viewport (794×1123px, scale 2x) → PDF buffer → Cloudinary upload (archival) → Resend API sends email with PDF attachment to each parent.
- **Logo injection**: Reads `frontend/public/logo.png`, converts to base64 Data URI, injects into HTML before rendering.
- **Note**: Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are **not present** in the `.env` file — this will cause Cloudinary upload to fail silently or throw.

### `report.controller.js`
- **`getStudentDashboardReport`**: DB-first — checks Prisma for existing `details` JSONB. If empty/missing, triggers scrape, then re-fetches. Returns `source: "database"` or `source: "scraper"`.
- **`generateReport`**: Fetches from DB, extracts `details.subjects`, POSTs to FastAPI `/generate-remark`.
- **`sendReportViaEmail`**: Accepts `{usn, htmlContent}` from frontend, fetches parent emails from DB, calls `sendReportToAllParents`.

### `proctor.controller.js` — `getNotifications`
- **Logic**: Fetches all students mapped to a proctor, parses their `details` JSONB, extracts `subjects[]`, filters for `attendance < 75`, returns sorted alert list.
- **Double-nesting guard**: Handles both `details.subjects` and `details.details.subjects` (from scraper format inconsistency).
- **Fallback**: Always returns `{ success: true, data: [] }` even on internal error — intentionally non-breaking.

### `AdminPanel.jsx`
- **Responsibility**: Full admin CRUD UI with no route protection on the frontend (unauthenticated access possible to this page).
- **Features**: List proctors with student counts, add/delete proctors, assign/remove students, view unassigned students, overall system stats.

---

## 7. Data Layer

### PostgreSQL Schema (via Prisma)

```
students
  usn           String  @id          -- e.g. "1MS24IS400" (always uppercase)
  name          String
  dob           String?              -- DD-MM-YYYY format
  phone         String?
  email         String?
  current_year  Int
  details       Json                 -- JSONB: entire normalized scraped record

parents
  usn           String               -- FK → students.usn
  relation      String               -- "Father" / "Mother"
  name          String
  phone         String
  email         String
  @@id([usn, relation])

proctors
  proctor_id    String  @id          -- always uppercase
  name          String?
  phone         String?
  email         String?
  password_hash String

proctor_student_map
  id            Int     @id @autoincrement
  proctor_id    String  FK → proctors
  student_id    String  FK → students.usn
  academic_year String               -- e.g. "2027"
  @@unique([student_id, academic_year])   -- one proctor per student per year
```

### `details` JSONB Schema (inside students table)

```json
{
  "usn": "1MS24IS400",
  "name": "Student Name",
  "class_details": "SEM 4 SEC A ...",
  "cgpa": "8.5",
  "last_updated": "2025-04-01 10:00:00",
  "subjects": [
    {
      "code": "22IS45",
      "name": "Operating Systems",
      "marks": 42.5,
      "attendance": 78.0,
      "attendance_details": {
        "present": 45,
        "absent": 12,
        "remaining": 5,
        "percentage": 78,
        "present_dates": ["01-01-2025", ...],
        "absent_dates": ["15-01-2025", ...]
      },
      "assessments": [
        {"type": "T1", "obtained_marks": 22.0, "class_average": 18.5},
        {"type": "T2", "obtained_marks": 20.0, "class_average": 17.0},
        {"type": "AQ1", "obtained_marks": 9.0, "class_average": 8.0}
      ]
    }
  ],
  "exam_history": [
    {
      "semester": "Semester 1 2023-24",
      "sgpa": "8.40",
      "credits_earned": "22",
      "courses": [
        {"code": "22MAT11", "name": "Mathematics", "gpa": "9", "grade": "A+"}
      ]
    }
  ]
}
```

### Redis Key Schema

| Key | Value | TTL |
|---|---|---|
| `session:<uuid>` | `student:<USN>` or `proctor:<ID>` | 30 days |
| `usn:<USN>` | `<sessionId>` | 30 days |
| `proctor:<ID>` | `<sessionId>` | 30 days |

### Storage Systems

- **PostgreSQL (Neon)**: Primary persistent store. All structured + unstructured (JSONB) data.
- **Redis (Upstash)**: Session cache only. TLS-secured (`rediss://`).
- **Cloudinary**: PDF archival storage (partially configured — missing env vars).
- **Local filesystem** (`backend/fastapi/data/`): Legacy JSON files (`all_students_report.json`, `normalized_data.json`) — no longer primary, superseded by direct DB sync.

---

## 8. APIs / Interfaces

### Express API (`http://localhost:5001`)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/register` | None | Register student (USN + DOB) |
| POST | `/api/auth/login` | None | Student login → sessionId |
| POST | `/api/auth/proctor-register` | None | Register proctor |
| POST | `/api/auth/proctor-login` | None | Proctor login → sessionId |
| POST | `/api/auth/logout` | `x-session-id` | Invalidate session |
| GET | `/api/auth/profile` | `x-session-id` | Get session identity |
| GET | `/api/report/student/:usn` | Session | Student dashboard data |
| GET | `/api/report/:usn` | Session | Generate AI remark |
| POST | `/api/report/update` | Session | Trigger re-scrape |
| POST | `/api/report/send-email` | Session | Send PDF report to parents |
| GET | `/api/proctor/:id/dashboard` | Session | Proctor's proctee list |
| GET | `/api/proctor/:id/student/:usn` | Session | Single proctee detail |
| GET | `/api/proctor/:id/notifications` | Session | Attendance alert list |
| GET | `/api/notifications/:id` | Session | Same as above (alt path) |
| POST | `/api/students/sync` | None | Receive normalized data from FastAPI |
| GET | `/api/admin/proctors` | None | List all proctors |
| POST | `/api/admin/proctors` | None | Add proctor |
| DELETE | `/api/admin/proctors/:id` | None | Remove proctor |
| GET | `/api/admin/proctors/:id/students` | None | List proctor's students |
| POST | `/api/admin/proctors/:id/students` | None | Assign student to proctor |
| DELETE | `/api/admin/proctors/:id/students/:usn` | None | Remove student assignment |
| GET | `/api/admin/students/unassigned` | None | Unassigned students |
| GET | `/api/admin/stats` | None | System counts |

**Auth mechanism**: Custom header `x-session-id: <uuid>` validated against Redis. **No JWT**.

### FastAPI (`http://localhost:8000`)

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/` | Root ping |
| POST | `/api/scrape` | Trigger Selenium scrape |
| POST | `/generate-remark` | Generate AI remark from student data blob |

### Frontend Routes

| Path | Component |
|---|---|
| `/` | `Home` |
| `/student-login` | `StudentLogin` |
| `/student/dashboard` | `StudentDashboard` |
| `/report/:usn` | `Report` (student-triggered) |
| `/proctor-login` | `ProctorLogin` |
| `/proctor/:id/dashboard` | `ProctorDashboard` |
| `/proctor/:id/student/:usn` | `ProcteeDetails` |
| `/proctor/:id/report/:usn` | `Report` (proctor-triggered) |
| `/admin` | `AdminPanel` |

---

## 9. Execution Flow

### Student Login → Dashboard

```
1. Student submits USN + DOB on StudentLogin.jsx
2. POST /api/auth/login → auth.controller → auth.service.login()
3. auth.service: findByCredentials(usn, dob) via Prisma
4. If valid: create UUID session → store in Redis (session:uuid → student:USN)
5. Return { usn, sessionId, needsSync }
6. Frontend stores sessionId + usn in localStorage
7. Navigate to /student/dashboard
8. StudentDashboard: GET /api/report/student/:usn  (x-session-id: <sessionId>)
9. session.middleware: validate sessionId in Redis → attach user to req
10. report.controller.getStudentDashboardReport():
    a. Check Prisma for existing JSONB details
    b. If empty → call triggerScrape(usn, dob) → POST to FastAPI /api/scrape
    c. Selenium scrapes MSRIT portal → parse → normalize → POST /api/students/sync
    d. studentService.syncStudents() → Prisma upsert details JSONB
    e. Re-fetch and return data
11. StudentDashboard renders subjects, charts, attendance, exam history
12. User clicks "Generate AI Report" → GET /api/report/:usn
13. report.controller.generateReport() → POST FastAPI /generate-remark
14. Groq llama-3.1-8b-instant generates 2-line remark → return to frontend
```

### Proctor Notification Check

```
1. Proctor lands on /proctor/:id/dashboard
2. App.jsx useEffect detects proctor route
3. Check sessionStorage cache (alerts-<id>-<year>)
4. If miss: GET /api/notifications/:id?academicYear=2027
5. proctor.controller.getNotifications():
   a. Fetch all students in proctor_student_map for this proctor+year
   b. For each student: parse details JSONB → extract subjects
   c. Filter subjects where attendance < 75
   d. Return sorted alert array
6. Frontend flattens grouped data into per-subject alert objects
7. Navbar shows badge count (unique students with alerts)
8. InboxPanel renders grouped alert cards
```

---

## 10. Configuration & Environment

### Express (`backend/express/.env`)

| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `5001` | Express server port |
| `DATABASE_URL` | `postgresql://...neon.tech/...` | Neon PostgreSQL connection string |
| `REDIS_URL` | `rediss://...upstash.io:6379` | Upstash Redis (TLS) |
| `FASTAPI_URL` | `http://127.0.0.1:8000` | FastAPI service base URL |
| `RESEND_API_KEY` | `re_...` | Resend email API key |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Sender email |
| `CLOUDINARY_CLOUD_NAME` | ❌ **Missing** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ❌ **Missing** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ❌ **Missing** | Cloudinary secret |

### FastAPI (`backend/fastapi/.env`)

| Variable | Value | Purpose |
|---|---|---|
| `GROQ_API_KEY` | `gsk_...` | Groq LLM API key |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Model selection |
| `PORT` | `8000` | FastAPI port |
| `EXPRESS_API_URL` | `http://localhost:5001/api/students/sync` | Sync target |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Unused in practice |

### Frontend (`frontend/.env`)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:5001` |
| `VITE_FASTAPI_URL` | `http://localhost:8000` |

### Setup Checklist

```bash
# 1. FastAPI
cd backend/fastapi
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Set GROQ_API_KEY in .env
uvicorn main:app --reload --port 8000

# 2. Express
cd backend/express
npm install
npx prisma generate
node prisma/seed.js          # optional: seed initial proctors
npm run dev                  # nodemon server.js on port 5001

# 3. Frontend
cd frontend
npm install
npm run dev                  # Vite on port 5173

# Or use start-all.bat (Windows) to launch all three in separate terminals
```

---

## 11. Known Issues / Gaps

1. **Cloudinary env vars missing** — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are not in `backend/express/.env`. The Cloudinary upload step in `email.service.js` will fail. The PDF is still generated and emailed — the upload is non-blocking only if wrapped in try/catch, but currently it is `await`ed before sending, so **email sending will also fail**.

2. **`RESEND_FROM_EMAIL` is `onboarding@resend.dev`** — This only works for Resend sandbox mode (sends only to verified addresses). For production, a verified custom domain sender is required.

3. **Brave browser path is macOS-specific** — `scraping_service.py` has the active `BRAVE_PATH` set to `/Applications/Brave Browser.app/...`. On Windows the path is commented out. The fallback to system Chrome works if ChromeDriver is on PATH, but `WebDriver Manager` (`ChromeDriverManager().install()`) is also commented out — `webdriver.Chrome(options=options)` requires ChromeDriver to already be in PATH.

4. **Admin routes have no authentication** — All `/api/admin/*` routes are unprotected. Anyone who knows the endpoint can create/delete proctors.

5. **`/api/auth/proctor-register` is public** — Any user can register a new proctor without any admin token.

6. **`students.js` route (legacy)** — `backend/express/src/routes/students.js` appears to be a duplicate/legacy of `student.routes.js`. Both handle `/api/students/sync`.

7. **`mongoose` in Express dependencies** — `package.json` lists `mongoose ^7.0.0` as a dependency but there is no MongoDB usage anywhere in the codebase. Dead dependency.

8. **React 19 + `@tiptap/react@3.x` compatibility** — Tiptap v3 is in early release; may have edge-case instability.

9. **`studentService.js` sync stores `details: studentData`** — The entire normalized object is stored as-is into the JSONB field. This means `details.usn`, `details.name`, `details.subjects` etc. all exist at the top level of the JSONB. The controller then handles both `details.subjects` and `details.details.subjects` to guard against double-nesting — a fragile pattern.

10. **No test suite** — Zero test files found across the entire project.

11. **`error.txt`** — A 788KB error log file is committed to `backend/express/`. Should be gitignored.

12. **`academicYear` defaults to `"2027"`** — This hardcoded default will be incorrect in most real deployment scenarios.

---

## 12. Assumptions & Uncertainties

- **Portal URL is institution-specific**: The scraper targets `https://parents.msrit.edu/newparents/` — this is not configurable via env. Any institution change requires code modification.
- **DOB format handling**: The system attempts to handle both `DD-MM-YYYY` and `YYYY-MM-DD` in the scrape router, but the student login standardizes to `DD-MM-YYYY` via `formatDOB()`. The contract between layers is not formally enforced.
- **`webdriver_manager`** is in `requirements.txt` indirectly via `selenium` — but the line to use it is commented out. Actual ChromeDriver management is unclear.
- **`redis.config.js`** — Not shown in the file scan but referenced by `auth.service.js` and `session.middleware.js`. Assumed to export an initialized `ioredis` or `redis` v4 client connected via `REDIS_URL`.
- **`dateUtils.js`** — Referenced in `user.repository.js` but file contents not scanned. Assumed to handle normalizing various DOB formats to `DD-MM-YYYY`.
- **Seed data**: `prisma/seed.js` contents not fully read. Assumed to create initial proctor accounts for testing.
- **`SubjectDetail.jsx`** — A page exists for detailed per-subject views but is not registered as a route in `App.jsx`. It may be rendered as a sub-component or is currently inactive.

---

## 13. Extension Points

### Safe to add / modify:
- **New FastAPI routes** (`routers/`) — fully isolated from Express
- **New Express routes** — add route file + wire in `app.js`
- **New frontend pages** — add to `src/pages/` and register in `App.jsx`
- **LLM model swap** — change `GROQ_MODEL` in FastAPI `.env`
- **Email templates** — isolated in `email.service.js`

### Requires care:
- **`details` JSONB schema changes** — Any normalization schema change (`normalization_service.py`) will create inconsistency with existing records in DB. Requires a migration script.
- **Session mechanism** — Changing from `x-session-id` to JWT would require updates in all middleware, frontend Axios calls, and localStorage keys.
- **`academicYear` filter** — Currently hardcoded as `"2027"` default in 5+ places. Should be centralized.
- **Adding route-level auth to admin** — Requires a separate admin session type or a static token middleware.

### Coupling risks:
- FastAPI's `SyncService` is tightly coupled to Express's `/api/students/sync` endpoint URL. If Express changes ports or paths, FastAPI breaks.
- The `details` JSONB field acts as a schema-less contract between Python and Node — both sides must agree on the structure implicitly.

---

## 14. Testing & Validation

- **No automated tests exist** anywhere in the codebase (no `*.test.js`, `*.spec.js`, `test_*.py`, or `pytest` files found).
- **Manual validation files present**:
  - `check_db.js` — Express-side DB connection check script
  - `test_prisma.js` — Prisma client smoke test
  - `verify-implementation.sh` — Shell script for verifying setup
- **Health endpoints**: Both services expose `GET /api/health` for liveness checks.

### Suggested test additions:
- Unit tests for `normalization_service.py` (pure functions with deterministic output)
- Unit tests for `auth.service.js` (mock Redis + Prisma)
- Integration tests for scrape → sync → read cycle
- E2E tests for login → dashboard flow (Playwright or Cypress)

---

## 15. Deployment

### Local (Development)
```bash
# Windows one-shot:
start-all.bat

# Manual:
# Terminal 1: FastAPI
cd backend/fastapi && venv\Scripts\activate && python main.py

# Terminal 2: Express
cd backend/express && node server.js

# Terminal 3: Frontend
cd frontend && npm run dev
```

### Production Considerations
- **Express** → Deploy to Railway / Render / EC2. Set all env vars. Run `npx prisma generate && node server.js`.
- **FastAPI** → Deploy to Render / EC2. Requires Chrome/ChromeDriver installed on the server for Selenium. Use `uvicorn main:app --host 0.0.0.0 --port 8000`.
- **Frontend** → Deploy to Vercel / Netlify. Set `VITE_API_URL` to production Express URL and `VITE_FASTAPI_URL` to production FastAPI URL. Run `npm run build`.
- **Database**: Already cloud-hosted on Neon (PostgreSQL serverless).
- **Redis**: Already cloud-hosted on Upstash.
- **CI/CD**: No pipeline configured. README mentions "Vercel/Render-ready" but no config files (`render.yaml`, `vercel.json`) are present.

---

## Call Graph (Textual)

```
Student Login Request
└── auth.controller.login()
    └── auth.service.login()
        ├── userRepository.findByCredentials()
        │   └── prisma.student.findFirst()
        ├── redisClient.set(session:uuid → student:USN)
        └── triggerScrape() [background, fire-and-forget]
            └── report.service.triggerScrape()
                └── fastApi.post("/api/scrape")
                    └── report_router.trigger_scrape()
                        └── scraping_service.get_complete_student_data()
                            ├── Selenium login
                            ├── parse dashboard HTML
                            └── concurrent fetch (attendance + CIE + exams)
                        └── scraping_service.parse_and_process_data()
                            └── DataNormalizer.normalize_student_record()
                                └── SyncService.sync_to_express()
                                    └── POST /api/students/sync
                                        └── studentService.syncStudents()
                                            └── prisma.student.upsert()

Report + AI Remark Request
└── report.controller.generateReport()
    ├── studentService.getStudentDashboard()
    │   └── prisma.student.findUnique()
    └── report.service.getRemarkByUSN()
        └── fastApi.post("/generate-remark")
            └── report_router.generate_ai_remark()
                └── ai_service.generate_remark()
                    ├── AIService._validate_input()
                    ├── PromptBuilder.build_remark_prompt()
                    └── GroqLLMProvider.generate()
                        └── groq.chat.completions.create()

Email Report Request
└── report.controller.sendReportViaEmail()
    ├── prisma.student.findUnique() [with parents]
    └── email.service.sendReportToAllParents()
        ├── generatePDFFromHTML() → puppeteer
        ├── uploadPDFToCloudinary()
        └── for each parent:
            └── sendReportEmailViaResend() → resend.emails.send()
```

---

*Last analyzed: April 7, 2026. Based on full source scan of Smart-Report-Generator repository.*