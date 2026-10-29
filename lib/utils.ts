import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const pct = (n: number | null, digits = 1) => (n === null ? "—" : `${(n * 100).toFixed(digits)}%`);

/** "Priya Sharma" -> "Priya S." — leaderboards never show full names. */
export function publicName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}
