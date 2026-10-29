import { Medal, Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { publicName } from "@/lib/utils";
import { Badge, Card, CardTitle, SimBanner } from "@/components/ui/primitives";
import { CodeLookup, OnboardForm } from "@/components/ambassador-client";

export const dynamic = "force-dynamic";

async function leaderboard() {
  // Real ambassadors take precedence; fall back to the labelled simulation so the page is never empty in a demo.
  const realCount = await prisma.ambassador.count({ where: { isDemo: false } });
  const isDemo = realCount === 0;
  const ambassadors = await prisma.ambassador.findMany({
    where: { isDemo },
    select: { name: true, college: true, cohort: true, _count: { select: { registrations: true } } },
  });
  const rows = ambassadors
    .filter((a) => a.cohort === "leaderboard") // Growth Test 2: only the recognition cohort is shown publicly.
    .map((a) => ({ name: publicName(a.name), college: a.college, count: a._count.registrations }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const colleges = new Map<string, number>();
  for (const a of ambassadors) colleges.set(a.college, (colleges.get(a.college) ?? 0) + a._count.registrations);
  return { isDemo, rows, colleges: [...colleges.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6) };
}

export default async function AmbassadorPage() {
  const lb = await leaderboard();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">Campus Ambassador Portal</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Bring your campus. Get recognised.</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Share one link in your class groups. Every registration through it is credited to you, live. Top ambassadors are recognised on Day 7.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-6">
          <OnboardForm />
          <Card>
            <CardTitle>Already an ambassador?</CardTitle>
            <CodeLookup />
          </Card>
        </div>
        <div className="grid content-start gap-6">
          {lb.isDemo && <SimBanner>No real ambassadors yet — showing the simulated leaderboard.</SimBanner>}
          <Card data-testid="leaderboard">
            <CardTitle icon={<Trophy className="h-4 w-4" />} hint="Recognition cohort">Ambassador leaderboard</CardTitle>
            {lb.rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No ambassadors yet. Be the first on the board.</p>
            ) : (
              <ol className="divide-y">
                {lb.rows.map((r, i) => (
                  <li key={`${r.name}-${i}`} className="flex items-center gap-3 py-2.5">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i < 3 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{i < 3 ? <Medal className="h-3.5 w-3.5" /> : i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.college}</p>
                    </div>
                    <Badge tone="primary">{r.count}</Badge>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          <Card>
            <CardTitle hint="Ambassador-attributed registrations">College leaderboard</CardTitle>
            <ul className="grid gap-2">
              {lb.colleges.map(([c, n]) => (
                <li key={c} className="flex items-center justify-between text-sm"><span className="truncate pr-3">{c}</span><span className="font-semibold tabular-nums">{n}</span></li>
              ))}
              {lb.colleges.length === 0 && <li className="text-sm text-muted-foreground">No colleges yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
