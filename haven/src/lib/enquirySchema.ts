import { z } from "zod";

export const PREFERRED_TIMES = [
  "I'm flexible",
  "Weekday morning",
  "Weekday afternoon",
  "Saturday",
] as const;

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your full name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+()\d\s.-]*$/, "Use digits, spaces and + ( ) - only.")
    .optional()
    .or(z.literal("")),
  preferredTime: z.enum(PREFERRED_TIMES),
  message: z.string().trim().max(2000, "Please keep your message under 2,000 characters.").optional().or(z.literal("")),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
