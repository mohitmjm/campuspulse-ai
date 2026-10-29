import { CalendarDays, FlaskConical, Target, Wallet } from "lucide-react";
import { BUDGET_PLAN, BUDGET_TOTAL, EXPERIMENTS, PLAN_CHANNELS, TARGET, TIMELINE, cumulativeTarget, expectedRegistrations } from "@/lib/campaign";
import { Card, CardTitle } from "@/components/ui/primitives";
import { inr } from "@/lib/utils";

export const metadata = { title: "Growth Plan — CampusPulse AI" };

export default function PlanPage() {
  const total = PLAN_CHANNELS.reduce((s, c) => s + expectedRegistrations(c), 0);
  const budget = BUDGET_PLAN.reduce((s, b) => s + b.amount, 0);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">Growth Plan</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">500 registrations in 7 days on {inr(BUDGET_TOTAL)}</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Insight: final-year students don&apos;t want &ldquo;an AI workshop&rdquo; — they want something to say when an interviewer asks what they&apos;ve built. They trust classmates more than ads, and they live in WhatsApp groups. So the plan leans on peer distribution and a placement-first message. All figures are planning assumptions, not measured results.
      </p>

      <Card className="mt-8 overflow-x-auto">
        <CardTitle icon={<Target className="h-4 w-4" />} hint={`Total = ${total}`}>Acquisition model: reach × click rate × conversion</CardTitle>
        <table className="w-full min-w-[720px] text-sm" data-testid="funnel-model">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 font-medium">Channel</th><th className="font-medium">Audience & method</th><th className="text-right font-medium">Reach</th><th className="text-right font-medium">Click</th><th className="text-right font-medium">Clicks</th><th className="text-right font-medium">Convert</th><th className="text-right font-medium">Regs</th>
            </tr>
          </thead>
          <tbody>
            {PLAN_CHANNELS.map((c) => (
              <tr key={c.id} className="border-b align-top">
                <td className="py-3 pr-3 font-medium">{c.name}</td>
                <td className="max-w-xs pr-3 text-muted-foreground"><p>{c.audience}</p><p className="mt-1">{c.method}</p></td>
                <td className="text-right tabular-nums">{c.reach.toLocaleString("en-IN")}</td>
                <td className="text-right tabular-nums">{c.clickRate * 100}%</td>
                <td className="text-right tabular-nums">{Math.round(c.reach * c.clickRate).toLocaleString("en-IN")}</td>
                <td className="text-right tabular-nums">{c.conversionRate * 100}%</td>
                <td className="text-right font-semibold tabular-nums">{expectedRegistrations(c)}</td>
              </tr>
            ))}
            <tr><td className="py-3 font-semibold" colSpan={6}>Total</td><td className="text-right font-bold tabular-nums text-primary">{total} / {TARGET}</td></tr>
          </tbody>
        </table>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {PLAN_CHANNELS.map((c) => (
            <div key={c.id} className="rounded-md bg-muted/50 p-3 text-xs">
              <p className="font-semibold">{c.name}</p>
              <p className="mt-1"><span className="font-medium">Risk:</span> {c.risks}</p>
              <p className="mt-1"><span className="font-medium">Backup:</span> {c.backup}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-x-auto">
          <CardTitle icon={<CalendarDays className="h-4 w-4" />}>Seven-day rollout</CardTitle>
          <ol className="grid gap-3">
            {TIMELINE.map((d) => (
              <li key={d.day} className="grid grid-cols-[52px_1fr] gap-3 border-b pb-3 last:border-0">
                <div><p className="text-xs text-muted-foreground">Day</p><p className="text-2xl font-bold">{d.day}</p></div>
                <div className="text-sm">
                  <p className="font-semibold">{d.focus} <span className="font-normal text-muted-foreground">· target {cumulativeTarget(d.day)} cumulative · {inr(d.budget)} · {d.owner}</span></p>
                  <p className="mt-0.5">{d.activities}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground"><strong>KPI:</strong> {d.kpi} · <strong>If not:</strong> {d.contingency}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardTitle icon={<Wallet className="h-4 w-4" />} hint={`Total ${inr(budget)}`}>Budget allocation</CardTitle>
          <ul className="grid gap-3">
            {BUDGET_PLAN.map((b) => (
              <li key={b.category} className="text-sm">
                <div className="flex justify-between font-medium"><span>{b.category}</span><span>{inr(b.amount)}</span></div>
                <p className="text-xs text-muted-foreground">{b.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">No paid ads, no paid AI tools. Design (Canva free), hosting (free tier) and messaging (WhatsApp) cost nothing.</p>
        </Card>
      </div>

      <Card className="mt-6" id="experiments">
        <CardTitle icon={<FlaskConical className="h-4 w-4" />}>Three growth tests</CardTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          {EXPERIMENTS.map((e) => (
            <div key={e.id} className="rounded-lg border p-4 text-sm">
              <p className="font-semibold">{e.name}</p>
              <dl className="mt-2 grid gap-1.5 text-xs">
                {[["Hypothesis", e.hypothesis], ["Test", e.design], ["Primary metric", e.metric], ["Guardrails", e.guardrails], ["Success threshold", e.threshold], ["Decision rule", e.decision]].map(([k, v]) => (
                  <div key={k}><dt className="font-semibold text-muted-foreground">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
