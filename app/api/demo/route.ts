import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { loadScenario, resetDemo, SCENARIOS } from "@/lib/simulation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("load"), scenario: z.enum(Object.keys(SCENARIOS) as [keyof typeof SCENARIOS]) }),
  z.object({ action: z.literal("reset") }),
]);

// Loading a scenario writes ~2k rows; allow more than the default serverless timeout.
export const maxDuration = 60;

// Only ever touches isDemo=true rows. Real registrations cannot be modified from here.
export async function POST(req: Request) {
  if (!rateLimit(`demo:${clientKey(req)}`, 10, 60_000)) return NextResponse.json({ error: "Slow down" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (parsed.data.action === "reset") {
    await resetDemo(prisma);
    return NextResponse.json({ ok: true, reset: true });
  }
  const counts = await loadScenario(prisma, parsed.data.scenario);
  return NextResponse.json({ ok: true, scenario: parsed.data.scenario, ...counts });
}
