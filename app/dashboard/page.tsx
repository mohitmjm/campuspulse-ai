import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle, Bot, Building2, CheckCircle2, Filter, FlaskConical, Gauge, Info, Radio, TrendingUp, Trophy, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadMetrics, type Metrics } from "@/lib/analytics";
import { runCopilot, type Recommendation, type Severity } from "@/lib/copilot";
import { resolveView } from "@/lib/access";
import { EXPERIMENTS } from "@/lib/campaign";
import { SCENARIOS, type ScenarioId } from "@/lib/simulation";
import { cn, inr, pct } from "@/lib/utils";
import { Badge, Card, CardTitle, Progress, SimBanner } from "@/components/ui/primitives";
import { PlanVsActualChart, TrendChart } from "@/components/charts";
import { AdminUnlock, DemoControls, NarrativeButton } from "@/components/dashboard-controls";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: { view?: string } }) {
  const { isDemo, denied } = resolveView(searchParams.view, cookies().get("cp_admin")?.value);
  const { metrics: m, scenario } = await loadMetrics(prisma, isDemo);
  const report = runCopilot(m);
  const empty = m.total === 0 && m.ambassadorCount === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Growth Command Center</p>
          <h1 className="mt-1 text-3xl font-bold">Campaign overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDemo ? "Demo Simulation Mode" : "Real campaign data (aggregates only)"} · {m.currentDay === 0 ? "pre-launch" : `Day ${m.currentDay} of 7`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/dashboard" className={cn("rounded-md px-3 py-1.5", isDemo ? "bg-muted font-semibold" : "text-muted-foreground")}>Simulation</Link>
          <Link href="/dashboard?view=real" className={cn("rounded-md px-3 py-1.5", !isDemo ? "bg-muted font-semibold" : "text-muted-foreground")}>Real data</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {denied && (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-warning/40 py-3">
            <p className="text-sm">Real campaign data is restricted to organisers. Showing simulation instead.</p>
            <AdminUnlock />
          </Card>
        )}
        {isDemo && (
          <>
            <SimBanner>
              {scenario ? `${SCENARIOS[scenario as ScenarioId]?.label}: ${SCENARIOS[scenario as ScenarioId]?.description}` : "No scenario loaded."} All numbers on this view are simulated — not real campaign results.
            </SimBanner>
            <DemoControls active={scenario} />
          </>
        )}
      </div>

      {empty ? (
        <Card className="mt-6 py-16 text-center" data-testid="empty-state">
          <Gauge className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">No campaign data yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {isDemo ? "Load a scenario above to explore a simulated 7-day campaign." : "Registrations will appear here as soon as students sign up."}
          </p>
        </Card>
      ) : (
        <Body m={m} report={report} view={isDemo ? "demo" : "real"} />
      )}
    </div>
  );
}

