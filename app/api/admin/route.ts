import { NextResponse } from "next/server";
import { canViewReal } from "@/lib/access";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`admin:${clientKey(req)}`, 5, 60_000)) return NextResponse.json({ error: "Slow down" }, { status: 429 });
  const { key } = (await req.json().catch(() => ({}))) as { key?: string };
  if (!canViewReal(key)) return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cp_admin", key!, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
  return res;
}
