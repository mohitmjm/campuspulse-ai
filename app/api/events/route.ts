import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventSchema, normalizeRefCode } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`evt:${clientKey(req)}`, 60, 60_000)) return new NextResponse(null, { status: 429 });
  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const e = parsed.data;
  // One event of each type per session keeps funnel counts honest under refreshes.
  const seen = await prisma.event.findFirst({ where: { sessionId: e.sessionId, type: e.type, isDemo: false }, select: { id: true } });
  if (!seen) {
    await prisma.event.create({ data: { ...e, referralCode: normalizeRefCode(e.referralCode), isDemo: false } });
  }
  return new NextResponse(null, { status: 204 });
}
