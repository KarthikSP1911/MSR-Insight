export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
export const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// Must match ADMIN_SECRET_KEY in backend/express/.env (admin.routes.js's
// verifyAdminAccess). NEXT_PUBLIC_* vars are still bundled into client-side
// JS and visible to anyone loading the page -- this only gets the value out
// of hardcoded source and into config, it does not make the admin panel's
// client-side auth model actually secure.
export const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123';
