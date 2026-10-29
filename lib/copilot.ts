import { BUDGET_TOTAL, CAMPAIGN_DAYS, EXPERIMENTS } from "./campaign";
import type { Metrics } from "./analytics";

// Deterministic rules engine. Every recommendation names the rule that fired and the numbers behind it.

export type Severity = "critical" | "warning" | "info" | "positive";

export interface Recommendation {
  rule: string;
  severity: Severity;
  title: string;
  action: string;
  reason: string;
}

export interface CopilotReport {
  source: "rules-engine";
  summary: {
    total: number;
    remaining: number;
    currentDay: number;
    daysRemaining: number;
    requiredDailyPace: number | null;
    actualDailyPace: number | null;
    progressVsPlan: number | null;
    status: "not-started" | "on-track" | "at-risk" | "off-track" | "achieved";
    highestImpactChannel: string | null;
  };
  recommendations: Recommendation[];
  priorityExperiment: { id: string; name: string; why: string };
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
const pc = (n: number) => `${Math.round(n * 100)}%`;

export function runCopilot(m: Metrics): CopilotReport {
  const recs: Recommendation[] = [];
  const day = m.currentDay;
  const actualPace = day > 0 ? m.total / day : null;
  const requiredPace = m.remaining === 0 ? 0 : m.daysRemaining > 0 ? Math.ceil(m.remaining / m.daysRemaining) : null;
  const progressVsPlan = m.expectedToDate > 0 ? m.total / m.expectedToDate : null;

  let status: CopilotReport["summary"]["status"] = "not-started";
  if (m.remaining === 0) status = "achieved";
  else if (day > 0 && progressVsPlan !== null) status = progressVsPlan >= 0.95 ? "on-track" : progressVsPlan >= 0.8 ? "at-risk" : "off-track";

  // Highest-impact channel: best actual/expected ratio among channels with meaningful volume.
  const ranked = m.planChannels.filter((c) => c.expected >= 10 && c.performance !== null).sort((a, b) => (b.performance ?? 0) - (a.performance ?? 0));
  const best = ranked[0] ?? null;
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  if (day === 0) {
    recs.push({ rule: "R0-prelaunch", severity: "info", title: "Campaign has not started", action: "Onboard ambassadors and pre-load the WhatsApp kit so Day 1 begins with ≥30 active ambassadors.", reason: "No campaign day has elapsed, so pace rules are paused." });
  }

  // R1 — pace
  if (day > 0 && m.remaining > 0) {
    const sev: Severity = status === "off-track" ? "critical" : status === "at-risk" ? "warning" : "positive";
    recs.push({
      rule: "R1-pace",
      severity: sev,
      title: status === "on-track" ? "On pace for 500" : `Behind plan: ${fmt(m.total)} of ${fmt(m.expectedToDate)} expected by Day ${day}`,
      action:
        requiredPace === null
          ? "Campaign window has ended — extend registrations by 24h only if the workshop date allows."
          : `Hit ${requiredPace} registrations/day for the next ${m.daysRemaining} day(s).`,
      reason: `${fmt(m.remaining)} remaining${requiredPace !== null && actualPace ? `; required pace ${requiredPace}/day vs actual ${actualPace.toFixed(0)}/day (${(requiredPace / actualPace).toFixed(2)}×)` : ""}; progress vs plan ${progressVsPlan !== null ? pc(progressVsPlan) : "n/a"}.`,
    });
  }

  // R2 — channel reallocation
  if (best && worst && (worst.performance ?? 1) < 0.75) {
    recs.push({
      rule: "R2-channel-gap",
      severity: (worst.performance ?? 1) < 0.5 ? "critical" : "warning",
      title: `${worst.name} is underdelivering`,
      action: `Move effort toward ${best.name} (running at ${pc(best.performance ?? 0)} of plan) and run the ${worst.id === "clubs" ? "club backup: ambassadors who are club members post directly" : "channel backup action"}.`,
      reason: `${worst.name}: ${worst.actual} actual vs ${worst.expected} expected by Day ${day} (${pc(worst.performance ?? 0)}).`,
    });
  } else if (best && (best.performance ?? 0) >= 1.15) {
    recs.push({ rule: "R2-double-down", severity: "positive", title: `${best.name} is outperforming`, action: `Give ${best.name} the next reminder slot and any released contingency.`, reason: `${best.actual} actual vs ${best.expected} expected (${pc(best.performance ?? 0)} of plan).` });
  }

  // R3 — college coverage
  const withAmb = m.colleges.filter((c) => c.ambassadors > 0);
  if (withAmb.length >= 3 && day >= 2) {
    const sorted = [...withAmb].map((c) => c.count).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const weak = withAmb.filter((c) => c.count < median * 0.5);
    if (weak.length) {
      recs.push({
        rule: "R3-college",
        severity: "warning",
        title: `${weak.length} college${weak.length > 1 ? "s" : ""} below half the median`,
        action: `Pair ambassadors at ${weak.slice(0, 3).map((c) => c.college).join(", ")} with a club lead for a direct announcement.`,
        reason: `Median college with ambassadors has ${median} registrations; these have ${weak.map((c) => c.count).join(", ")}.`,
      });
    }
  }

  // R4 — ambassador health
  if (m.ambassadorCount > 0 && day >= 2) {
    const inactive = m.ambassadorCount - m.activeAmbassadors;
    const needSupport = m.ambassadors.filter((a) => a.count <= 1);
    if (inactive / m.ambassadorCount > 0.25 || (m.topShare ?? 0) > 0.6) {
      recs.push({
        rule: "R4-ambassadors",
        severity: "warning",
        title: "Ambassador performance is uneven",
        action: `Send the ${needSupport.length} ambassador(s) with ≤1 referral a fresh message + a 5-minute call; ask top performers to share what worked.`,
        reason: `${inactive} of ${m.ambassadorCount} inactive; top 20% drive ${m.topShare !== null ? pc(m.topShare) : "n/a"} of attributed registrations.`,
      });
    }
  }

  // R5 — positioning (Test 1)
  const [placement, generic] = m.experiments.message;
  const minSample = 150;
  if (placement.rate !== null && generic.rate !== null && placement.denominator >= minSample && generic.denominator >= minSample) {
    const lift = placement.rate / generic.rate - 1;
    if (lift >= 0.2) recs.push({ rule: "R5-positioning", severity: "info", title: "Switch all copy to placement messaging", action: "Replace generic invitations with the placement-oriented message for the rest of the campaign.", reason: `Placement converts at ${pc(placement.rate)} vs ${pc(generic.rate)} (+${pc(lift)} relative) on ${placement.denominator}/${generic.denominator} sessions.` });
    else if (lift <= -0.2) recs.push({ rule: "R5-positioning", severity: "info", title: "Generic message is winning", action: "Keep the generic invitation; placement framing is not landing with this audience.", reason: `Generic ${pc(generic.rate)} vs placement ${pc(placement.rate)}.` });
  }

  // R6 — budget
  const spentShare = m.budget.spent / BUDGET_TOTAL;
  const timeShare = day / CAMPAIGN_DAYS;
  if (day > 0 && spentShare > timeShare + 0.2) {
    recs.push({ rule: "R6-budget", severity: "warning", title: "Spending ahead of schedule", action: "Freeze non-essential spend; keep the remaining budget for Day-7 rewards that are already promised.", reason: `${pc(spentShare)} of ₹${BUDGET_TOTAL} spent at ${pc(timeShare)} of the campaign; ₹${m.budget.remaining} left.` });
  }

  // R7 — late-campaign shortfall
  if (day >= 5 && requiredPace !== null && actualPace && requiredPace > actualPace * 1.5) {
    recs.push({ rule: "R7-late-shortfall", severity: "critical", title: "Late-campaign shortfall", action: "Escalate: every ambassador sends 1:1 DMs to 10 classmates today, clubs post a 'seats closing' reminder, release contingency.", reason: `Day ${day}: need ${requiredPace}/day but averaging ${actualPace.toFixed(0)}/day.` });
  }

  // R9 — momentum
  const done = m.daily.filter((d) => d.dayNum <= day);
  if (done.length >= 2) {
    const [prev, last] = done.slice(-2);
    if (prev.count > 0 && last.count >= prev.count * 1.2) recs.push({ rule: "R9-momentum", severity: "positive", title: "Registrations are rising", action: "Repeat yesterday's best-performing message and timing; note it in the worklog.", reason: `Day ${last.dayNum}: ${last.count} vs Day ${prev.dayNum}: ${prev.count} (+${pc(last.count / prev.count - 1)}).` });
  }

  // R8 — experiment priority: test the biggest bottleneck.
  const completion = m.conversion.startToRegistration;
  const peer = m.planChannels.find((c) => c.id === "peer");
  let priority: CopilotReport["priorityExperiment"];
  if (completion !== null && completion < 0.6) priority = { id: "form", name: EXPERIMENTS[2].name, why: `Form completion is ${pc(completion)} (<60%): friction is the largest leak.` };
  else if (peer && peer.performance !== null && peer.performance < 0.8) priority = { id: "referral", name: EXPERIMENTS[1].name, why: `Peer/referral channel at ${pc(peer.performance)} of plan.` };
  else priority = { id: "message", name: EXPERIMENTS[0].name, why: "Funnel steps look healthy; messaging lift compounds across every channel." };

  recs.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    source: "rules-engine",
    summary: { total: m.total, remaining: m.remaining, currentDay: day, daysRemaining: m.daysRemaining, requiredDailyPace: requiredPace, actualDailyPace: actualPace, progressVsPlan, status, highestImpactChannel: best?.name ?? null },
    recommendations: recs,
    priorityExperiment: priority,
  };
}

/** Optional: an LLM rewrites the rules output as a short narrative. Never invents numbers; never replaces the rules. */
export async function llmNarrative(report: CopilotReport): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 400,
      messages: [{ role: "user", content: `You are a growth advisor. Summarise these campaign rule outputs in 4 bullet points for a student growth intern. Use only numbers present in the JSON.\n\n${JSON.stringify(report)}` }],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((c) => c.type === "text")?.text ?? null;
}
