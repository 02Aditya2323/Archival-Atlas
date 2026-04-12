import type { ReactNode } from "react";
import { cn } from "@/lib/utils/classNames";

interface BadgeProps {
  children: ReactNode;
  tone?: "default" | "accent" | "teal" | "muted";
  className?: string;
}

const TONE_STYLES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default:
    "border-[rgba(77,56,30,0.14)] bg-[rgba(255,250,242,0.92)] text-[var(--foreground)]",
  accent:
    "border-[rgba(159,79,45,0.16)] bg-[rgba(159,79,45,0.1)] text-[var(--accent)]",
  teal:
    "border-[rgba(47,111,104,0.18)] bg-[rgba(47,111,104,0.12)] text-[var(--accent-teal)]",
  muted:
    "border-transparent bg-[rgba(77,56,30,0.06)] text-[var(--muted-foreground)]",
};

export function Badge({ children, className, tone = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase",
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
