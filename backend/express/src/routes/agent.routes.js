import { Router } from "express";
import {
    chatWithAgent,
    confirmAgentAction,
    getAgentActions,
    getAgentAlerts,
    sendAgentEmailInternal,
    sendAgentWhatsAppInternal,
} from "../controllers/agent.controller.js";
import { verifyProctorAccess } from "../middlewares/auth.middleware.js";
import verifyAgentGatewaySecret from "../middlewares/agentGatewaySecret.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
    agentChatSchema,
    agentConfirmSchema,
    agentInternalSendEmailSchema,
    agentInternalSendWhatsAppSchema,
} from "../schemas/agent.schema.js";

const router = Router();

// Internal: called only by FastAPI after a proctor has confirmed a side-effect
// action. No proctor session -- gated by a shared secret instead. Registered
// under an explicit literal path, and before the proctor routes' blanket
// verifyProctorAccess below, so these requests never pass through session auth
// (a `/:proctorId/chat`-style route registered first would otherwise also
// match `/internal/send-email` with proctorId="internal").
router.post("/internal/send-email", verifyAgentGatewaySecret, validate(agentInternalSendEmailSchema), sendAgentEmailInternal);
router.post("/internal/send-whatsapp", verifyAgentGatewaySecret, validate(agentInternalSendWhatsAppSchema), sendAgentWhatsAppInternal);

// Proctor-facing: session-gated, same pattern as proctor.routes.js.
router.use(verifyProctorAccess);
router.post("/:proctorId/chat", validate(agentChatSchema), chatWithAgent);
router.post("/:proctorId/confirm", validate(agentConfirmSchema), confirmAgentAction);
router.get("/:proctorId/actions", getAgentActions);
router.get("/:proctorId/alerts", getAgentAlerts);

export default router;
