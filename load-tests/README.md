# Load Testing

k6-based load testing and container/Postgres resource monitoring for MSR-Insight,
run against the local `docker compose` stack. Results feed the "Performance & Load
Test Results" section in the repo root `readme.md`.

## Prerequisites

- Docker Desktop running.
- [k6](https://k6.io/) installed: `winget install k6 --source winget` (or `choco install k6`,
  or download from [k6 releases](https://github.com/grafana/k6/releases)).

## What's here

| File | Purpose |
| --- | --- |
| `config.js` | Shared config (base URL, test credentials, SLO thresholds). `__ENV`-overridable. |
| `api-load.js` | Primary scenario: `GET /api/auth/profile` (lightweight, authenticated, no Puppeteer). Run once per concurrency level. |
| `puppeteer-login.js` | Optional, separate, low-VU scenario: `POST /api/auth/login`, which may trigger real Puppeteer scraping. **Not comparable** to `api-load.js` results. |
| `sample-stats.ps1` | Helper functions to sample `docker stats` and Postgres `pg_stat_activity` connection counts on an interval. |
| `run-benchmark.ps1` | Orchestrates the full benchmark: starts the stack, seeds the DB, runs `api-load.js` at each concurrency level with stats sampling, writes `results/summary.csv`. |
| `env.example` | Copy-paste reference for env vars consumed by `config.js`. |

## Running the full benchmark

```powershell
cd load-tests
.\run-benchmark.ps1
```

This will:
1. Verify Docker is running and k6 is installed, record host CPU/RAM.
2. Start the stack (`docker compose up -d --build`) and wait for Express/FastAPI health checks.
3. Seed the database (`npx prisma db seed` inside the express container).
4. Smoke-test `POST /api/auth/proctor-login` + `GET /api/auth/profile`.
5. For each level in 10, 25, 50, 100, 250, 500 VUs: a discarded warm-up run, then a timed
   run (30s ramp + a fixed hold duration), sampling container CPU/RAM and Postgres
   connection counts every 5s throughout, trimming the ramp window when computing averages.
6. Append one row per level to `results/summary.csv` and print a final table.

The rate limiter on `/api/` routes (`backend/express/src/app.js`) is raised for this
process only via `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW_MS` env vars passed into
`docker compose up` — its shipped default (200 req/15min/IP) is designed for many
real client IPs, not a single-IP load generator, and is unaffected in normal usage.

If a level fails (threshold breach, container crash/OOM, or a completely missing
summary), the script logs which level failed and stops advancing to higher levels —
it will not report or imply a higher sustained capacity than was actually measured.

The stack is left running after the benchmark; run `docker compose down` from the
repo root when you're done.

## Running a single level ad hoc

```powershell
k6 run load-tests/api-load.js -e STAGE_VUS=50 -e STAGE_DURATION=1m
```

## Running the optional Puppeteer/login scenario

```powershell
.\run-benchmark.ps1 -IncludePuppeteer
# or standalone:
k6 run load-tests/puppeteer-login.js
```

## Where results go

Raw output lands in `load-tests/results/` (gitignored):
- `api-load-<n>vus.json` — full k6 summary per level (RPS, p50/p95/p99, error rate, etc.)
- `docker-stats-<n>vus.csv` — timestamped container CPU/RAM + Postgres connection samples per level
- `summary.csv` — one row per level, the mechanical rollup of the above two
- `preflight.txt` — host CPU/RAM and run configuration recorded at the start of the run
- `puppeteer-login-summary.json` — optional scenario output, if run

`results/summary.csv` is the source of truth for transcribing numbers into the
"Performance & Load Test Results" table in the repo root `readme.md`. Only numbers
that actually appear in `summary.csv` (or a manual spot-check against `docker stats`)
should ever be written into that README table.
