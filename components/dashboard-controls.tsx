"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, KeyRound, Loader2, RotateCcw } from "lucide-react";
import { Button, Input } from "./ui/primitives";

const SCENARIOS = [
  { id: "base", label: "Base" },
  { id: "underperforming", label: "Underperforming" },
  { id: "referral", label: "Strong referral" },
];

export function DemoControls({ active }: { active: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  async function run(body: object, id: string) {
    setBusy(id);
    setError(null);
    const res = await fetch("/api/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (!res?.ok) setError(`Couldn't ${id === "reset" ? "reset the demo" : "load the scenario"} (${res ? `HTTP ${res.status}` : "network error"}). Please try again.`);
    start(() => router.refresh());
    setBusy(null);
  }
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="demo-controls">
      <span className="text-xs font-medium text-muted-foreground">Load scenario:</span>
      {SCENARIOS.map((s) => (
        <Button key={s.id} size="sm" variant={active === s.id ? "primary" : "outline"} disabled={!!busy} onClick={() => run({ action: "load", scenario: s.id }, s.id)} aria-pressed={active === s.id} data-testid={`scenario-${s.id}`}>
          {busy === s.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {s.label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run({ action: "reset" }, "reset")} data-testid="demo-reset">
        {busy === "reset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Reset demo
      </Button>
      {error && <p role="alert" className="w-full text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function AdminUnlock() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key }) });
        if (res.ok) router.push("/dashboard?view=real");
        else setErr("Invalid key");
      }}
    >
      <Input type="password" aria-label="Admin key" placeholder="Admin key" value={key} onChange={(e) => setKey(e.target.value)} className="h-9" />
      <Button size="sm" variant="outline" type="submit" className="h-9"><KeyRound className="h-3.5 w-3.5" /> Unlock</Button>
      {err && <span role="alert" className="self-center text-xs text-danger">{err}</span>}
    </form>
  );
}

export function NarrativeButton({ view, configured }: { view: string; configured: boolean }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!configured) {
    return <p className="text-xs text-muted-foreground">LLM narrative: off (no ANTHROPIC_API_KEY on the server). All recommendations above come from the deterministic rules engine.</p>;
  }
  return (
    <div className="grid gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const r = await fetch("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ view, narrative: true }) }).then((x) => x.json()).catch(() => null);
          setText(r?.narrative ?? "The LLM request failed — rules-engine output above is unaffected.");
          setLoading(false);
        }}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />} Add LLM-written summary
      </Button>
      {text && (
        <div className="rounded-md border bg-background p-3 text-sm">
          <p className="mb-1 text-xs font-semibold text-accent">LLM narrative (generated from the rules output)</p>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      )}
    </div>
  );
}
