import { Compass, SearchX } from "lucide-react";
import type { SearchResultItem, ViewMode } from "@/lib/search/types";
import { ResultCard } from "./ResultCard";

interface ResultsListProps {
  results: SearchResultItem[];
  visibleCount: number;
  viewMode: ViewMode;
  highlightTerms: string[];
  hasActiveFilters: boolean;
  onSelectRecord: (id: string) => void;
  onLoadMore: () => void;
  onClearFilters: () => void;
  onSuggestionSelect: (value: string) => void;
}

const EMPTY_STATE_SUGGESTIONS = ["trade", "doha", "maps", "maritime"];

export function ResultsList({
  results,
  visibleCount,
  viewMode,
  highlightTerms,
  hasActiveFilters,
  onSelectRecord,
  onLoadMore,
  onClearFilters,
  onSuggestionSelect,
}: ResultsListProps) {
  if (!results.length) {
    return (
      <section className="panel rounded-[1.8rem] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(159,79,45,0.1)] text-[var(--accent)]">
          <SearchX className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-3xl text-[var(--foreground)]">No records found</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
          Try broader terms, remove a few filters, or pivot to nearby themes and places suggested
          below.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {EMPTY_STATE_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionSelect(suggestion)}
              className="focus-ring rounded-full border border-[var(--border)] bg-[rgba(255,250,242,0.92)] px-4 py-2 text-sm text-[var(--foreground)]"
            >
              Try {suggestion}
            </button>
          ))}
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            <Compass className="h-4 w-4" />
            Reset filters
          </button>
        ) : null}
      </section>
    );
  }

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  return (
    <section className="space-y-4">
      <div
        className={
          viewMode === "grid"
            ? "grid gap-4 xl:grid-cols-2"
            : "space-y-4"
        }
      >
        {visibleResults.map((result) => (
          <ResultCard
            key={result.document.id}
            result={result}
            highlightTerms={highlightTerms}
            viewMode={viewMode}
            onSelect={onSelectRecord}
          />
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            className="focus-ring rounded-full border border-[var(--border)] bg-[rgba(255,250,242,0.92)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            Load more records
          </button>
        </div>
      ) : null}
    </section>
  );
}
