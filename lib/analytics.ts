import type { PrismaClient } from "@prisma/client";
import {
  BUDGET_PLAN,
  BUDGET_TOTAL,
  CAMPAIGN_DAYS,
  CHANNELS,
  CHANNEL_LABELS,
  DAILY_TARGETS,
  PLAN_CHANNELS,
  TARGET,
  cumulativeTarget,
  expectedRegistrations,
  type Channel,
} from "./campaign";
import { publicName } from "./utils";

const DAY_MS = 86_400_000;

export interface RegRow {
  createdAt: Date;
  channel: string;
  college: string;
  ambassadorId: string | null;
  messageVariant: string | null;
  formVariant: string | null;
}
export interface AmbRow { id: string; name: string; college: string; code: string; cohort: string }
export interface EventRow { type: string; sessionId: string; messageVariant: string | null; formVariant: string | null; referralCode: string | null }
export interface ExpenseRow { category: string; amount: number }

export interface AnalyticsInput {
  registrations: RegRow[];
  ambassadors: AmbRow[];
  events: EventRow[];
  expenses: ExpenseRow[];
  startDate: Date;
  /** Campaign day in progress (1..7). 0 = not started yet. */
  currentDay: number;
}

const ratio = (num: number, den: number) => (den > 0 ? num / den : null);

