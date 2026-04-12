"use client";

import type { SearchFilters } from "@/lib/search/types";
import { formatYearLabel } from "@/lib/utils/formatters";

interface ActiveFilterChipsProps {
  filters: SearchFilters;
  onRemove: (key: Exclude<keyof SearchFilters, "dateRange">, value: string) => void;
  onClearDateRange: () => void;
  onClearAll: () => void;
}

const FILTER_LABELS: Record<Exclude<keyof SearchFilters, "dateRange">, string> = {
  institutions: "Institution",
  languages: "Language",
  places: "Place",
  regions: "Region",
  subjects: "Subject",
  types: "Type",
};

export function ActiveFilterChips({
  filters,
  onRemove,
  onClearDateRange,
  onClearAll,
}: ActiveFilterChipsProps) {
  const entries = (Object.entries(filters) as Array<[keyof SearchFilters, SearchFilters[keyof SearchFilters]]>)
    .filter(([key]) => key !== "dateRange")
    .flatMap(([key, values]) =>
      (values as string[]).map((value) => ({
        key: key as Exclude<keyof SearchFilters, "dateRange">,
        value,
      })),
    );

  const hasFilters = entries.length > 0 || Boolean(filters.dateRange);

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map((entry) => (
        <button
          key={`${entry.key}-${entry.value}`}
          type="button"
          onClick={() => onRemove(entry.key, entry.value)}
          className="focus-ring pill px-3 py-2 text-sm text-[var(--foreground)]"
        >
          {FILTER_LABELS[entry.key]}: {entry.value} ×
        </button>
      ))}

      {filters.dateRange ? (
        <button
          type="button"
          onClick={onClearDateRange}
          className="focus-ring pill px-3 py-2 text-sm text-[var(--foreground)]"
        >
          Date: {formatYearLabel(filters.dateRange[0])} to {formatYearLabel(filters.dateRange[1])} ×
        </button>
      ) : null}

      <button
        type="button"
        onClick={onClearAll}
        className="focus-ring rounded-full px-2 py-2 text-sm font-medium text-[var(--accent)]"
      >
        Clear all
      </button>
    </div>
  );
}
