import requireSession, { verifyProctorAccess, verifyStudentAccess } from "./session.middleware.js";

// Alias for shared use across routes
export const verifySession = requireSession;
export { verifyProctorAccess, verifyStudentAccess };
export default requireSession;
