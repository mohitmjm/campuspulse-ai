import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registrationSchema } from "@/lib/validation";
import { registerStudent } from "@/lib/registration";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`reg:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ error: "Rejected" }, { status: 400 });

  const result = await registerStudent(prisma, parsed.data);
  if (result.status === "duplicate") {
    return NextResponse.json({ status: "duplicate", message: "This email is already registered. Check your inbox for your confirmation." }, { status: 409 });
  }
  return NextResponse.json(result, { status: 201 });
}
