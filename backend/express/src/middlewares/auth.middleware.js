import requireSession from "./session.middleware.js";

// Alias for shared use across routes
export const verifySession = requireSession;
export default requireSession;
