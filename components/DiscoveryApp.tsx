"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { ActiveFilterChips } from "@/components/search/ActiveFilterChips";
import { AdvancedSearchPanel } from "@/components/search/AdvancedSearchPanel";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchSummaryPanel } from "@/components/search/SearchSummaryPanel";
import { SortMenu } from "@/components/search/SortMenu";
import { ResultDetailDrawer } from "@/components/results/ResultDetailDrawer";
import { ResultsList } from "@/components/results/ResultsList";
import { RelationshipWorkspace } from "@/components/visualizations/RelationshipWorkspace";
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
import { normalizeText } from "@/lib/search/normalizeText";

export interface DiscoveryGatewayCommand {
  nonce: number;
  query: string;
  explorerMode: ExplorerMode;
  focusTarget?: "workspace" | "timeline" | "relationships";
}

interface DiscoveryAppProps {
  documents: ArchiveDocument[];
  gatewayCommand?: DiscoveryGatewayCommand | null;
}

function toggleValue(values: string[], value: string) {
  const normalized = normalizeText(value);
  const exists = values.some((candidate) => normalizeText(candidate) === normalized);

  if (exists) {
    return values.filter((candidate) => normalizeText(candidate) !== normalized);
  }

  return [...values, value];
}

function countActiveFilters(filters: SearchFilters) {
  return (
    filters.types.length +
    filters.places.length +
    filters.regions.length +
    filters.languages.length +
    filters.subjects.length +
    filters.institutions.length +
    (filters.dateRange ? 1 : 0)
  );
}

export function DiscoveryApp({ documents, gatewayCommand = null }: DiscoveryAppProps) {
  const engine = useMemo(() => createSearchEngine(documents), [documents]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const relationshipRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!gatewayCommand) {
      return;
    }

    startTransition(() => {
      setQuery(gatewayCommand.query);
      setAdvancedMode(false);
      setFilters(EMPTY_FILTERS);
      setSort("relevance");
      setViewMode("list");
      setExplorerMode(gatewayCommand.explorerMode);
      setSelectedRecordId(null);
    });

    const timer = window.setTimeout(() => {
      if (gatewayCommand.focusTarget === "timeline") {
        timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (gatewayCommand.focusTarget === "relationships") {
        relationshipRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [gatewayCommand]);

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
  const activeFilterCount = countActiveFilters(filters);
  const relationshipVisibleCount = explorerMode === "relationships" ? Math.min(visibleCount, 6) : visibleCount;

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

  const updateDateRange = (value: [number, number] | null) => {
    startTransition(() => {
      setFilters((current) => ({
        ...current,
        dateRange: value,
      }));
    });
  };

  return (
    <main className="relative min-h-screen px-4 pb-10 pt-4 md:px-6 md:pb-12 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <SearchBar
          query={query}
          resultCount={response.total}
          totalDocuments={documents.length}
          suggestions={response.suggestions}
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
            onDateRangeChange={updateDateRange}
            onClearAll={clearAllFilters}
          />

          <div className="space-y-6">
            <section className="panel rounded-[1.8rem] p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <SearchSummaryPanel
                  total={response.total}
                  query={query}
                  activeFilterCount={activeFilterCount}
                  sort={sort}
                  advancedMode={advancedMode}
                />
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
                  onClearDateRange={() => updateDateRange(null)}
                  onClearAll={clearAllFilters}
                />
              </div>
            </section>

            {explorerMode === "relationships" ? (
              <div ref={relationshipRef} className="space-y-6">
                <RelationshipWorkspace
                  graph={response.relationshipGraph}
                  timeline={response.timeline}
                  resultCount={response.total}
                  onRangeChange={updateDateRange}
                  onSelectPlace={(value) => updateFilter("places", value)}
                  onSelectSubject={(value) => updateFilter("subjects", value)}
                />

                <section className="panel rounded-[1.8rem] p-5">
                  <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
                        Supporting records
                      </p>
                      <h3 className="mt-1 font-display text-3xl text-[var(--foreground)]">
                        Read the connected evidence
                      </h3>
                    </div>
                    <p className="max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
                      The relationship workspace leads the exploration. These records remain the
                      supporting evidence behind the active network.
                    </p>
                  </div>

                  <ResultsList
                    results={response.results}
                    visibleCount={relationshipVisibleCount}
                    viewMode={viewMode}
                    highlightTerms={parsedQuery.highlightTerms}
                    hasActiveFilters={hasActiveFilters}
                    onSelectRecord={setSelectedRecordId}
                    onLoadMore={() =>
                      setVisibleCount((current) => current + 6)
                    }
                    onClearFilters={clearAllFilters}
                    onSuggestionSelect={setQuery}
                  />
                </section>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] xl:items-start">
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

                <aside className="space-y-6 xl:sticky xl:top-5">
                  <div ref={timelineRef}>
                    <TimelineView
                      timeline={response.timeline}
                      resultCount={response.total}
                      compact
                      onRangeChange={updateDateRange}
                    />
                  </div>

                  {response.relationshipGraph.edges.length ? (
                    <TradeNetworkView
                      graph={response.relationshipGraph}
                      onSelectPlace={(value) => updateFilter("places", value)}
                      onSelectSubject={(value) => updateFilter("subjects", value)}
                      variant="rail"
                    />
                  ) : null}
                </aside>
              </div>
            )}
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
