"use client";

import type { FacetCounts, SearchFilters } from "@/lib/search/types";
import { DateRangeFilter } from "./DateRangeFilter";
import { FacetSection } from "./FacetSection";

interface FilterSidebarProps {
  facetCounts: FacetCounts;
  filters: SearchFilters;
  yearBounds: [number, number];
  onToggleFilter: (
    key: Exclude<keyof SearchFilters, "dateRange">,
    value: string,
  ) => void;
  onDateRangeChange: (value: [number, number] | null) => void;
  onClearAll: () => void;
}

export function FilterSidebar({
  facetCounts,
  filters,
  yearBounds,
  onToggleFilter,
  onDateRangeChange,
  onClearAll,
}: FilterSidebarProps) {
  return (
    <aside className="panel rounded-[1.8rem] p-4 lg:sticky lg:top-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
            Faceted filters
          </p>
          <h2 className="mt-1 font-display text-2xl text-[var(--foreground)]">
            Narrow the archive
          </h2>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="focus-ring text-sm font-medium text-[var(--accent)]"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        <DateRangeFilter
          minYear={yearBounds[0]}
          maxYear={yearBounds[1]}
          value={filters.dateRange}
          onChange={onDateRangeChange}
        />
        <FacetSection
          title="Document type"
          options={facetCounts.types}
          selectedValues={filters.types}
          onToggle={(value) => onToggleFilter("types", value)}
        />
        <FacetSection
          title="Place"
          options={facetCounts.places}
          selectedValues={filters.places}
          onToggle={(value) => onToggleFilter("places", value)}
        />
        <FacetSection
          title="Region"
          options={facetCounts.regions}
          selectedValues={filters.regions}
          onToggle={(value) => onToggleFilter("regions", value)}
        />
        <FacetSection
          title="Language"
          options={facetCounts.languages}
          selectedValues={filters.languages}
          onToggle={(value) => onToggleFilter("languages", value)}
        />
        <FacetSection
          title="Subjects"
          options={facetCounts.subjects}
          selectedValues={filters.subjects}
          onToggle={(value) => onToggleFilter("subjects", value)}
        />
        <FacetSection
          title="Institution"
          options={facetCounts.institutions}
          selectedValues={filters.institutions}
          onToggle={(value) => onToggleFilter("institutions", value)}
        />
      </div>
    </aside>
  );
}
