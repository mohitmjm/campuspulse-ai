import { execSync } from "node:child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { onboardAmbassador, registerStudent } from "@/lib/registration";
import { loadMetrics } from "@/lib/analytics";
import { loadScenario, resetDemo } from "@/lib/simulation";
import type { RegistrationInput } from "@/lib/validation";

const url = "file:./test.db";
let db: PrismaClient;

const student = (over: Partial<RegistrationInput> = {}): RegistrationInput => ({
  name: "Priya Sharma",
  email: "priya.sharma@gmail.com",
  college: "Deccan Institute of Technology",
  branch: "CSE",
  gradYear: new Date().getFullYear() + 1,
  consent: true,
  ...over,
});

beforeAll(() => {
  execSync("npx prisma db push --skip-generate --force-reset", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
  db = new PrismaClient({ datasources: { db: { url } } });
});
afterAll(() => db.$disconnect());
beforeEach(async () => {
  await db.registration.deleteMany();
  await db.ambassador.deleteMany();
  await db.event.deleteMany();
});

describe("registration + referral (SQLite integration)", () => {
  it("creates a registration with a confirmation ID", async () => {
    const r = await registerStudent(db, student());
    expect(r.status).toBe("created");
    if (r.status === "created") expect(r.confirmationId).toMatch(/^CP-[A-Z2-9]{6}$/);
    const row = await db.registration.findFirstOrThrow();
    expect(row.channel).toBe("direct");
    expect(row.isDemo).toBe(false);
  });

  it("blocks duplicates via normalized email, including concurrent submits", async () => {
    await registerStudent(db, student());
    expect((await registerStudent(db, student({ email: "PriyaSharma+x@GMAIL.com" }))).status).toBe("duplicate");
    const results = await Promise.all([registerStudent(db, student({ email: "a@x.edu" })), registerStudent(db, student({ email: "A@x.edu" }))]);
    expect(results.map((r) => r.status).sort()).toEqual(["created", "duplicate"]);
    expect(await db.registration.count()).toBe(2);
  });

  it("attributes referrals to the ambassador once and updates analytics", async () => {
    const { code } = await onboardAmbassador(db, { name: "Kiran Rao", email: "kiran@college.edu", college: "Deccan Institute of Technology" });
    const again = await onboardAmbassador(db, { name: "Kiran Rao", email: "Kiran@college.edu", college: "X" });
    expect(again).toEqual({ code, existing: true });

    const r = await registerStudent(db, student({ ref: code.toLowerCase() }));
    expect(r.status === "created" && r.ambassadorName).toBe("Kiran Rao");
    await registerStudent(db, student({ ref: code })); // duplicate — must not double count
    const unknown = await registerStudent(db, student({ email: "z@x.edu", ref: "NOPE99" }));
    expect(unknown.status === "created" && unknown.referralIgnored).toBe(true);

    const { metrics } = await loadMetrics(db, false);
    expect(metrics.total).toBe(2);
    expect(metrics.attributed).toBe(1);
    expect(metrics.ambassadors[0]).toMatchObject({ code, count: 1, name: "Kiran R." });
    expect(metrics.byChannel.find((c) => c.channel === "whatsapp")?.count).toBe(1);
  });

  it("keeps demo data isolated from real records", async () => {
    await registerStudent(db, student());
    await loadScenario(db, "base");
    expect((await loadMetrics(db, true)).metrics.total).toBe(250);
    expect((await loadMetrics(db, false)).metrics.total).toBe(1);
    await resetDemo(db);
    expect(await db.registration.count({ where: { isDemo: true } })).toBe(0);
    expect(await db.registration.count({ where: { isDemo: false } })).toBe(1);
  });
});
