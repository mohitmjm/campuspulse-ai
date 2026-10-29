import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:brightness-110 hover:shadow",
        accent: "bg-accent text-accent-foreground shadow-sm hover:brightness-105",
        outline: "border bg-card hover:bg-muted",
        ghost: "hover:bg-muted",
      },
      size: { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>>(
  ({ className, variant, size, ...props }, ref) => <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />,
);
Button.displayName = "Button";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-lg border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]", className)} {...props} />;
}

export function CardTitle({ children, icon, hint, className }: { children: React.ReactNode; icon?: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {icon && <span className="text-primary">{icon}</span>}
        {children}
      </h3>
      {hint && <span className="text-right text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

const badgeTone = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};
export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", badgeTone[tone], className)} {...props} />;
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("mb-1.5 block text-sm font-medium", props.className)} />;
}

const field =
  "h-11 w-full rounded-md border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground/70 hover:border-foreground/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/25 aria-[invalid=true]:border-danger";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => <input ref={ref} {...props} className={cn(field, props.className)} />);
Input.displayName = "Input";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => <select ref={ref} {...props} className={cn(field, "pr-8", props.className)} />);
Select.displayName = "Select";

export function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return <p id={id} role="alert" className="mt-1 text-xs font-medium text-danger">{msg}</p>;
}

export function Progress({ value, className, tone = "primary", label }: { value: number; className?: string; tone?: "primary" | "accent" | "warning" | "danger"; label?: string }) {
  const bg = { primary: "bg-primary", accent: "bg-accent", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-label={label} aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", bg)} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

export function SimBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning" data-testid="sim-banner">
      <span className="rounded bg-warning px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white dark:text-black">SIMULATED</span>
      <span>{children ?? "Demo data generated for illustration. Not real campaign results."}</span>
    </div>
  );
}
