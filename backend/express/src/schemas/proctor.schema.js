import { z } from "zod";

export const proctorDashboardParamsSchema = z.object({
  proctorId: z.string().trim().min(1, "Proctor ID is required"),
});

export const procteeParamsSchema = z.object({
  proctorId: z.string().trim().min(1, "Proctor ID is required"),
  studentUsn: z.string().trim().min(1, "Student USN is required"),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  academicYear: z.string().trim().optional(),
});

export const batchZipSchema = z.object({
  usns: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one student")
    .max(50, "Select at most 50 students per batch"),
});
