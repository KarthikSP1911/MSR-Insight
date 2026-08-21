/**
 * Gates the /api/agent/internal/* routes, which FastAPI calls directly
 * (server-to-server, no proctor session cookie) to execute a confirmed
 * side-effect action. Mirrors the secret FastAPI's own agent router expects
 * on the way in (config.settings.AGENT_GATEWAY_SECRET).
 */
const verifyAgentGatewaySecret = (req, res, next) => {
    const provided = req.headers["x-agent-gateway-secret"];
    const expected = process.env.AGENT_GATEWAY_SECRET;

    if (!expected) {
        return res.status(500).json({ success: false, message: "Agent gateway secret not configured" });
    }
    if (provided !== expected) {
        return res.status(401).json({ success: false, message: "Unauthorized: invalid agent gateway secret" });
    }
    next();
};

export default verifyAgentGatewaySecret;
