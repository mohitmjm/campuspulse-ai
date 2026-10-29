"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Workshop" },
  { href: "/ambassador", label: "Ambassadors" },
  { href: "/dashboard", label: "Command Center" },
  { href: "/plan", label: "Growth Plan" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Activity className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span>
        CampusPulse<span className="text-accent"> AI</span>
      </span>
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", active(l.href) && "bg-muted text-foreground")}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="grid h-9 w-9 place-items-center rounded-md border md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn("block rounded-md px-3 py-2.5 text-sm font-medium", active(l.href) && "bg-muted")}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 md:flex-row md:items-center md:justify-between">
        <span>CampusPulse AI · NxtWave Growth Challenge simulation — no real outreach was run.</span>
        <span>Demo data is always labelled SIMULATED.</span>
      </div>
    </footer>
  );
}