export function dayIndex(start: Date, at: Date) {
  return Math.floor((at.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function campaignDayFor(start: Date, now = new Date()) {
  return Math.max(0, Math.min(CAMPAIGN_DAYS, dayIndex(start, now)));
}

export function computeMetrics(input: AnalyticsInput) {
  const { registrations, ambassadors, events, expenses, startDate, currentDay } = input;
  const total = registrations.length;
  const remaining = Math.max(0, TARGET - total);
  const expectedToDate = cumulativeTarget(currentDay);
  const daysRemaining = Math.max(0, CAMPAIGN_DAYS - currentDay);

  // Daily trend (registrations outside the 7-day window are counted in totals but not plotted).
  let running = 0;
  const daily = DAILY_TARGETS.map((target, i) => {
    const day = i + 1;
    const count = registrations.filter((r) => dayIndex(startDate, r.createdAt) === day).length;
    running += count;
    return { day: `Day ${day}`, dayNum: day, count, target, cumulative: day <= currentDay ? running : null, cumulativeTarget: cumulativeTarget(day) };
  });

  // Channels: stored channels + plan comparison.
  const byChannel = CHANNELS.map((c) => ({ channel: c as Channel, label: CHANNEL_LABELS[c], count: registrations.filter((r) => r.channel === c).length }));
  const planChannels = PLAN_CHANNELS.map((p) => {
    const planned = expectedRegistrations(p);
    const actual = registrations.filter((r) => p.stored.includes(r.channel as Channel)).length;
    const expected = Math.round((planned / TARGET) * expectedToDate);
    return { id: p.id, name: p.name, planned, actual, expected, performance: ratio(actual, expected) };
  });

  // Colleges.
  const collegeMap = new Map<string, { college: string; count: number; ambassadors: number }>();
  for (const r of registrations) {
    const c = collegeMap.get(r.college) ?? { college: r.college, count: 0, ambassadors: 0 };
    c.count++;
    collegeMap.set(r.college, c);
  }
  for (const a of ambassadors) {
    const c = collegeMap.get(a.college) ?? { college: a.college, count: 0, ambassadors: 0 };
    c.ambassadors++;
    collegeMap.set(a.college, c);
  }
  const colleges = [...collegeMap.values()].sort((a, b) => b.count - a.count);

  // Ambassadors.
  const attributed = registrations.filter((r) => r.ambassadorId).length;
  const sharers = new Set(events.filter((e) => e.type === "share_click" && e.referralCode).map((e) => e.referralCode));
  const ambassadorStats = ambassadors
    .map((a) => {
      const count = registrations.filter((r) => r.ambassadorId === a.id).length;
      return { id: a.id, name: publicName(a.name), college: a.college, code: a.code, cohort: a.cohort, count, active: count > 0 || sharers.has(a.code) };
    })
    .sort((a, b) => b.count - a.count);
  const activeAmbassadors = ambassadorStats.filter((a) => a.active).length;
  const topN = Math.max(1, Math.ceil(ambassadorStats.length * 0.2));
  const topShare = ratio(ambassadorStats.slice(0, topN).reduce((s, a) => s + a.count, 0), attributed);

  // Funnel: unique sessions per step. Rates only use tracked denominators.
  const sessions = (type: string, pred: (e: EventRow) => boolean = () => true) => new Set(events.filter((e) => e.type === type && pred(e)).map((e) => e.sessionId)).size;
  const views = sessions("page_view");
  const starts = sessions("form_start");
  const submits = sessions("form_submit");
  const funnel = [
    { step: "Landing sessions", value: views },
    { step: "Started form", value: starts },
    { step: "Submitted form", value: submits },
    { step: "Registrations", value: total },
  ];
  const conversion = {
    viewToStart: ratio(starts, views),
    startToRegistration: ratio(Math.min(total, starts), starts),
    viewToRegistration: ratio(Math.min(total, views), views),
    trackedRegistrations: registrations.filter((r) => r.messageVariant || r.formVariant).length,
  };

  // Experiments.
  const variantStat = (field: "messageVariant" | "formVariant", v: string, denomType: string) => {
    const den = sessions(denomType, (e) => e[field] === v);
    const num = registrations.filter((r) => r[field] === v).length;
    return { variant: v, denominator: den, registrations: num, rate: ratio(num, den) };
  };
  const cohortStat = (cohort: string) => {
    const members = ambassadorStats.filter((a) => a.cohort === cohort);
    const active = members.filter((a) => a.active);
    const regs = members.reduce((s, a) => s + a.count, 0);
    return { variant: cohort, denominator: active.length, registrations: regs, rate: ratio(regs, active.length) };
  };
  const experiments = {
    message: [variantStat("messageVariant", "placement", "page_view"), variantStat("messageVariant", "generic", "page_view")],
    referral: [cohortStat("leaderboard"), cohortStat("control")],
    form: [variantStat("formVariant", "short", "form_start"), variantStat("formVariant", "long", "form_start")],
  };

  // Budget.
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const budget = {
    total: BUDGET_TOTAL,
    spent,
    remaining: BUDGET_TOTAL - spent,
    byCategory: BUDGET_PLAN.map((b) => ({ category: b.category, planned: b.amount, spent: expenses.filter((e) => e.category === b.category).reduce((s, e) => s + e.amount, 0) })),
    costPerRegistration: total > 0 ? spent / total : null,
  };

  return {
    target: TARGET,
    total,
    remaining,
    progress: total / TARGET,
    currentDay,
    daysRemaining,
    expectedToDate,
    uniqueColleges: new Set(registrations.map((r) => r.college.trim().toLowerCase())).size,
    daily,
    byChannel,
    planChannels,
    colleges,
    attributed,
    ambassadorCount: ambassadors.length,
    activeAmbassadors,
    ambassadors: ambassadorStats,
    topShare,
    funnel,
    conversion,
    experiments,
    budget,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;

export const DEMO_START_KEY = "demoStartDate";
export const DEMO_DAY_KEY = "demoCurrentDay";
export const DEMO_SCENARIO_KEY = "demoScenario";

export function realStartDate() {
  const raw = process.env.CAMPAIGN_START_DATE;
  const d = raw ? new Date(`${raw}T00:00:00+05:30`) : null;
  return d && !isNaN(d.getTime()) ? d : new Date(new Date().setHours(0, 0, 0, 0));
}

export async function loadMetrics(db: PrismaClient, isDemo: boolean) {
  const [registrations, ambassadors, events, expenses, settings] = await Promise.all([
    db.registration.findMany({ where: { isDemo }, select: { createdAt: true, channel: true, college: true, ambassadorId: true, messageVariant: true, formVariant: true } }),
    db.ambassador.findMany({ where: { isDemo }, select: { id: true, name: true, college: true, code: true, cohort: true } }),
    db.event.findMany({ where: { isDemo }, select: { type: true, sessionId: true, messageVariant: true, formVariant: true, referralCode: true } }),
    db.expense.findMany({ where: { isDemo }, select: { category: true, amount: true } }),
    db.setting.findMany(),
  ]);
  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
  let startDate: Date;
  let currentDay: number;
  if (isDemo) {
    startDate = s[DEMO_START_KEY] ? new Date(s[DEMO_START_KEY]) : new Date();
    currentDay = Number(s[DEMO_DAY_KEY] ?? 0);
  } else {
    startDate = realStartDate();
    currentDay = campaignDayFor(startDate);
  }
  return {
    metrics: computeMetrics({ registrations, ambassadors, events, expenses, startDate, currentDay }),
    scenario: isDemo ? (s[DEMO_SCENARIO_KEY] ?? null) : null,
  };
}
