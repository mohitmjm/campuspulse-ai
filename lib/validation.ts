import { z } from "zod";
import { BRANCHES, CHANNELS } from "./campaign";

export function normalizeEmail(email: string) {
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!domain) return email.trim().toLowerCase();
  // Gmail ignores dots and +tags, so p.sharma+ai@gmail.com is the same inbox as psharma@gmail.com.
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
  }
  return `${local.split("+")[0]}@${domain}`;
}

export const REF_CODE = /^[A-Z0-9]{4,12}$/;

export function normalizeRefCode(raw: unknown) {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return REF_CODE.test(code) ? code : null;
}

const name = z.string().trim().min(2, "Enter your full name").max(80).regex(/^[\p{L} .'-]+$/u, "Use letters only");
const email = z.string().trim().email("Enter a valid email").max(120);
const college = z.string().trim().min(3, "Enter your college").max(120);

const thisYear = new Date().getFullYear();

export const registrationSchema = z.object({
  name,
  email,
  college,
  branch: z.enum(BRANCHES as [string, ...string[]], { errorMap: () => ({ message: "Choose your branch" }) }),
  gradYear: z.coerce.number().int().min(thisYear - 1, "Graduation year looks too early").max(thisYear + 2, "This workshop is for final-year students"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number").optional().or(z.literal("").transform(() => undefined)),
  experience: z.enum(["none", "some", "built"]).optional(),
  goal: z.string().trim().max(200).optional(),
  ref: z.string().optional(),
  channel: z.enum(CHANNELS).optional(),
  messageVariant: z.enum(["placement", "generic"]).optional(),
  formVariant: z.enum(["short", "long"]).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept to continue" }) }),
  // Honeypot: real users never see this field.
  website: z.string().max(0).optional(),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const ambassadorSchema = z.object({
  name,
  email,
  college,
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept to continue" }) }),
  website: z.string().max(0).optional(),
});

export const eventSchema = z.object({
  type: z.enum(["page_view", "form_start", "form_submit", "share_click"]),
  sessionId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  channel: z.enum(CHANNELS).optional(),
  messageVariant: z.enum(["placement", "generic"]).optional(),
  formVariant: z.enum(["short", "long"]).optional(),
  referralCode: z.string().optional(),
});
