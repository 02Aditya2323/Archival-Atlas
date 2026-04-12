"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Suggestion } from "@/lib/search/types";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils/classNames";

interface SearchBarProps {
  query: string;
  resultCount: number;
  totalDocuments: number;
  suggestions: Suggestion[];
  advanced: boolean;
  isRefining: boolean;
  onQueryChange: (value: string) => void;
  onClear: () => void;
  onSuggestionSelect: (value: string) => void;
  onToggleAdvanced: () => void;
}

export function SearchBar({
  query,
  resultCount,
  totalDocuments,
  suggestions,
  advanced,
  isRefining,
  onQueryChange,
  onClear,
  onSuggestionSelect,
  onToggleAdvanced,
}: SearchBarProps) {
  const hasSuggestions = query && suggestions.length > 0;

  return (
    <section className="panel-strong hero-gradient animated-enter relative z-20 overflow-visible rounded-[2rem] p-5 md:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--muted-foreground)] uppercase">
              Intelligent archival discovery
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-[var(--foreground)] md:text-6xl">
              Search historical records like a curator, not a database.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] md:text-base">
              Query across titles, descriptions, subjects, tags, and contextual metadata.
              Ranking favors exact archival signals, curated descriptors, and cross-field evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal">{resultCount} active records</Badge>
            <Badge>{totalDocuments} total documents</Badge>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col gap-3 rounded-[1.8rem] border border-[var(--border-strong)] bg-[rgba(255,252,247,0.92)] p-3 shadow-[0_18px_44px_rgba(54,38,20,0.08)] md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.4rem] border border-transparent bg-[rgba(77,56,30,0.04)] px-4 py-3">
              <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder='Try "persian gulf", place:doha, or "maritime trade"'
                className="focus-ring min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                aria-label="Search the archive"
              />
              {query ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="focus-ring rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[rgba(77,56,30,0.08)]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleAdvanced}
                className={cn(
                  "focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors",
                  advanced
                    ? "border-[rgba(47,111,104,0.28)] bg-[rgba(47,111,104,0.12)] text-[var(--accent-teal)]"
                    : "border-[var(--border)] bg-white/70 text-[var(--foreground)]",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced
              </button>
              <div className="rounded-full border border-[rgba(77,56,30,0.12)] bg-white/80 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                {isRefining ? "Refining…" : `${resultCount} records`}
              </div>
            </div>
          </div>

          {hasSuggestions ? (
            <div className="panel mt-3 rounded-[1.4rem] p-2 shadow-[0_24px_48px_rgba(54,38,20,0.12)]">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.category}-${suggestion.value}`}
                  type="button"
                  onClick={() => onSuggestionSelect(suggestion.value)}
                  className="focus-ring flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left transition-colors hover:bg-[rgba(77,56,30,0.05)]"
                >
                  <span className="text-sm text-[var(--foreground)]">{suggestion.label}</span>
                  <span className="text-xs font-medium tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
                    {suggestion.category}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
