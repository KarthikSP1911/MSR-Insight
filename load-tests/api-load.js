// Primary load-test scenario: GET /api/auth/profile (lightweight, authenticated,
// no Puppeteer involved). Run once per concurrency level by run-benchmark.ps1
// via `k6 run api-load.js -e STAGE_VUS=<n> -e STAGE_DURATION=2m`.
//
// See load-tests/README.md for how this fits into the overall benchmark.

import http from "k6/http";
import { check, sleep, fail } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
import {
  BASE_URL,
  PROCTOR_ID,
  PROCTOR_PASSWORD,
  SLO_P95_MS,
  SLO_ERROR_RATE,
} from "./config.js";

const STAGE_VUS = Number(__ENV.STAGE_VUS) || 10;
const STAGE_DURATION = __ENV.STAGE_DURATION || "2m";
const RAMP_DURATION = __ENV.RAMP_DURATION || "30s";

export const options = {
  scenarios: {
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: RAMP_DURATION, target: STAGE_VUS },
        { duration: STAGE_DURATION, target: STAGE_VUS },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: [`rate<${SLO_ERROR_RATE}`],
    http_req_duration: [`p(95)<${SLO_P95_MS}`],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/proctor-login`,
    JSON.stringify({ proctorId: PROCTOR_ID, password: PROCTOR_PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );

  const sessionId = res.json("data.sessionId");
  if (res.status !== 200 || !sessionId) {
    fail(
      `setup() failed to mint a session via proctor-login: status=${res.status} body=${res.body}`
    );
  }
  return { sessionId };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/api/auth/profile`, {
    headers: { "x-session-id": data.sessionId },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "body indicates success": (r) => {
      try {
        return r.json("success") === true;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    [`results/api-load-${STAGE_VUS}vus.json`]: JSON.stringify(
      data,
      null,
      2
    ),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
