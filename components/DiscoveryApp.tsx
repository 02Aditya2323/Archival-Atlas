"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { ActiveFilterChips } from "@/components/search/ActiveFilterChips";
import { AdvancedSearchPanel } from "@/components/search/AdvancedSearchPanel";
import { SearchBar } from "@/components/search/SearchBar";
import { SortMenu } from "@/components/search/SortMenu";
import { ResultDetailDrawer } from "@/components/results/ResultDetailDrawer";
import { ResultsList } from "@/components/results/ResultsList";
import { TimelineView } from "@/components/visualizations/TimelineView";
import { TradeNetworkView } from "@/components/visualizations/TradeNetworkView";
import { parseQuery } from "@/lib/search/parseQuery";
import { createSearchEngine } from "@/lib/search/searchEngine";
import type {
  ArchiveDocument,
  ExplorerMode,
  SearchFilters,
  SortOption,
  ViewMode,
} from "@/lib/search/types";
import { EMPTY_FILTERS } from "@/lib/search/types";
import { formatNumber } from "@/lib/utils/formatters";
import { normalizeText } from "@/lib/search/normalizeText";

interface DiscoveryAppProps {
  documents: ArchiveDocument[];
}

function toggleValue(values: string[], value: string) {
  const normalized = normalizeText(value);
  const exists = values.some((candidate) => normalizeText(candidate) === normalized);

  if (exists) {
    return values.filter((candidate) => normalizeText(candidate) !== normalized);
  }

  return [...values, value];
}

function buildQuerySummary(query: string, total: number) {
  if (!query.trim()) {
    return `Browsing ${formatNumber(total)} records across the archival dataset.`;
  }

  return `Showing ${formatNumber(total)} results for “${query.trim()}”.`;
}

export function DiscoveryApp({ documents }: DiscoveryAppProps) {
  const engine = useMemo(() => createSearchEngine(documents), [documents]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [explorerMode, setExplorerMode] = useState<ExplorerMode>("results");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const parsedQuery = useMemo(
    () => parseQuery(deferredQuery, { advanced: advancedMode }),
    [deferredQuery, advancedMode],
  );

  const response = useMemo(
    () => engine.search({ parsedQuery, filters, sort }),
    [engine, parsedQuery, filters, sort],
  );

  useEffect(() => {
    setVisibleCount(12);
  }, [deferredQuery, advancedMode, filters, sort]);

  useEffect(() => {
    if (selectedRecordId && !engine.getDocumentById(selectedRecordId)) {
      setSelectedRecordId(null);
    }
  }, [engine, selectedRecordId]);

  const selectedDocument = selectedRecordId
    ? engine.getDocumentById(selectedRecordId) ?? null
    : null;
  const selectedResult =
    response.results.find((result) => result.document.id === selectedRecordId) ?? null;
  const relatedRecords = useMemo(
    () => (selectedRecordId ? engine.getRelatedRecords(selectedRecordId) : []),
    [engine, selectedRecordId],
  );

  const isRefining = query !== deferredQuery;
  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.places.length > 0 ||
    filters.regions.length > 0 ||
    filters.languages.length > 0 ||
    filters.subjects.length > 0 ||
    filters.institutions.length > 0 ||
    Boolean(filters.dateRange);

  const yearBounds: [number, number] = [engine.index.minYear, engine.index.maxYear];

  const updateFilter = (
    key: Exclude<keyof SearchFilters, "dateRange">,
    value: string,
  ) => {
    startTransition(() => {
      setFilters((current) => ({
        ...current,
        [key]: toggleValue(current[key], value),
      }));
    });
  };

  const removeFilter = (
    key: Exclude<keyof SearchFilters, "dateRange">,
    value: string,
  ) => {
    startTransition(() => {
      setFilters((current) => ({
        ...current,
        [key]: current[key].filter(
          (candidate) => normalizeText(candidate) !== normalizeText(value),
        ),
      }));
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      setFilters(EMPTY_FILTERS);
    });
  };

  return (
    <main className="relative min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <SearchBar
          query={query}
          resultCount={response.total}
          totalDocuments={documents.length}
          suggestions={isRefining ? [] : response.suggestions}
          advanced={advancedMode}
          isRefining={isRefining}
          onQueryChange={setQuery}
          onClear={() => setQuery("")}
          onSuggestionSelect={setQuery}
          onToggleAdvanced={() => setAdvancedMode((value) => !value)}
        />

        {advancedMode ? (
          <AdvancedSearchPanel
            parsedQuery={parsedQuery}
            onExampleSelect={(value) => {
              setAdvancedMode(true);
              setQuery(value);
            }}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <FilterSidebar
            facetCounts={response.facetCounts}
            filters={filters}
            yearBounds={yearBounds}
            onToggleFilter={updateFilter}
            onDateRangeChange={(value) =>
              startTransition(() => {
                setFilters((current) => ({
                  ...current,
                  dateRange: value,
                }));
              })
            }
            onClearAll={clearAllFilters}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.92fr)] lg:items-start">
            <div className="space-y-6">
              <section className="panel rounded-[1.8rem] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
                      Search summary
                    </p>
                    <h2 className="mt-1 font-display text-3xl text-[var(--foreground)]">
                      Discovery results
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {buildQuerySummary(query, response.total)}
                    </p>
                  </div>
                  <SortMenu
                    sort={sort}
                    viewMode={viewMode}
                    explorerMode={explorerMode}
                    onSortChange={setSort}
                    onViewModeChange={setViewMode}
                    onExplorerModeChange={setExplorerMode}
                  />
                </div>

                <div className="mt-4">
                  <ActiveFilterChips
                    filters={filters}
                    onRemove={removeFilter}
                    onClearDateRange={() =>
                      startTransition(() => {
                        setFilters((current) => ({ ...current, dateRange: null }));
                      })
                    }
                    onClearAll={clearAllFilters}
                  />
                </div>
              </section>

              <ResultsList
                results={response.results}
                visibleCount={visibleCount}
                viewMode={viewMode}
                highlightTerms={parsedQuery.highlightTerms}
                hasActiveFilters={hasActiveFilters}
                onSelectRecord={setSelectedRecordId}
                onLoadMore={() => setVisibleCount((current) => current + 12)}
                onClearFilters={clearAllFilters}
                onSuggestionSelect={setQuery}
              />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6">
              <TimelineView
                timeline={response.timeline}
                resultCount={response.total}
                compact
                onRangeChange={(value) =>
                  startTransition(() => {
                    setFilters((current) => ({
                      ...current,
                      dateRange: value,
                    }));
                  })
                }
              />

              {explorerMode === "relationships" ? (
                <TradeNetworkView
                  graph={response.relationshipGraph}
                  onSelectPlace={(value) => updateFilter("places", value)}
                  onSelectSubject={(value) => updateFilter("subjects", value)}
                />
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      <ResultDetailDrawer
        document={selectedDocument}
        result={selectedResult}
        relatedRecords={relatedRecords}
        highlightTerms={parsedQuery.highlightTerms}
        onClose={() => setSelectedRecordId(null)}
        onSelectRecord={setSelectedRecordId}
      />
    </main>
  );
}
