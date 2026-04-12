"use client";

import { useState } from "react";
import type { FacetValueCount } from "@/lib/search/types";
import { cn } from "@/lib/utils/classNames";

interface FacetSectionProps {
  title: string;
  options: FacetValueCount[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  limit?: number;
}

export function FacetSection({
  title,
  options,
  selectedValues,
  onToggle,
  limit = 8,
}: FacetSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleOptions = expanded ? options : options.slice(0, limit);

  return (
    <section className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,252,246,0.68)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
        <span className="text-xs text-[var(--muted-foreground)]">{options.length}</span>
      </div>

      {visibleOptions.length ? (
        <div className="space-y-2">
          {visibleOptions.map((option) => {
            const checked = selectedValues.includes(option.value);

            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
                  checked
                    ? "border-[rgba(47,111,104,0.32)] bg-[rgba(47,111,104,0.11)]"
                    : "border-transparent bg-[rgba(77,56,30,0.04)] hover:border-[rgba(77,56,30,0.12)]",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(option.value)}
                    className="focus-ring h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent-teal)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{option.value}</span>
                </span>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {option.count}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">No matching values.</p>
      )}

      {options.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="focus-ring mt-3 text-sm font-medium text-[var(--accent)]"
        >
          {expanded ? "Show fewer" : `Show all ${options.length}`}
        </button>
      ) : null}
    </section>
  );
}
