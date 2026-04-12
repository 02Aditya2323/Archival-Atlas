import { ArrowRight, Landmark, MapPin, ScrollText } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { HighlightText } from "@/components/common/HighlightText";
import { MatchedFields } from "./MatchedFields";
import type { SearchResultItem, ViewMode } from "@/lib/search/types";
import { formatDateLabel } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/classNames";

interface ResultCardProps {
  result: SearchResultItem;
  highlightTerms: string[];
  viewMode: ViewMode;
  onSelect: (id: string) => void;
}

export function ResultCard({
  result,
  highlightTerms,
  viewMode,
  onSelect,
}: ResultCardProps) {
  const { document } = result;
  const isGrid = viewMode === "grid";

  return (
    <button
      type="button"
      onClick={() => onSelect(document.id)}
      className={cn(
        "focus-ring group panel animated-enter w-full overflow-hidden rounded-[1.8rem] border border-[var(--border)] text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(47,111,104,0.28)]",
        isGrid ? "p-0" : "p-0",
      )}
    >
      <div className={cn("flex h-full", isGrid ? "flex-col" : "flex-col xl:flex-row")}>
        <div
          className={cn(
            "flex items-center justify-between border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(159,79,45,0.16),rgba(47,111,104,0.12))] p-5",
            isGrid ? "min-h-28" : "xl:min-h-full xl:w-60 xl:flex-col xl:items-start xl:justify-between xl:border-b-0 xl:border-r",
          )}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--muted-foreground)] uppercase">
              {document.type}
            </p>
            <p className="mt-3 font-display text-2xl text-[var(--foreground)]">
              #{String(document.sourceId).padStart(3, "0")}
            </p>
          </div>
          <div className="rounded-full border border-white/30 bg-white/50 p-3 text-[var(--accent)] backdrop-blur">
            <ScrollText className="h-5 w-5" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{formatDateLabel(document.date)}</Badge>
            <Badge tone="teal">{document.language}</Badge>
            <Badge>{document.holdingInstitution}</Badge>
          </div>

          <div>
            <h3 className="font-display text-2xl leading-tight text-[var(--foreground)]">
              <HighlightText text={document.title} terms={highlightTerms} />
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">
              <HighlightText text={result.snippet} terms={highlightTerms} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {document.place}
            </span>
            <span className="inline-flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              {document.collection}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[...document.subjects.slice(0, 2), ...document.tags.slice(0, 2)].map((item) => (
              <Badge key={`${document.id}-${item}`} tone="muted">
                <HighlightText text={item} terms={highlightTerms} />
              </Badge>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4">
            <div>
              <MatchedFields fields={result.matchedFields} />
              {result.whyMatched.length ? (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {result.whyMatched[0]}
                </p>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
              Inspect record
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
