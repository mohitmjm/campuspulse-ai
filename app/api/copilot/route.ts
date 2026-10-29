import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadMetrics } from "@/lib/analytics";
import { llmNarrative, runCopilot } from "@/lib/copilot";
import { adminKeyFrom, resolveView } from "@/lib/access";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { view?: string; narrative?: boolean };
  const { isDemo, denied } = resolveView(body.view, adminKeyFrom(req));
  if (denied) return NextResponse.json({ error: "Real campaign data requires the admin key." }, { status: 401 });
  const { metrics } = await loadMetrics(prisma, isDemo);
  const report = runCopilot(metrics);
  let narrative: string | null = null;
  if (body.narrative && rateLimit(`llm:${clientKey(req)}`, 5, 60_000)) narrative = await llmNarrative(report).catch(() => null);
  return NextResponse.json({ simulated: isDemo, report, narrative, llmConfigured: !!process.env.ANTHROPIC_API_KEY });
}
