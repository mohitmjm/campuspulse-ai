"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Copy, Loader2, MessageCircle } from "lucide-react";
import { Button, Card, FieldError, Input, Label } from "./ui/primitives";

export function OnboardForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/ambassadors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), college: fd.get("college"), consent: fd.get("consent") === "on", website: fd.get("website") || undefined }),
    }).catch(() => null);
    setLoading(false);
    if (!res) return setMsg("Network error — please retry.");
    const data = await res.json();
    if (res.ok) router.push(`/ambassador/${data.code}${data.existing ? "?existing=1" : "?welcome=1"}`);
    else {
      setErrors(data.fieldErrors ?? {});
      setMsg(data.error);
    }
  }
  const err = (k: string) => errors[k]?.[0];
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Become a campus ambassador</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Get your personal referral link, ready-to-send WhatsApp messages and a live dashboard.</p>
      <form onSubmit={submit} noValidate className="grid gap-3" data-testid="ambassador-form">
        <div>
          <Label htmlFor="a-name">Full name</Label>
          <Input id="a-name" name="name" autoComplete="name" aria-invalid={!!err("name")} />
          <FieldError id="a-name-err" msg={err("name")} />
        </div>
        <div>
          <Label htmlFor="a-email">Email</Label>
          <Input id="a-email" name="email" type="email" autoComplete="email" aria-invalid={!!err("email")} />
          <FieldError id="a-email-err" msg={err("email")} />
        </div>
        <div>
          <Label htmlFor="a-college">College</Label>
          <Input id="a-college" name="college" aria-invalid={!!err("college")} />
          <FieldError id="a-college-err" msg={err("college")} />
        </div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="consent" className="mt-1 h-4 w-4" /> I&apos;ll only share in groups where promotion is allowed, and my first name may appear on the leaderboard.
        </label>
        <FieldError id="a-consent-err" msg={err("consent")} />
        {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
        <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Get my referral link</Button>
      </form>
    </Card>
  );
}

export function CodeLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) router.push(`/ambassador/${encodeURIComponent(code.trim().toUpperCase())}`);
      }}
    >
      <Input aria-label="Referral code" placeholder="Your code, e.g. PRIY7K2" value={code} onChange={(e) => setCode(e.target.value)} className="font-mono uppercase" />
      <Button type="submit" variant="outline">Open</Button>
    </form>
  );
}

export function CopyBlock({ label, text, whatsapp, code }: { label: string; text: string; whatsapp?: boolean; code?: string }) {
  const [copied, setCopied] = useState(false);
  const share = () => {
    if (!code) return;
    const sid = (() => { try { return sessionStorage.getItem("cp_sid") ?? crypto.randomUUID(); } catch { return crypto.randomUUID(); } })();
    fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "share_click", sessionId: sid, referralCode: code }) }).catch(() => {});
  };
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard?.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
            share();
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </Button>
        {whatsapp && (
          <a onClick={share} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1f9d55] px-3 text-sm font-semibold text-white hover:brightness-110">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
