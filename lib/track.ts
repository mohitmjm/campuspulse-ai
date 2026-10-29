"use client";
// Client-side attribution + anonymous funnel events. Stores only a random session id — no PII.

import { CHANNELS, type Channel } from "./campaign";

export interface Attribution {
  sessionId: string;
  channel?: Channel;
  ref?: string;
  messageVariant?: "placement" | "generic";
  formVariant: "short" | "long";
}

function store(key: string, value?: string) {
  try {
    if (value === undefined) return sessionStorage.getItem(key);
    sessionStorage.setItem(key, value);
  } catch {
    /* storage blocked: fall back to per-page values */
  }
  return value ?? null;
}

export function readAttribution(search: URLSearchParams): Attribution {
  const sessionId = store("cp_sid") ?? store("cp_sid", crypto.randomUUID())!;
  const src = search.get("utm_source") ?? undefined;
  const channel = (CHANNELS as readonly string[]).includes(src ?? "") ? (src as Channel) : undefined;
  const ref = search.get("ref")?.toUpperCase() || store("cp_ref") || undefined;
  if (ref) store("cp_ref", ref);
  const v = search.get("v");
  const messageVariant = v === "placement" || v === "generic" ? v : undefined;
  // Growth Test 3: sticky random form assignment unless forced via ?form=.
  const forced = search.get("form");
  const formVariant = (forced === "short" || forced === "long" ? forced : store("cp_form") ?? (Math.random() < 0.5 ? "short" : "long")) as "short" | "long";
  store("cp_form", formVariant);
  return { sessionId, channel, ref, messageVariant, formVariant };
}

export function track(type: "page_view" | "form_start" | "form_submit" | "share_click", a: Partial<Attribution> & { sessionId: string; referralCode?: string }) {
  const body = JSON.stringify({ type, sessionId: a.sessionId, channel: a.channel, messageVariant: a.messageVariant, formVariant: a.formVariant, referralCode: a.referralCode ?? a.ref });
  fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
}
