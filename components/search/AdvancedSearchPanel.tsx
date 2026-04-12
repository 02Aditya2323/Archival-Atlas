import type { ParsedQuery } from "@/lib/search/types";
import { Badge } from "@/components/common/Badge";

interface AdvancedSearchPanelProps {
  parsedQuery: ParsedQuery;
  onExampleSelect: (value: string) => void;
}

const EXAMPLES = [
  'author:"Ibn al-Haytham"',
  'place:doha AND treaty',
  '"persian gulf" navigation',
  "type:map 1830-1912",
];

export function AdvancedSearchPanel({
  parsedQuery,
  onExampleSelect,
}: AdvancedSearchPanelProps) {
  const fieldEntries = Object.entries(parsedQuery.searchableFieldTerms).flatMap(
    ([field, values]) => (values ?? []).map((value) => ({ field, value })),
  );

  const facetEntries = Object.entries(parsedQuery.facetFieldTerms).flatMap(
    ([field, values]) => (values ?? []).map((value) => ({ field, value })),
  );

  return (
    <section className="panel animated-enter rounded-[1.8rem] p-5">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--muted-foreground)] uppercase">
            Advanced query syntax
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onExampleSelect(example)}
                className="focus-ring rounded-full border border-[rgba(77,56,30,0.14)] bg-[rgba(255,250,242,0.9)] px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:border-[rgba(47,111,104,0.24)] hover:bg-[rgba(47,111,104,0.08)]"
              >
                {example}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-[var(--muted-foreground)] md:grid-cols-2">
            <p>Quoted phrases force adjacency and earn stronger title/tag bonuses.</p>
            <p>
              `AND` and `OR` are available here, along with targeted fields like `author:`,
              `place:`, `collection:`, `type:`, `region:`, and `language:`.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[rgba(77,56,30,0.04)] p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Query interpretation</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {parsedQuery.freeTerms.map((term) => (
              <Badge key={term}>{term}</Badge>
            ))}
            {parsedQuery.phrases.map((phrase) => (
              <Badge key={phrase} tone="accent">
                "{phrase}"
              </Badge>
            ))}
            {fieldEntries.map((entry) => (
              <Badge key={`${entry.field}-${entry.value}`} tone="teal">
                {entry.field}:{entry.value}
              </Badge>
            ))}
            {facetEntries.map((entry) => (
              <Badge key={`${entry.field}-${entry.value}`} tone="muted">
                filter {entry.field}:{entry.value}
              </Badge>
            ))}
            {parsedQuery.yearRange ? (
              <Badge tone="accent">
                {parsedQuery.yearRange[0]}-{parsedQuery.yearRange[1]}
              </Badge>
            ) : null}
            {!parsedQuery.freeTerms.length &&
            !parsedQuery.phrases.length &&
            !fieldEntries.length &&
            !facetEntries.length ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Enter syntax above to inspect how the parser understands your query.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
