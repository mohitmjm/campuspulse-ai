import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadMetrics } from "@/lib/analytics";
import { adminKeyFrom, resolveView } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const { isDemo, denied } = resolveView(url.searchParams.get("view"), adminKeyFrom(req));
  if (denied) return NextResponse.json({ error: "Real campaign data requires the admin key." }, { status: 401 });
  const { metrics, scenario } = await loadMetrics(prisma, isDemo);
  return NextResponse.json({ simulated: isDemo, scenario, metrics });
}
