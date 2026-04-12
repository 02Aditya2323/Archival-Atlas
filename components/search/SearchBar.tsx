"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Suggestion } from "@/lib/search/types";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils/classNames";
import { normalizeText } from "@/lib/search/normalizeText";

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
  const listboxId = useId();
  const blurTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [dismissedQuery, setDismissedQuery] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const normalizedQuery = normalizeText(query);
  const hasSuggestions =
    isFocused &&
    normalizedQuery.length > 1 &&
    suggestions.length > 0 &&
    dismissedQuery !== normalizedQuery;

  const clearBlurTimeout = () => {
    if (blurTimeoutRef.current !== null) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!hasSuggestions) {
      setActiveSuggestionIndex(-1);
      return;
    }

    setActiveSuggestionIndex((current) =>
      current >= suggestions.length ? suggestions.length - 1 : current,
    );
  }, [hasSuggestions, suggestions.length]);

  useEffect(() => {
    if (activeSuggestionIndex < 0) {
      return;
    }

    suggestionRefs.current[activeSuggestionIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeSuggestionIndex]);

  const selectSuggestion = (value: string) => {
    const normalizedValue = normalizeText(value);
    clearBlurTimeout();
    setDismissedQuery(normalizedValue);
    setActiveSuggestionIndex(-1);
    onSuggestionSelect(value);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <section
      className={cn(
        "panel-strong hero-gradient animated-enter relative overflow-visible rounded-[2rem] p-4 md:p-5",
        hasSuggestions ? "z-40" : "z-20",
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--muted-foreground)] uppercase">
              Archive workspace
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-[var(--foreground)] md:text-5xl">
              Search historical records with curatorial precision.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)] md:text-[15px]">
              Query titles, descriptions, subjects, tags, and contextual metadata without giving
              up ranking depth, filtering speed, or archival clarity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal">{resultCount} active records</Badge>
            <Badge>{totalDocuments} total documents</Badge>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col gap-3 rounded-[1.8rem] border border-[var(--border-strong)] bg-[rgba(255,252,247,0.92)] p-2.5 shadow-[0_18px_44px_rgba(54,38,20,0.08)] md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-3 rounded-[1.4rem] border border-transparent bg-[rgba(77,56,30,0.04)] px-4 py-3">
                <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setDismissedQuery(null);
                    setActiveSuggestionIndex(-1);
                    onQueryChange(event.target.value);
                  }}
                  onFocus={() => {
                    clearBlurTimeout();
                    setIsFocused(true);
                  }}
                  onBlur={() => {
                    blurTimeoutRef.current = window.setTimeout(() => {
                      setIsFocused(false);
                      setActiveSuggestionIndex(-1);
                    }, 120);
                  }}
                  onKeyDown={(event) => {
                    if (!hasSuggestions) {
                      if (event.key === "Escape") {
                        setDismissedQuery(normalizedQuery);
                      }
                      return;
                    }

                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveSuggestionIndex((current) =>
                        current >= suggestions.length - 1 ? 0 : current + 1,
                      );
                    }

                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveSuggestionIndex((current) =>
                        current <= 0 ? suggestions.length - 1 : current - 1,
                      );
                    }

                    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
                      event.preventDefault();
                      selectSuggestion(suggestions[activeSuggestionIndex].value);
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      setDismissedQuery(normalizedQuery);
                      setActiveSuggestionIndex(-1);
                    }
                  }}
                  placeholder='Try "persian gulf", place:doha, or "maritime trade"'
                  className="focus-ring min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  aria-label="Search the archive"
                  aria-expanded={hasSuggestions}
                  aria-controls={hasSuggestions ? listboxId : undefined}
                  aria-activedescendant={
                    hasSuggestions && activeSuggestionIndex >= 0
                      ? `${listboxId}-option-${activeSuggestionIndex}`
                      : undefined
                  }
                  role="combobox"
                  aria-autocomplete="list"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedQuery(null);
                      setActiveSuggestionIndex(-1);
                      onClear();
                      requestAnimationFrame(() => {
                        inputRef.current?.focus();
                      });
                    }}
                    className="focus-ring rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[rgba(77,56,30,0.08)]"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {hasSuggestions ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-3">
                  <div className="rounded-[1.45rem] border border-[rgba(77,56,30,0.14)] bg-[rgba(255,251,244,0.985)] shadow-[0_28px_56px_rgba(54,38,20,0.16)] backdrop-blur-xl">
                    <div
                      id={listboxId}
                      role="listbox"
                      className="max-h-72 overflow-y-auto p-2"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.category}-${suggestion.value}`}
                          ref={(element) => {
                            suggestionRefs.current[index] = element;
                          }}
                          id={`${listboxId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeSuggestionIndex === index}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            selectSuggestion(suggestion.value);
                          }}
                          className={cn(
                            "focus-ring flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left transition-colors",
                            activeSuggestionIndex === index
                              ? "bg-[rgba(77,56,30,0.08)]"
                              : "hover:bg-[rgba(77,56,30,0.05)]",
                          )}
                        >
                          <span className="text-sm text-[var(--foreground)]">{suggestion.label}</span>
                          <span className="text-xs font-medium tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
                            {suggestion.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleAdvanced}
                className={cn(
                  "focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                  advanced
                    ? "border-[rgba(47,111,104,0.28)] bg-[rgba(47,111,104,0.12)] text-[var(--accent-teal)]"
                    : "border-[var(--border)] bg-white/70 text-[var(--foreground)]",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced
              </button>
              <div className="rounded-full border border-[rgba(77,56,30,0.12)] bg-white/80 px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
                {isRefining ? "Refining…" : `${resultCount} records`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
