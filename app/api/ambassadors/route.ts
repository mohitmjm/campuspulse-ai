import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ambassadorSchema } from "@/lib/validation";
import { onboardAmbassador } from "@/lib/registration";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`amb:${clientKey(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const parsed = ambassadorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ error: "Rejected" }, { status: 400 });
  const result = await onboardAmbassador(prisma, parsed.data);
  return NextResponse.json(result, { status: result.existing ? 200 : 201 });
}
