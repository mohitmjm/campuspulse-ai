import { describe, expect, it } from "vitest";
import { BUDGET_PLAN, BUDGET_TOTAL, DAILY_TARGETS, PLAN_CHANNELS, TARGET, TIMELINE, expectedRegistrations } from "@/lib/campaign";
import { computeMetrics, type AnalyticsInput } from "@/lib/analytics";
import { runCopilot } from "@/lib/copilot";
import { normalizeEmail, normalizeRefCode, registrationSchema } from "@/lib/validation";
import { buildScenario } from "@/lib/simulation";

const start = new Date("2026-11-02T00:00:00Z");
const at = (day: number) => new Date(start.getTime() + (day - 1) * 86_400_000 + 3_600_000);

function input(partial: Partial<AnalyticsInput>): AnalyticsInput {
  return { registrations: [], ambassadors: [], events: [], expenses: [], startDate: start, currentDay: 1, ...partial };
}

describe("campaign plan", () => {
  it("channel model sums exactly to the 500 target", () => {
    expect(PLAN_CHANNELS.map(expectedRegistrations)).toEqual([264, 144, 92]);
    expect(PLAN_CHANNELS.reduce((s, c) => s + expectedRegistrations(c), 0)).toBe(TARGET);
  });
  it("daily targets sum to 500 and budget sums to ₹2,000 (plan and timeline)", () => {
    expect(DAILY_TARGETS.reduce((a, b) => a + b, 0)).toBe(TARGET);
    expect(BUDGET_PLAN.reduce((s, b) => s + b.amount, 0)).toBe(BUDGET_TOTAL);
    expect(TIMELINE.reduce((s, d) => s + d.budget, 0)).toBe(BUDGET_TOTAL);
  });
});

describe("validation", () => {
  it("normalizes gmail dots and plus tags", () => {
    expect(normalizeEmail(" P.Sharma+ai@Gmail.com ")).toBe("psharma@gmail.com");
    expect(normalizeEmail("a.b+x@college.edu")).toBe("a.b@college.edu");
  });
  it("validates referral codes", () => {
    expect(normalizeRefCode(" campus01 ")).toBe("CAMPUS01");
    expect(normalizeRefCode("bad code!")).toBeNull();
    expect(normalizeRefCode(undefined)).toBeNull();
  });
  it("rejects invalid registrations with field errors", () => {
    const r = registrationSchema.safeParse({ name: "A", email: "nope", college: "", branch: "Astrology", gradYear: 1990, consent: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(r.error.flatten().fieldErrors).sort()).toEqual(["branch", "college", "consent", "email", "gradYear", "name"]);
  });
});

describe("analytics", () => {
  it("derives totals, pace inputs and channel performance from rows", () => {
    const regs = Array.from({ length: 100 }, (_, i) => ({ createdAt: at(i < 40 ? 1 : 2), channel: i % 2 ? "whatsapp" : "club", college: `C${i % 4}`, ambassadorId: i % 2 ? "a1" : null, messageVariant: null, formVariant: null }));
    const m = computeMetrics(input({ registrations: regs, currentDay: 2, ambassadors: [{ id: "a1", name: "Asha Rao", college: "C1", code: "ASHA01", cohort: "leaderboard" }] }));
    expect(m.total).toBe(100);
    expect(m.remaining).toBe(400);
    expect(m.expectedToDate).toBe(100);
    expect(m.uniqueColleges).toBe(4);
    expect(m.attributed).toBe(50);
    expect(m.daily[0].count).toBe(40);
    expect(m.daily[1].cumulative).toBe(100);
    expect(m.daily[2].cumulative).toBeNull();
    expect(m.ambassadors[0].name).toBe("Asha R.");
  });
  it("returns null conversion rates instead of inventing denominators", () => {
    const m = computeMetrics(input({ registrations: [{ createdAt: at(1), channel: "direct", college: "X", ambassadorId: null, messageVariant: null, formVariant: null }] }));
    expect(m.conversion.viewToStart).toBeNull();
    expect(m.experiments.message[0].rate).toBeNull();
  });
});

describe("copilot", () => {
  const regsFor = (n: number, channel = "whatsapp") => Array.from({ length: n }, () => ({ createdAt: at(1), channel, college: "C", ambassadorId: null, messageVariant: null, formVariant: null }));

  it("matches the brief example: 160 regs on day 4 of 7", () => {
    const r = runCopilot(computeMetrics(input({ registrations: regsFor(160), currentDay: 4 })));
    expect(r.summary.remaining).toBe(340);
    expect(r.summary.requiredDailyPace).toBe(114);
    expect(r.summary.status).toBe("off-track"); // 160 / 255 = 63%
    expect(r.recommendations[0].severity).toBe("critical");
    expect(r.recommendations.some((x) => x.rule === "R2-channel-gap")).toBe(true); // clubs + peer at 0
  });
  it("flags a late-campaign shortfall", () => {
    const r = runCopilot(computeMetrics(input({ registrations: regsFor(200), currentDay: 6 })));
    expect(r.recommendations.some((x) => x.rule === "R7-late-shortfall")).toBe(true);
  });
  it("flags budget overspend", () => {
    const r = runCopilot(computeMetrics(input({ registrations: regsFor(40), currentDay: 1, expenses: [{ category: "Posters", amount: 1500 }] })));
    expect(r.recommendations.some((x) => x.rule === "R6-budget")).toBe(true);
  });
  it("reports achieved when target reached", () => {
    const r = runCopilot(computeMetrics(input({ registrations: regsFor(500), currentDay: 6 })));
    expect(r.summary.status).toBe("achieved");
    expect(r.summary.requiredDailyPace).toBe(0);
  });
});

describe("simulation", () => {
  it("is deterministic and labelled", () => {
    const a = buildScenario("underperforming", start);
    const b = buildScenario("underperforming", start);
    expect(a.registrations.length).toBe(160);
    expect(a.registrations.map((r) => r.channel)).toEqual(b.registrations.map((r) => r.channel));
    expect(a.registrations.every((r) => r.isDemo && String(r.name).includes("SIMULATED"))).toBe(true);
  });
  it("underperforming scenario triggers channel + ambassador alerts; strong referral is on track", () => {
    const toMetrics = (id: "underperforming" | "referral") => {
      const s = buildScenario(id, start);
      return computeMetrics({
        registrations: s.registrations as never,
        ambassadors: s.ambassadors,
        events: s.events.map((e) => ({ messageVariant: null, formVariant: null, referralCode: null, ...e })) as never,
        expenses: s.expenses,
        startDate: start,
        currentDay: s.currentDay,
      });
    };
    const weak = runCopilot(toMetrics("underperforming"));
    expect(weak.summary.status).toBe("off-track");
    expect(weak.recommendations.map((r) => r.rule)).toEqual(expect.arrayContaining(["R1-pace", "R2-channel-gap", "R3-college", "R4-ambassadors"]));
    const strong = runCopilot(toMetrics("referral"));
    expect(["on-track", "achieved"]).toContain(strong.summary.status);
  });
});
