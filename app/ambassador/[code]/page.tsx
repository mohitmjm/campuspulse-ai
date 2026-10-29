import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BarChart3, Link2, PartyPopper, Target, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { normalizeRefCode } from "@/lib/validation";
import { publicName } from "@/lib/utils";
import { Badge, Card, CardTitle, Progress, SimBanner } from "@/components/ui/primitives";
import { CopyBlock } from "@/components/ambassador-client";

export const dynamic = "force-dynamic";

const GOAL = 12; // ≈ 500 / 40 ambassadors

export default async function AmbassadorDashboard({ params, searchParams }: { params: { code: string }; searchParams: { welcome?: string; existing?: string } }) {
  const code = normalizeRefCode(params.code);
  if (!code) notFound();
  const amb = await prisma.ambassador.findUnique({ where: { code } });
  if (!amb) notFound();

  const [regs, peers] = await Promise.all([
    prisma.registration.findMany({ where: { ambassadorId: amb.id }, select: { createdAt: true, branch: true } }),
    prisma.ambassador.findMany({ where: { isDemo: amb.isDemo }, select: { id: true, _count: { select: { registrations: true } } } }),
  ]);
  const rank = 1 + peers.filter((p) => p._count.registrations > regs.length).length;
  const h = headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const link = (v: string) => `${origin}/?ref=${amb.code}&utm_source=whatsapp&v=${v}`;
  const first = amb.name.split(" ")[0];

  const byBranch = new Map<string, number>();
  regs.forEach((r) => byBranch.set(r.branch, (byBranch.get(r.branch) ?? 0) + 1));

  const placementMsg = `Placements are coming — "what have you built?" is the first question. 🎯\n\nFree 60-min live workshop: build your first AI project and leave with a GitHub repo you can show in interviews. No AI experience needed.\n\nRegister (free): ${link("placement")}\n— ${first}`;
  const genericMsg = `Want to learn AI? 🤖\n\nJoin a free live workshop: "Build Your First AI Project in 60 Minutes". Beginner friendly, any branch.\n\nRegister: ${link("generic")}\n— ${first}`;
  const reminderMsg = `Quick reminder 👋 seats for the free AI project workshop are filling up. If you want a portfolio project before placements, register here: ${link("placement")}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {amb.isDemo && <div className="mb-4"><SimBanner>This is a simulated ambassador from the demo scenario.</SimBanner></div>}
      {searchParams.welcome && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success" data-testid="welcome">
          <PartyPopper className="h-4 w-4" /> Welcome aboard, {first}! Bookmark this page — it&apos;s your personal dashboard.
        </div>
      )}
      {searchParams.existing && <p className="mb-6 rounded-lg bg-muted px-4 py-3 text-sm">You&apos;re already registered as an ambassador — here&apos;s your existing dashboard.</p>}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Ambassador dashboard</p>
          <h1 className="text-3xl font-bold">{publicName(amb.name)}</h1>
          <p className="text-muted-foreground">{amb.college}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Your code</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-primary" data-testid="amb-code">{amb.code}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle icon={<Users className="h-4 w-4" />}>Registrations</CardTitle>
          <p className="text-4xl font-bold tabular-nums" data-testid="amb-count">{regs.length}</p>
          <Progress className="mt-3" value={regs.length / GOAL} tone="accent" label="Progress to personal goal" />
          <p className="mt-2 text-xs text-muted-foreground">Personal goal: {GOAL}</p>
        </Card>
        <Card>
          <CardTitle icon={<Target className="h-4 w-4" />}>Rank</CardTitle>
          <p className="text-4xl font-bold tabular-nums">#{rank}<span className="text-base font-normal text-muted-foreground"> of {peers.length}</span></p>
          <Badge className="mt-3" tone={amb.cohort === "leaderboard" ? "primary" : "neutral"}>{amb.cohort === "leaderboard" ? "On public leaderboard" : "Private tracking"}</Badge>
        </Card>
        <Card>
          <CardTitle icon={<BarChart3 className="h-4 w-4" />}>By branch</CardTitle>
          {byBranch.size === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet — send your first message below. Most ambassadors get their first sign-up within an hour of posting.</p>
          ) : (
            <ul className="grid gap-1 text-sm">{[...byBranch.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([b, n]) => <li key={b} className="flex justify-between"><span>{b}</span><span className="font-semibold">{n}</span></li>)}</ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle icon={<Link2 className="h-4 w-4" />} hint="Each link is tracked for Growth Test 1">Your share kit</CardTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <CopyBlock label="Message A · placement angle" text={placementMsg} whatsapp code={amb.code} />
          <CopyBlock label="Message B · learn-AI angle" text={genericMsg} whatsapp code={amb.code} />
          <CopyBlock label="Day 3–6 reminder" text={reminderMsg} whatsapp code={amb.code} />
          <CopyBlock label="Plain referral link" text={link("placement")} code={amb.code} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Please alternate A and B across your groups, and only post where promotions are allowed. <Link href="/plan#experiments" className="underline">Why?</Link></p>
      </Card>
    </div>
  );
}
