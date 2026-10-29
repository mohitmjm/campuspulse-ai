import { Suspense } from "react";
import { Briefcase, Clock, Code2, FileCheck2, GraduationCap, Rocket, Sparkles, Trophy } from "lucide-react";
import { RegisterForm } from "@/components/register-form";
import { Badge, Card } from "@/components/ui/primitives";
import { WORKSHOP } from "@/lib/campaign";

const builds = [
  { icon: Code2, title: "A working AI app", body: "A resume-ready mini project — e.g. a document Q&A bot or a smart study planner — running in your browser." },
  { icon: FileCheck2, title: "A GitHub-ready repo", body: "Clean code and a README you can link from your resume and LinkedIn the same evening." },
  { icon: Sparkles, title: "Prompting that works", body: "How to break a problem down, prompt an AI model reliably and check its output." },
];

const placement = [
  { icon: Briefcase, title: "Talk about a real project", body: "Interviewers ask 'what have you built?'. Leave with a concrete answer and a demo." },
  { icon: Trophy, title: "Stand out in placements", body: "AI projects show initiative beyond the syllabus — the signal recruiters look for." },
  { icon: GraduationCap, title: "Zero prerequisites", body: "If you can use a browser, you can follow along. Any branch, any college." },
];

const agenda = [
  ["0–10 min", "Pick your project idea from 5 placement-relevant templates"],
  ["10–25 min", "Prompt design: turning a problem into instructions an AI can follow"],
  ["25–50 min", "Build it live, step by step, with mentors answering in chat"],
  ["50–60 min", "Publish to GitHub, write your README, and add it to your resume"],
];

const faqs = [
  ["Is it really free?", "Yes. No payment, no card details — just register with your email."],
  ["Do I need coding experience?", "No. Basic computer skills are enough; we provide starter templates."],
  ["Who is it for?", "Final-year engineering students from any branch preparing for placements."],
  ["What do I need on the day?", "A laptop with a browser and a stable internet connection."],
  ["Will I get a certificate?", "Yes, a participation certificate for everyone who completes the build."],
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div className="animate-fade-up">
            <Badge tone="accent" className="mb-4"><Clock className="h-3 w-3" /> {WORKSHOP.format}</Badge>
            <h1 className="text-4xl font-bold leading-[1.08] md:text-6xl">
              Build your first <span className="text-primary">AI project</span> in 60 minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              A hands-on workshop for final-year engineering students. Walk in with an idea, walk out with a working AI app, a GitHub repo and a story for your placement interviews.
            </p>
            <ul className="mt-6 grid gap-2 text-sm">
              {["Portfolio project you can demo", "No prior AI or ML needed", "Live mentors, free certificate"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Rocket className="h-4 w-4 text-accent" /> {t}</li>
              ))}
            </ul>
            <a href="#register" className="mt-8 inline-flex h-12 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 md:hidden">
              Reserve my seat
            </a>
          </div>
          <div id="register" className="scroll-mt-20">
            <Suspense fallback={<Card className="h-[520px] animate-pulse" />}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </section>

      <Section eyebrow="What you'll build" title="One hour. One real project.">
        <div className="grid gap-4 md:grid-cols-3">
          {builds.map((b) => <Feature key={b.title} {...b} />)}
        </div>
      </Section>

      <Section eyebrow="Why it matters" title="Built for placements and portfolios" muted>
        <div className="grid gap-4 md:grid-cols-3">
          {placement.map((b) => <Feature key={b.title} {...b} />)}
        </div>
      </Section>

      <Section eyebrow="Agenda" title="Exactly how the 60 minutes go">
        <ol className="grid gap-3">
          {agenda.map(([t, d], i) => (
            <li key={t} className="flex items-start gap-4 rounded-lg border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
              <div>
                <p className="font-mono text-xs text-muted-foreground">{t}</p>
                <p className="font-medium">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="FAQ" title="Questions students ask" muted>
        <div className="grid gap-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-lg border bg-card p-4 open:shadow-sm">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="flex items-center justify-between">{q}<span className="text-muted-foreground transition group-open:rotate-45">+</span></span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({ eyebrow, title, children, muted }: { eyebrow: string; title: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section className={muted ? "border-y bg-muted/40" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        <h2 className="mb-8 mt-2 text-3xl font-bold">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}
