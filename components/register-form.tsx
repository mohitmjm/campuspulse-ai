"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Loader2, Share2, Sparkles, UserCheck } from "lucide-react";
import { BRANCHES, SUGGESTED_COLLEGES } from "@/lib/campaign";
import { readAttribution, track, type Attribution } from "@/lib/track";
import { Badge, Button, Card, FieldError, Input, Label, Select } from "./ui/primitives";

type Errors = Partial<Record<string, string[]>>;
type Done = { confirmationId: string; ambassadorName: string | null; referralIgnored: boolean };

export function RegisterForm() {
  const search = useSearchParams();
  const [attr, setAttr] = useState<Attribution | null>(null);
  const [inviter, setInviter] = useState<{ name: string; college: string; simulated: boolean } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ tone: "danger" | "warning"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const a = readAttribution(new URLSearchParams(search.toString()));
    setAttr(a);
    track("page_view", a);
    if (a.ref) {
      fetch(`/api/ambassadors/${encodeURIComponent(a.ref)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.valid && setInviter(d))
        .catch(() => {});
    }
  }, [search]);

  const long = attr?.formVariant === "long";

  function onFocus() {
    if (!started.current && attr) {
      started.current = true;
      track("form_start", attr);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!attr || loading) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      college: fd.get("college"),
      branch: fd.get("branch"),
      gradYear: fd.get("gradYear"),
      phone: fd.get("phone") ?? undefined,
      experience: fd.get("experience") || undefined,
      goal: fd.get("goal") || undefined,
      consent: fd.get("consent") === "on",
      website: fd.get("website") || undefined,
      ref: attr.ref,
      channel: attr.channel,
      messageVariant: attr.messageVariant,
      formVariant: attr.formVariant,
    };
    setLoading(true);
    setMessage(null);
    track("form_submit", attr);
    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.status === 201) {
        setErrors({});
        setDone(data);
        try { sessionStorage.removeItem("cp_ref"); } catch {}
      } else if (res.status === 409) {
        setMessage({ tone: "warning", text: data.message });
      } else {
        setErrors(data.fieldErrors ?? {});
        setMessage({ tone: "danger", text: data.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setMessage({ tone: "danger", text: "Network error — please check your connection and retry." });
    } finally {
      setLoading(false);
    }
  }

  if (done) return <Confirmation done={done} attr={attr!} />;

  const err = (k: string) => errors[k]?.[0];
  const aria = (k: string) => ({ "aria-invalid": !!err(k), "aria-describedby": err(k) ? `${k}-err` : undefined });
  const year = new Date().getFullYear();

  return (
    <Card className="p-6 shadow-lg shadow-primary/5 md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Reserve your free seat</h2>
        <Badge tone="primary">Takes ~{long ? 60 : 30} seconds</Badge>
      </div>
      {inviter && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary" data-testid="inviter">
          <UserCheck className="h-4 w-4" /> Invited by <strong>{inviter.name}</strong> · {inviter.college}
          {inviter.simulated && <Badge tone="warning">SIMULATED</Badge>}
        </div>
      )}
      <form onSubmit={onSubmit} onFocus={onFocus} noValidate className="grid gap-4" data-testid="register-form" data-variant={attr?.formVariant}>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" required placeholder="Priya Sharma" {...aria("name")} />
          <FieldError id="name-err" msg={err("name")} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@college.edu" {...aria("email")} />
          <FieldError id="email-err" msg={err("email")} />
        </div>
        <div>
          <Label htmlFor="college">College</Label>
          <Input id="college" name="college" list="colleges" required placeholder="Start typing your college" {...aria("college")} />
          <datalist id="colleges">
            {SUGGESTED_COLLEGES.map((c) => <option key={c} value={c} />)}
          </datalist>
          <FieldError id="college-err" msg={err("college")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select id="branch" name="branch" required defaultValue="" {...aria("branch")}>
              <option value="" disabled>Select</option>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </Select>
            <FieldError id="branch-err" msg={err("branch")} />
          </div>
          <div>
            <Label htmlFor="gradYear">Graduating</Label>
            <Select id="gradYear" name="gradYear" required defaultValue={String(year + 1)} {...aria("gradYear")}>
              {[year, year + 1, year + 2].map((y) => <option key={y}>{y}</option>)}
            </Select>
            <FieldError id="gradYear-err" msg={err("gradYear")} />
          </div>
        </div>
        {long && (
          <>
            <div>
              <Label htmlFor="phone">WhatsApp number <span className="font-normal text-muted-foreground">(optional, for reminders)</span></Label>
              <Input id="phone" name="phone" inputMode="numeric" autoComplete="tel-national" placeholder="9876543210" {...aria("phone")} />
              <FieldError id="phone-err" msg={err("phone")} />
            </div>
            <div>
              <Label htmlFor="experience">AI experience</Label>
              <Select id="experience" name="experience" defaultValue="none">
                <option value="none">Never built an AI project</option>
                <option value="some">Followed tutorials</option>
                <option value="built">Built something already</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="goal">What do you want to build? <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="goal" name="goal" maxLength={200} placeholder="A resume screener, a study buddy bot…" />
            </div>
          </>
        )}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" {...aria("consent")} />
          <span>I agree to receive workshop details by email. My data is used only for this workshop.</span>
        </label>
        <FieldError id="consent-err" msg={err("consent")} />
        {message && (
          <p role="alert" data-testid="form-message" className={message.tone === "danger" ? "rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" : "rounded-md bg-warning/15 px-3 py-2 text-sm text-warning"}>
            {message.text}
          </p>
        )}
        <Button type="submit" size="lg" disabled={loading || !attr} data-testid="register-submit">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Reserving…" : "Register for free"}
        </Button>
      </form>
    </Card>
  );
}

function Confirmation({ done, attr }: { done: Done; attr: Attribution }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?utm_source=referral&v=placement` : "";
  const text = `I just signed up for "Build Your First AI Project in 60 Minutes" — free, and you leave with a project for your resume. Join me: ${shareUrl}`;
  return (
    <Card className="animate-fade-up p-6 text-center md:p-8" data-testid="confirmation">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
        <Check className="h-7 w-7" strokeWidth={3} />
      </div>
      <h2 className="text-2xl font-semibold">You&apos;re in!</h2>
      <p className="mt-2 text-muted-foreground">Your seat is reserved. Keep this confirmation ID:</p>
      <p className="mx-auto mt-3 w-fit rounded-md border bg-muted px-4 py-2 font-mono text-lg font-semibold tracking-wider" data-testid="confirmation-id">{done.confirmationId}</p>
      {done.ambassadorName && <p className="mt-3 text-sm text-muted-foreground" data-testid="attributed">Referral credited to <strong>{done.ambassadorName}</strong>.</p>}
      {done.referralIgnored && <p className="mt-3 text-sm text-warning">The referral code wasn&apos;t recognised, but your registration is confirmed.</p>}
      <div className="mt-6 rounded-lg border bg-background p-4 text-left">
        <p className="flex items-center gap-2 text-sm font-semibold"><Share2 className="h-4 w-4 text-accent" /> Learning is better with a friend</p>
        <p className="mt-1 text-sm text-muted-foreground">Bring a classmate — you&apos;ll both have a project to talk about in interviews.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1f9d55] px-4 text-sm font-semibold text-white hover:brightness-110"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("share_click", attr)}
          >
            Share on WhatsApp
          </a>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(text).then(() => setCopied(true));
              track("share_click", attr);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy invite"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
