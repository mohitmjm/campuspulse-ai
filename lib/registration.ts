import { Prisma, type PrismaClient } from "@prisma/client";
import { ambassadorCode, confirmationId } from "./ids";
import { normalizeEmail, normalizeRefCode, type RegistrationInput } from "./validation";
import type { Channel } from "./campaign";

export type RegisterResult =
  | { status: "created"; confirmationId: string; ambassadorName: string | null; referralIgnored: boolean }
  | { status: "duplicate" };

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/**
 * Creates a registration. Attribution rules:
 * - A valid, known ambassador code attributes the registration to that ambassador (default channel: whatsapp).
 * - Unknown codes are dropped (the student still registers) and reported via `referralIgnored`.
 * - The same normalized email can only register once, so a referral can never be double-counted.
 */
export async function registerStudent(db: PrismaClient, input: RegistrationInput, opts: { isDemo?: boolean } = {}): Promise<RegisterResult> {
  const isDemo = opts.isDemo ?? false;
  const emailNorm = normalizeEmail(input.email);

  const existing = await db.registration.findUnique({ where: { emailNorm_isDemo: { emailNorm, isDemo } }, select: { id: true } });
  if (existing) return { status: "duplicate" };

  const code = normalizeRefCode(input.ref);
  const ambassador = code ? await db.ambassador.findFirst({ where: { code, isDemo } }) : null;
  const channel: Channel = input.channel ?? (ambassador ? "whatsapp" : "direct");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const reg = await db.registration.create({
        data: {
          confirmationId: confirmationId(),
          name: input.name,
          email: input.email.trim(),
          emailNorm,
          phone: input.phone ?? null,
          college: input.college,
          branch: input.branch,
          gradYear: input.gradYear,
          experience: input.experience ?? null,
          goal: input.goal ?? null,
          channel,
          messageVariant: input.messageVariant ?? null,
          formVariant: input.formVariant ?? null,
          referralCode: ambassador ? ambassador.code : null,
          ambassadorId: ambassador?.id ?? null,
          isDemo,
        },
      });
      return { status: "created", confirmationId: reg.confirmationId, ambassadorName: ambassador?.name ?? null, referralIgnored: !!input.ref && !ambassador };
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      // Either a concurrent duplicate email or (rarely) a confirmation-ID collision; re-check which.
      const dup = await db.registration.findUnique({ where: { emailNorm_isDemo: { emailNorm, isDemo } }, select: { id: true } });
      if (dup) return { status: "duplicate" };
    }
  }
  throw new Error("Could not allocate a confirmation ID");
}

export async function onboardAmbassador(db: PrismaClient, input: { name: string; email: string; college: string }) {
  const emailNorm = normalizeEmail(input.email);
  const existing = await db.ambassador.findUnique({ where: { emailNorm_isDemo: { emailNorm, isDemo: false } } });
  if (existing) return { code: existing.code, existing: true };

  // Alternate cohorts for Growth Test 2 so both arms stay balanced.
  const count = await db.ambassador.count({ where: { isDemo: false } });
  const cohort = count % 2 === 0 ? "leaderboard" : "control";

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const a = await db.ambassador.create({
        data: { name: input.name, email: input.email.trim(), emailNorm, college: input.college, code: ambassadorCode(input.name), cohort },
      });
      return { code: a.code, existing: false };
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      const dup = await db.ambassador.findUnique({ where: { emailNorm_isDemo: { emailNorm, isDemo: false } } });
      if (dup) return { code: dup.code, existing: true };
    }
  }
  throw new Error("Could not allocate an ambassador code");
}
