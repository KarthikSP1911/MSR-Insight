import { z } from "zod";

const usn = z.string().trim().min(1, "USN is required");
const proctorId = z.string().trim().min(1, "proctor_id is required");

export const agentChatSchema = z.object({
  message: z.string().trim().min(1, "message is required"),
});

export const agentConfirmSchema = z.object({
  approved: z.boolean(),
  subject: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1).optional(),
});

export const agentInternalSendEmailSchema = z.object({
  proctor_id: proctorId,
  usn,
  subject: z.string().trim().min(1, "subject is required"),
  message: z.string().trim().min(1, "message is required"),
});

export const agentInternalSendWhatsAppSchema = z.object({
  proctor_id: proctorId,
  usn,
  message: z.string().trim().min(1, "message is required"),
});
