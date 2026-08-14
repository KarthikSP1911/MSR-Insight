import { z } from "zod";

const usn = z.string().trim().min(1, "USN is required");
const dob = z.string().trim().min(1, "Date of Birth is required");

export const registerSchema = z.object({
  usn,
  dob,
});

export const loginSchema = z.object({
  usn,
  dob,
  authType: z.string().trim().optional(),
  last4Digits: z.string().trim().optional(),
  forceResync: z.boolean().optional(),
});

export const proctorRegisterSchema = z.object({
  proctorId: z.string().trim().min(1, "Proctor ID is required"),
  password: z.string().min(1, "Password is required"),
  name: z.string().trim().optional(),
});

export const proctorLoginSchema = z.object({
  proctorId: z.string().trim().min(1, "Proctor ID is required"),
  password: z.string().min(1, "Password is required"),
});
