import { z } from "zod";

const usn = z.string().trim().min(1, "USN is required");

export const triggerReportUpdateSchema = z.object({
  usn,
});

export const sendReportViaEmailSchema = z.object({
  usn,
  htmlContent: z.string().min(1, "HTML report content is required"),
});

export const sendReportViaWhatsAppSchema = sendReportViaEmailSchema;

export const usnParamSchema = z.object({
  usn,
});
