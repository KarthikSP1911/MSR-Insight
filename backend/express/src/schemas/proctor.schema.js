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
