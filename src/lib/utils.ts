import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a URL-safe slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format a compliance score as a color class */
export function scoreColor(score: number): string {
  if (score >= 80) return "text-compliant";
  if (score >= 50) return "text-warning";
  return "text-violation";
}

/** Format a compliance score as a label */
export function scoreLabel(score: number): string {
  if (score >= 80) return "Compliant";
  if (score >= 50) return "Needs Attention";
  return "Issues Found";
}
