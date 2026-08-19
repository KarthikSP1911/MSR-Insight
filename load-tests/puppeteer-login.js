// OPTIONAL / SEPARATE SCENARIO.
//
// Exercises POST /api/auth/login for a seeded student. Unless that student
// already has a cached PIN and fully-synced details, this triggers a REAL
// Puppeteer-driven scrape of the external college portal
// (backend/express/src/services/puppeteerScraper.service.js).
//
// Results from this script are NOT comparable to api-load.js and must NOT be
// merged into the main capacity table/conclusion in readme.md. Puppeteer's
// resource cost is heavy and highly variable, and depends on an external
// service outside this repo's control. Run at very low concurrency only.

import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
import { BASE_URL, STUDENT_USN, STUDENT_DOB } from "./config.js";

export const options = {
  scenarios: {
    puppeteerLogin: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 1 },
        { duration: "1m", target: 5 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  // No strict thresholds here on purpose: this path's latency/error profile
  // depends on an external portal and is expected to differ wildly from the
  // API benchmark. We still record everything k6 measures.
};

export default function () {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ usn: STUDENT_USN, dob: STUDENT_DOB }),
    { headers: { "Content-Type": "application/json" } }
  );

  // Lenient checks: 200 (full login) or a secondary-auth/PIN-required
  // response are both "the endpoint behaved", not a hard failure.
  check(res, {
    "status is 200 or requires secondary auth": (r) =>
      r.status === 200 || r.status === 202 || r.status === 401,
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    "results/puppeteer-login-summary.json": JSON.stringify(
      data,
      null,
      2
    ),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
