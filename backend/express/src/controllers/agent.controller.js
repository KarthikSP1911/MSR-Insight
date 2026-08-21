import axios from "axios";
import prisma from "../config/db.config.js";
import { sendCustomEmail } from "../services/email.service.js";
import { sendTwilioWhatsAppMessage } from "../services/whatsapp.service.js";
import logger from "../utils/logger.js";

const FASTAPI_INTERNAL_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const AGENT_GATEWAY_SECRET = process.env.AGENT_GATEWAY_SECRET;

const fastapiHeaders = () => ({ "x-agent-gateway-secret": AGENT_GATEWAY_SECRET });

/**
 * Verifies the usn belongs to the proctor before any parent contact data is
 * touched -- defense in depth alongside the same check already done inside
 * the FastAPI tool that requested this action.
 */
const assertProctorOwnsStudent = async (proctorId, usn) => {
    const mapping = await prisma.proctorStudentMap.findFirst({
        where: { proctor_id: proctorId, student_id: usn },
    });
    if (!mapping) {
        const err = new Error(`${usn} is not assigned to proctor ${proctorId}`);
        err.statusCode = 403;
        throw err;
    }
};

/**
 * Proxies a chat message to the FastAPI Agentic AI graph. Session auth for
 * this route is already enforced by verifyProctorAccess (see agent.routes.js);
 * FastAPI trusts the proctor_id we send because we've already verified it.
 */
export const chatWithAgent = async (req, res, next) => {
    try {
        const proctorId = req.params.proctorId;
        const { message } = req.body;

        const response = await axios.post(
            `${FASTAPI_INTERNAL_URL}/api/agent/chat`,
            { proctor_id: proctorId, message },
            { headers: fastapiHeaders() },
        );

        return res.status(200).json({ success: true, ...response.data });
    } catch (error) {
        logger.error(`[Agent] chat proxy failed: ${error.message}`);
        return res.status(502).json({ success: false, message: "Agent service unavailable" });
    }
};

/**
 * Resumes a paused agent action (confirm or reject a pending send_email /
 * send_whatsapp call) via FastAPI's /api/agent/confirm.
 */
export const confirmAgentAction = async (req, res, next) => {
    try {
        const proctorId = req.params.proctorId;
        const { approved } = req.body;

        const response = await axios.post(
            `${FASTAPI_INTERNAL_URL}/api/agent/confirm`,
            { proctor_id: proctorId, approved },
            { headers: fastapiHeaders() },
        );

        return res.status(200).json({ success: true, ...response.data });
    } catch (error) {
        logger.error(`[Agent] confirm proxy failed: ${error.message}`);
        return res.status(502).json({ success: false, message: "Agent service unavailable" });
    }
};

/** Recent action/audit log entries for this proctor, for the panel's activity feed. */
export const getAgentActions = async (req, res, next) => {
    try {
        const proctorId = req.params.proctorId;
        const actions = await prisma.agentActionLog.findMany({
            where: { proctor_id: proctorId },
            orderBy: { created_at: "desc" },
            take: 50,
        });
        return res.status(200).json({ success: true, data: actions });
    } catch (error) {
        next(error);
    }
};

/** Unresolved at-risk alerts for this proctor, for the panel's alert feed + navbar badge. */
export const getAgentAlerts = async (req, res, next) => {
    try {
        const proctorId = req.params.proctorId;
        const alerts = await prisma.agentAlert.findMany({
            where: { proctor_id: proctorId, resolved: false },
            orderBy: { created_at: "desc" },
        });
        return res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        next(error);
    }
};

/**
 * Internal endpoint (shared-secret gated, no session): FastAPI calls this
 * after the proctor has confirmed a send_email action.
 */
export const sendAgentEmailInternal = async (req, res, next) => {
    try {
        const { proctor_id, usn, subject, message } = req.body;
        await assertProctorOwnsStudent(proctor_id, usn);

        const parents = await prisma.parent.findMany({ where: { usn } });
        const withEmail = parents.filter((p) => p.email);

        if (withEmail.length === 0) {
            return res.status(200).json({ success: true, sent: 0, message: "No parent email on file for this student." });
        }

        const results = [];
        for (const parent of withEmail) {
            try {
                const result = await sendCustomEmail(parent.email, subject, message);
                results.push({ parentEmail: parent.email, status: "success", messageId: result.id });
            } catch (error) {
                results.push({ parentEmail: parent.email, status: "failed", error: error.message });
            }
        }

        return res.status(200).json({ success: true, sent: results.filter(r => r.status === "success").length, results });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ success: false, message: error.message });
    }
};

/**
 * Internal endpoint (shared-secret gated, no session): FastAPI calls this
 * after the proctor has confirmed a send_whatsapp action.
 */
export const sendAgentWhatsAppInternal = async (req, res, next) => {
    try {
        const { proctor_id, usn, message } = req.body;
        await assertProctorOwnsStudent(proctor_id, usn);

        const parents = await prisma.parent.findMany({ where: { usn } });
        const withPhone = parents.filter((p) => p.phone);

        if (withPhone.length === 0) {
            return res.status(200).json({ success: true, sent: 0, message: "No parent phone number on file for this student." });
        }

        const isTwilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
        const results = [];
        for (const parent of withPhone) {
            if (!isTwilioConfigured) {
                results.push({ parentPhone: parent.phone, status: "not_configured", message: "Twilio is not configured; message was not sent." });
                continue;
            }
            try {
                const result = await sendTwilioWhatsAppMessage(parent.phone, message);
                results.push({ parentPhone: parent.phone, status: "success", messageId: result.sid });
            } catch (error) {
                results.push({ parentPhone: parent.phone, status: "failed", error: error.message });
            }
        }

        return res.status(200).json({ success: true, sent: results.filter(r => r.status === "success").length, results });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ success: false, message: error.message });
    }
};
