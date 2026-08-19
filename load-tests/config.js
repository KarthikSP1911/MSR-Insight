// Shared configuration for k6 load-test scripts.
// Override any value via `k6 run -e VAR=value ...` or by exporting the var
// in the shell before invoking run-benchmark.ps1. Defaults match the seeded
// proctor in backend/express/prisma/seed.js so scripts work out of the box.

export const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:5001";
export const PROCTOR_ID = __ENV.K6_PROCTOR_ID || "P000";
export const PROCTOR_PASSWORD = __ENV.K6_PROCTOR_PASSWORD || "password123";

// Seeded student used only by the optional puppeteer-login.js scenario.
export const STUDENT_USN = __ENV.K6_STUDENT_USN || "1ms23is051";
export const STUDENT_DOB = __ENV.K6_STUDENT_DOB || "2004-11-19";

// SLOs used to build k6 thresholds (see README "Test methodology").
export const SLO_P95_MS = Number(__ENV.K6_SLO_P95_MS) || 2000;
export const SLO_ERROR_RATE = Number(__ENV.K6_SLO_ERROR_RATE) || 0.01;
