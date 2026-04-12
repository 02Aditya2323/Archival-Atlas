import { Badge } from "@/components/common/Badge";
import { SORT_OPTIONS } from "@/lib/search/types";
import { formatNumber } from "@/lib/utils/formatters";

interface SearchSummaryPanelProps {
  total: number;
  query: string;
  activeFilterCount: number;
  sort: (typeof SORT_OPTIONS)[number]["value"];
  advancedMode: boolean;
}

function sortLabel(value: SearchSummaryPanelProps["sort"]) {
  return SORT_OPTIONS.find((option) => option.value === value)?.label ?? "Relevance";
}

function explanation(query: string, activeFilterCount: number, advancedMode: boolean) {
  if (advancedMode && query.trim()) {
    return "Structured terms and field constraints are merged into the same ranking pipeline before reranking.";
  }

  if (query.trim()) {
    return "Top results ranked by title relevance, phrase evidence, and curated metadata.";
  }

  if (activeFilterCount > 0) {
    return "Browsing by facet while preserving archival weighting, chronology, and metadata completeness.";
  }

  return "Surveying the full archive with metadata quality and cross-field archival evidence in view.";
}

export function SearchSummaryPanel({
  total,
  query,
  activeFilterCount,
  sort,
  advancedMode,
}: SearchSummaryPanelProps) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
        Search summary
      </p>
      <h2 className="mt-1 font-display text-3xl text-[var(--foreground)]">Discovery results</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {query.trim()
          ? `Showing ${formatNumber(total)} results for “${query.trim()}”.`
          : `Browsing ${formatNumber(total)} records across the archival dataset.`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{formatNumber(total)} results</Badge>
        <Badge tone="teal">{activeFilterCount} active filters</Badge>
        <Badge tone="accent">{sortLabel(sort)}</Badge>
        <Badge tone="muted">{query.trim() ? `Query: ${query.trim()}` : "Query: archive wide"}</Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
        {explanation(query, activeFilterCount, advancedMode)}
      </p>
    </div>
  );
}