function Body({ m, report, view }: { m: Metrics; report: ReturnType<typeof runCopilot>; view: string }) {
  const statusTone = { "on-track": "success", "at-risk": "warning", "off-track": "danger", achieved: "success", "not-started": "neutral" } as const;
  const s = report.summary;
  return (
    <div className="mt-6 grid gap-5 [&>*]:min-w-0">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="kpis">
        <Kpi label="Registrations" value={m.total} sub={<>of {m.target} target</>} icon={Users} testid="kpi-total">
          <Progress className="mt-3" value={m.progress} label="Progress to target" />
        </Kpi>
        <Kpi label="Remaining" value={m.remaining} sub={<>{pct(m.progress, 0)} complete</>} icon={Gauge} testid="kpi-remaining" />
        <Kpi label="Required pace" value={s.requiredDailyPace ?? "—"} sub={<>per day · actual {s.actualDailyPace?.toFixed(0) ?? "—"}/day</>} icon={TrendingUp} testid="kpi-pace" />
        <Kpi label="Status" value={<Badge tone={statusTone[s.status]} className="text-sm">{s.status.replace("-", " ")}</Badge>} sub={<>{s.progressVsPlan !== null ? `${pct(s.progressVsPlan, 0)} of plan to date` : "—"}</>} icon={Radio} testid="kpi-status" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardTitle icon={<TrendingUp className="h-4 w-4" />} hint={`${m.uniqueColleges} colleges · ${m.attributed} ambassador-attributed`}>Seven-day progress</CardTitle>
          <TrendChart data={m.daily} />
        </Card>

        {/* Copilot */}
        <Card className="border-primary/30" data-testid="copilot">
          <CardTitle icon={<Bot className="h-4 w-4" />} hint={<Badge tone="primary">Rules engine</Badge>}>AI Growth Copilot</CardTitle>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Mini label="Remaining" value={s.remaining} />
            <Mini label="Need / day" value={s.requiredDailyPace ?? "—"} />
            <Mini label="Days left" value={s.daysRemaining} />
          </div>
          {s.highestImpactChannel && <p className="mb-3 text-xs text-muted-foreground">Highest-impact channel: <strong className="text-foreground">{s.highestImpactChannel}</strong></p>}
          <ul className="grid max-h-[340px] gap-2 overflow-y-auto pr-1">
            {report.recommendations.map((r) => <Rec key={r.rule + r.title} r={r} />)}
          </ul>
          <div className="mt-3 rounded-md bg-muted/60 p-3 text-xs">
            <p className="font-semibold">Prioritise next: {report.priorityExperiment.name}</p>
            <p className="text-muted-foreground">{report.priorityExperiment.why}</p>
          </div>
          <div className="mt-3"><NarrativeButton view={view} configured={!!process.env.ANTHROPIC_API_KEY} /></div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle icon={<Radio className="h-4 w-4" />} hint="Expected = plan share × cumulative target">Acquisition channels vs plan</CardTitle>
          <PlanVsActualChart data={m.planChannels.map((c) => ({ name: c.id === "ambassador" ? "Ambassadors" : c.id === "clubs" ? "Clubs" : "Peer + social", actual: c.actual, expected: c.expected }))} />
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {m.planChannels.map((c) => {
              const low = c.performance !== null && c.performance < 0.75;
              return (
                <div key={c.id} className={cn("rounded-md border p-3 text-sm", low && "border-danger/40 bg-danger/5")} data-testid={`channel-${c.id}`}>
                  <p className="flex items-center gap-1.5 font-medium">{low && <AlertTriangle className="h-3.5 w-3.5 text-danger" />}{c.name}</p>
                  <p className="mt-1 text-muted-foreground">{c.actual} / {c.expected} expected · <span className={low ? "font-semibold text-danger" : ""}>{pct(c.performance, 0)}</span></p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Source breakdown: {m.byChannel.map((c) => `${c.label} ${c.count}`).join(" · ")}</p>
        </Card>

        <Card>
          <CardTitle icon={<Filter className="h-4 w-4" />} hint="Unique sessions">Registration funnel</CardTitle>
          <div className="grid gap-2">
            {m.funnel.map((f) => {
              const max = Math.max(1, m.funnel[0].value);
              return (
                <div key={f.step}>
                  <div className="flex justify-between text-sm"><span>{f.step}</span><span className="font-semibold tabular-nums">{f.value.toLocaleString("en-IN")}</span></div>
                  <div className="mt-1 h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary/80" style={{ width: `${(f.value / max) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-muted/60 p-2"><dt className="text-muted-foreground">View → start</dt><dd className="text-base font-semibold">{pct(m.conversion.viewToStart)}</dd></div>
            <div className="rounded-md bg-muted/60 p-2"><dt className="text-muted-foreground">Start → registration</dt><dd className="text-base font-semibold">{pct(m.conversion.startToRegistration)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">Rates use tracked sessions only. WhatsApp message views and link clicks inside apps can&apos;t be measured, so reach-level CTR is not shown.</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardTitle icon={<Building2 className="h-4 w-4" />} hint="Registrations">College performance</CardTitle>
          <ul className="grid gap-2.5">
            {m.colleges.slice(0, 8).map((c) => (
              <li key={c.college}>
                <div className="flex justify-between gap-2 text-sm"><span className="truncate">{c.college}</span><span className="font-semibold tabular-nums">{c.count}</span></div>
                <Progress value={c.count / Math.max(1, m.colleges[0].count)} className="mt-1 h-1.5" tone={c.count < m.colleges[0].count * 0.3 ? "warning" : "primary"} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle icon={<Trophy className="h-4 w-4" />} hint={`${m.activeAmbassadors}/${m.ambassadorCount} active · top 20% = ${pct(m.topShare, 0)}`}>Ambassador performance</CardTitle>
          <ol className="grid gap-1.5 text-sm">
            {m.ambassadors.slice(0, 6).map((a, i) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                <span className="flex-1 truncate">{a.name}</span>
                <Badge tone={a.cohort === "leaderboard" ? "primary" : "neutral"}>{a.cohort === "leaderboard" ? "LB" : "ctrl"}</Badge>
                <span className="w-8 text-right font-semibold tabular-nums">{a.count}</span>
              </li>
            ))}
          </ol>
          {m.ambassadors.some((a) => a.count <= 1) && (
            <p className="mt-3 rounded-md bg-warning/10 px-2 py-1.5 text-xs text-warning">{m.ambassadors.filter((a) => a.count <= 1).length} ambassador(s) have ≤1 referral and need support.</p>
          )}
        </Card>

        <Card>
          <CardTitle icon={<Wallet className="h-4 w-4" />} hint={`${inr(m.budget.remaining)} left`}>Budget tracker</CardTitle>
          <p className="text-2xl font-bold">{inr(m.budget.spent)} <span className="text-sm font-normal text-muted-foreground">of {inr(m.budget.total)}</span></p>
          <Progress value={m.budget.spent / m.budget.total} className="mt-2" tone={m.budget.spent / m.budget.total > (m.currentDay / 7) + 0.2 ? "warning" : "primary"} label="Budget used" />
          <ul className="mt-3 grid gap-1.5 text-xs">
            {m.budget.byCategory.map((b) => (
              <li key={b.category} className="flex justify-between"><span className="text-muted-foreground">{b.category}</span><span className={cn("tabular-nums", b.spent > b.planned && "font-semibold text-danger")}>{inr(b.spent)} / {inr(b.planned)}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Cost per registration: {m.budget.costPerRegistration !== null ? inr(Math.round(m.budget.costPerRegistration * 100) / 100) : "—"}</p>
        </Card>
      </div>

      <Card data-testid="experiments">
        <CardTitle icon={<FlaskConical className="h-4 w-4" />} hint={view === "demo" ? "Simulated results — illustrative only" : "Live tracked results"}>Growth experiments</CardTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          {EXPERIMENTS.map((e) => {
            const rows = m.experiments[e.id];
            const unit = e.id === "referral" ? "active ambassadors" : e.id === "form" ? "form starts" : "landing sessions";
            const [a, b] = rows;
            const lift = a.rate !== null && b.rate !== null && b.rate > 0 ? a.rate / b.rate - 1 : null;
            return (
              <div key={e.id} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{e.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{e.metric}</p>
                <table className="mt-3 w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted-foreground"><th className="font-medium">Variant</th><th className="text-right font-medium">{unit}</th><th className="text-right font-medium">Rate</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.variant} className="border-t"><td className="py-1.5 capitalize">{r.variant}</td><td className="text-right tabular-nums">{r.denominator}</td><td className="text-right font-semibold tabular-nums">{e.id === "referral" ? (r.rate?.toFixed(1) ?? "—") : pct(r.rate)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs">
                  {lift === null ? <span className="text-muted-foreground">Not enough data yet.</span> : <>Relative lift: <strong className={lift > 0 ? "text-success" : "text-danger"}>{lift > 0 ? "+" : ""}{pct(lift, 0)}</strong></>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Ship if: {e.threshold}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, sub, icon: Icon, children, testid }: { label: string; value: React.ReactNode; sub: React.ReactNode; icon: React.ComponentType<{ className?: string }>; children?: React.ReactNode; testid: string }) {
  return (
    <Card className="animate-fade-up p-4" data-testid={testid}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</p>
      <div className="mt-1.5 text-3xl font-bold tabular-nums capitalize">{value}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      {children}
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-md bg-muted/60 p-2"><p className="text-muted-foreground">{label}</p><p className="text-lg font-bold tabular-nums">{value}</p></div>;
}

const sevStyle: Record<Severity, { cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { cls: "border-danger/40 bg-danger/5", icon: AlertTriangle },
  warning: { cls: "border-warning/40 bg-warning/5", icon: AlertTriangle },
  info: { cls: "border-border", icon: Info },
  positive: { cls: "border-success/40 bg-success/5", icon: CheckCircle2 },
};

function Rec({ r }: { r: Recommendation }) {
  const { cls, icon: Icon } = sevStyle[r.severity];
  const color = { critical: "text-danger", warning: "text-warning", info: "text-primary", positive: "text-success" }[r.severity];
  return (
    <li className={cn("rounded-md border p-3", cls)} data-rule={r.rule}>
      <p className="flex items-start gap-1.5 text-sm font-semibold"><Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", color)} /> {r.title}</p>
      <p className="mt-1 text-sm">{r.action}</p>
      <p className="mt-1 text-xs text-muted-foreground"><span className="font-mono">{r.rule}</span> · {r.reason}</p>
    </li>
  );
}
