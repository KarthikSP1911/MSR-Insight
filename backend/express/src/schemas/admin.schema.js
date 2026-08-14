import { z } from "zod";

const usn = z.string().trim().min(1, "USN is required");
const proctorIdParam = z.object({
  proctorId: z.string().trim().min(1, "Proctor ID is required"),
});

export const addProctorSchema = z.object({
  proctorId: z.string().trim().min(1, "Proctor ID is required"),
  password: z.string().min(1, "Password is required"),
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email address").optional(),
});

export const proctorIdParamSchema = proctorIdParam;

export const assignStudentSchema = z.object({
  usn,
  dob: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email address").optional(),
});

export const assignMultipleStudentsSchema = z.object({
  usns: z.array(usn).min(1, "A list of USNs is required"),
  academicYear: z.string().trim().optional(),
});

export const removeStudentParamSchema = z.object({
  proctorId: z.string().trim().min(1, "Proctor ID is required"),
  usn,
});

export const addParentSchema = z.object({
  usn,
  relation: z.enum(["Father", "Mother"], {
    message: "Relation must be 'Father' or 'Mother'",
  }),
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().trim().email("Invalid email address"),
});
