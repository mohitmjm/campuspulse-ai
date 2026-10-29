import type { PrismaClient } from "@prisma/client";
import { BRANCHES, SUGGESTED_COLLEGES, type Channel } from "./campaign";
import { ambassadorCode, confirmationId } from "./ids";
import { DEMO_DAY_KEY, DEMO_SCENARIO_KEY, DEMO_START_KEY } from "./analytics";

// Deterministic demo scenarios. All rows are written with isDemo=true and "(SIMULATED)" markers
// so they can never be confused with — or overwrite — real campaign records.

export const SCENARIOS = {
  base: {
    label: "Base scenario",
    description: "End of Day 4, roughly on plan. Placement messaging slightly ahead.",
    seed: 11,
    daily: [42, 58, 72, 78],
    mix: { whatsapp: 0.52, club: 0.28, referral: 0.12, social: 0.06, direct: 0.02 },
    weakColleges: [] as number[],
    ambassadorSkew: 1.2,
    leaderboardBoost: 1.35,
    conv: { placement: 0.3, generic: 0.23 },
    completion: { short: 0.78, long: 0.62 },
    expenses: [["Club partner kit", 200], ["Posters", 200]] as [string, number][],
  },
  underperforming: {
    label: "Underperforming campaign",
    description: "Day 4 with 160 registrations: clubs stalled, a few ambassadors carry the load.",
    seed: 23,
    daily: [30, 38, 44, 48],
    mix: { whatsapp: 0.64, club: 0.1, referral: 0.12, social: 0.06, direct: 0.08 },
    weakColleges: [5, 6, 7],
    ambassadorSkew: 2.6,
    leaderboardBoost: 1.1,
    conv: { placement: 0.24, generic: 0.21 },
    completion: { short: 0.58, long: 0.44 },
    expenses: [["Club partner kit", 400], ["Posters", 200], ["Ambassador rewards", 300], ["Contingency", 200]] as [string, number][],
  },
  referral: {
    label: "Strong referral scenario",
    description: "End of Day 5, ahead of plan; peer referrals and leaderboard cohort outperform.",
    seed: 37,
    daily: [45, 70, 88, 96, 104],
    mix: { whatsapp: 0.4, club: 0.24, referral: 0.27, social: 0.08, direct: 0.01 },
    weakColleges: [] as number[],
    ambassadorSkew: 1.1,
    leaderboardBoost: 1.6,
    conv: { placement: 0.33, generic: 0.22 },
    completion: { short: 0.81, long: 0.66 },
    expenses: [["Club partner kit", 400], ["Posters", 200]] as [string, number][],
  },
} as const;
export type ScenarioId = keyof typeof SCENARIOS;

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Aarav", "Diya", "Rohan", "Ananya", "Karthik", "Sneha", "Vikram", "Meera", "Arjun", "Isha", "Rahul", "Pooja", "Siddharth", "Kavya", "Nikhil", "Lakshmi", "Aditya", "Harini", "Varun", "Fatima", "Manoj", "Tanvi", "Imran", "Divya"];
const LAST = ["Reddy", "Sharma", "Iyer", "Patel", "Naidu", "Khan", "Menon", "Rao", "Gupta", "Das", "Pillai", "Joshi"];

function pickWeighted<T extends string>(rand: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [k, w] of entries) if ((r -= w) <= 0) return k;
  return entries[entries.length - 1][0];
}

