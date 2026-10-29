import { timingSafeEqual } from "node:crypto";

/** Real (non-demo) aggregates require ADMIN_KEY. Demo data is public. No route ever returns student PII. */
export function canViewReal(key: string | null | undefined) {
  const admin = process.env.ADMIN_KEY;
  if (!admin || !key) return false;
  const a = Buffer.from(admin);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function resolveView(view: string | null | undefined, key: string | null | undefined): { isDemo: boolean; denied: boolean } {
  if (view === "real") return canViewReal(key) ? { isDemo: false, denied: false } : { isDemo: true, denied: true };
  return { isDemo: true, denied: false };
}

export function adminKeyFrom(req: Request) {
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)cp_admin=([^;]+)/)?.[1];
  return req.headers.get("x-admin-key") ?? (cookie ? decodeURIComponent(cookie) : null);
}
