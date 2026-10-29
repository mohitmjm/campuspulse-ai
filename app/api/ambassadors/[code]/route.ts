import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeRefCode } from "@/lib/validation";
import { publicName } from "@/lib/utils";

// Public lookup used by the landing page to show "Invited by …". Returns no contact details.
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const code = normalizeRefCode(params.code);
  const amb = code ? await prisma.ambassador.findFirst({ where: { code }, select: { name: true, college: true, isDemo: true } }) : null;
  if (!amb) return NextResponse.json({ valid: false }, { status: 404 });
  return NextResponse.json({ valid: true, name: publicName(amb.name), college: amb.college, simulated: amb.isDemo });
}