export function buildScenario(id: ScenarioId, startDate: Date) {
  const s = SCENARIOS[id];
  const rand = mulberry32(s.seed);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const colleges = SUGGESTED_COLLEGES.map((c) => `${c} (SIM)`);

  // 24 ambassadors, 3 per college, alternating cohorts.
  const ambassadors = Array.from({ length: 24 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`;
    return {
      id: `demo-amb-${i}`,
      name,
      email: `sim-ambassador-${i}@example.test`,
      emailNorm: `sim-ambassador-${i}@example.test`,
      college: colleges[i % colleges.length],
      code: `${ambassadorCode(name, rand).slice(0, 4)}${String(i).padStart(2, "0")}`,
      cohort: i % 2 === 0 ? "leaderboard" : "control",
      isDemo: true,
      createdAt: startDate,
    };
  });
  // Ambassador weights: power-law skew, leaderboard boost, weak-college penalty.
  const ambWeight = ambassadors.map((a, i) => {
    const collegeIdx = i % colleges.length;
    let w = 1 / Math.pow(1 + ((i * 7) % 24), s.ambassadorSkew / 2);
    if (a.cohort === "leaderboard") w *= s.leaderboardBoost;
    if ((s.weakColleges as readonly number[]).includes(collegeIdx)) w *= 0.15;
    return w;
  });
  const ambTotal = ambWeight.reduce((x, y) => x + y, 0);
  const pickAmb = () => {
    let r = rand() * ambTotal;
    for (let i = 0; i < ambassadors.length; i++) if ((r -= ambWeight[i]) <= 0) return ambassadors[i];
    return ambassadors[0];
  };

  const registrations: Record<string, unknown>[] = [];
  const events: Record<string, unknown>[] = [];
  let sid = 0;
  const session = () => `sim-${id}-${(sid++).toString().padStart(6, "0")}`;
  const tally = { placement: 0, generic: 0, short: 0, long: 0 };

  s.daily.forEach((count, d) => {
    for (let k = 0; k < count; k++) {
      const createdAt = new Date(startDate.getTime() + d * 86_400_000 + (8 + rand() * 14) * 3_600_000);
      const channel = pickWeighted(rand, s.mix as Record<Channel, number>);
      const amb = channel === "whatsapp" ? (rand() < 0.92 ? pickAmb() : null) : channel === "club" && rand() < 0.3 ? pickAmb() : null;
      const messageVariant = rand() < s.conv.placement / (s.conv.placement + s.conv.generic) ? "placement" : "generic";
      const formVariant = rand() < s.completion.short / (s.completion.short + s.completion.long) ? "short" : "long";
      tally[messageVariant]++;
      tally[formVariant]++;
      const college = amb?.college ?? (() => {
        // Weak colleges get fewer organic registrations too.
        let c = pick(colleges);
        if ((s.weakColleges as readonly number[]).includes(colleges.indexOf(c)) && rand() < 0.8) c = colleges[Math.floor(rand() * 5)];
        return c;
      })();
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const n = registrations.length;
      const sessionId = session();
      registrations.push({
        confirmationId: `SIM-${confirmationId(rand).slice(3)}${n}`,
        name: `${name} (SIMULATED)`,
        email: `sim-${id}-${n}@example.test`,
        emailNorm: `sim-${id}-${n}@example.test`,
        college,
        branch: pick(BRANCHES.slice(0, 6)),
        gradYear: new Date().getFullYear() + (rand() < 0.7 ? 0 : 1),
        channel,
        messageVariant,
        formVariant,
        referralCode: amb?.code ?? null,
        ambassadorId: amb?.id ?? null,
        isDemo: true,
        createdAt,
      });
      for (const type of ["page_view", "form_start", "form_submit"]) events.push({ type, sessionId, channel, messageVariant, formVariant, referralCode: amb?.code ?? null, isDemo: true, createdAt });
    }
  });

  // Non-converting sessions so funnel rates have real denominators derived from the scenario rates.
  for (const f of ["short", "long"] as const) {
    const extraStarts = Math.round(tally[f] / s.completion[f]) - tally[f];
    for (let i = 0; i < extraStarts; i++) {
      const sessionId = session();
      const messageVariant = rand() < 0.5 ? "placement" : "generic";
      events.push({ type: "page_view", sessionId, messageVariant, formVariant: f, isDemo: true, createdAt: startDate });
      events.push({ type: "form_start", sessionId, messageVariant, formVariant: f, isDemo: true, createdAt: startDate });
    }
  }
  for (const v of ["placement", "generic"] as const) {
    const viewsTarget = Math.round(tally[v] / s.conv[v]);
    const already = events.filter((e) => e.type === "page_view" && e.messageVariant === v).length;
    for (let i = 0; i < viewsTarget - already; i++) {
      events.push({ type: "page_view", sessionId: session(), messageVariant: v, formVariant: rand() < 0.5 ? "short" : "long", isDemo: true, createdAt: startDate });
    }
  }
  // Share clicks for a subset of ambassadors (makes some zero-referral ambassadors "active").
  ambassadors.forEach((a, i) => {
    if (rand() < 0.6 || i < 4) events.push({ type: "share_click", sessionId: session(), referralCode: a.code, isDemo: true, createdAt: startDate });
  });

  const expenses = s.expenses.map(([category, amount]) => ({ category, amount, note: "SIMULATED expense", isDemo: true, createdAt: startDate }));
  return { ambassadors, registrations, events, expenses, currentDay: s.daily.length };
}

export async function resetDemo(db: PrismaClient) {
  await db.$transaction([
    db.registration.deleteMany({ where: { isDemo: true } }),
    db.event.deleteMany({ where: { isDemo: true } }),
    db.expense.deleteMany({ where: { isDemo: true } }),
    db.ambassador.deleteMany({ where: { isDemo: true } }),
    db.setting.deleteMany({ where: { key: { in: [DEMO_START_KEY, DEMO_DAY_KEY, DEMO_SCENARIO_KEY] } } }),
  ]);
}

export async function loadScenario(db: PrismaClient, id: ScenarioId) {
  await resetDemo(db);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today.getTime() - (SCENARIOS[id].daily.length - 1) * 86_400_000);
  const data = buildScenario(id, startDate);
  // Chunked inserts keep SQLite parameter limits happy.
  await db.ambassador.createMany({ data: data.ambassadors });
  for (let i = 0; i < data.registrations.length; i += 200) {
    await db.registration.createMany({ data: data.registrations.slice(i, i + 200) as never });
  }
  for (let i = 0; i < data.events.length; i += 500) {
    await db.event.createMany({ data: data.events.slice(i, i + 500) as never });
  }
  await db.expense.createMany({ data: data.expenses });
  const set = (key: string, value: string) => db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await db.$transaction([set(DEMO_START_KEY, startDate.toISOString()), set(DEMO_DAY_KEY, String(data.currentDay)), set(DEMO_SCENARIO_KEY, id)]);
  return { registrations: data.registrations.length, ambassadors: data.ambassadors.length, events: data.events.length };
}
