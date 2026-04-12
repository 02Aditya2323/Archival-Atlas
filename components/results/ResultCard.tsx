import {
  ArrowRight,
  BookOpenText,
  Camera,
  FileChartColumn,
  Landmark,
  Map,
  MapPin,
  Paintbrush,
  ScrollText,
} from "lucide-react";
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

function visualForType(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes("map") || normalized.includes("plan")) {
    return {
      icon: Map,
      label: "Cartography",
      surface:
        "bg-[linear-gradient(180deg,rgba(47,111,104,0.2),rgba(47,111,104,0.08))] text-[var(--accent-teal)]",
    };
  }

  if (normalized.includes("painting") || normalized.includes("illustration") || normalized.includes("drawing")) {
    return {
      icon: Paintbrush,
      label: "Visual record",
      surface:
        "bg-[linear-gradient(180deg,rgba(159,79,45,0.2),rgba(159,79,45,0.08))] text-[var(--accent)]",
    };
  }

  if (normalized.includes("diagram")) {
    return {
      icon: FileChartColumn,
      label: "Diagram",
      surface:
        "bg-[linear-gradient(180deg,rgba(47,111,104,0.18),rgba(159,79,45,0.1))] text-[var(--foreground)]",
    };
  }

  if (normalized.includes("photograph")) {
    return {
      icon: Camera,
      label: "Photograph",
      surface:
        "bg-[linear-gradient(180deg,rgba(77,56,30,0.18),rgba(77,56,30,0.08))] text-[var(--foreground)]",
    };
  }

  if (normalized.includes("book") || normalized.includes("journal") || normalized.includes("volume")) {
    return {
      icon: BookOpenText,
      label: "Bound record",
      surface:
        "bg-[linear-gradient(180deg,rgba(77,56,30,0.18),rgba(47,111,104,0.08))] text-[var(--foreground)]",
    };
  }

  return {
    icon: ScrollText,
    label: "Archival text",
    surface:
      "bg-[linear-gradient(180deg,rgba(159,79,45,0.18),rgba(47,111,104,0.08))] text-[var(--accent)]",
  };
}

export function ResultCard({
  result,
  highlightTerms,
  viewMode,
  onSelect,
}: ResultCardProps) {
  const { document } = result;
  const isGrid = viewMode === "grid";
  const visual = visualForType(document.type);
  const VisualIcon = visual.icon;
  const metadataChips = [
    ...document.subjects.slice(0, 2).map((item, index) => ({
      id: `subject-${index}-${item}`,
      label: item,
    })),
    ...document.tags.slice(0, 2).map((item, index) => ({
      id: `tag-${index}-${item}`,
      label: item,
    })),
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(document.id)}
      className={cn(
        "focus-ring group panel animated-enter w-full overflow-hidden rounded-[1.8rem] border border-[var(--border)] text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(47,111,104,0.3)] hover:shadow-[0_24px_58px_rgba(70,48,26,0.16)]",
        isGrid ? "p-0" : "p-0",
      )}
    >
      <div className={cn("flex h-full", isGrid ? "flex-col" : "flex-col xl:flex-row")}>
        <div
          className={cn(
            "relative flex items-center justify-between overflow-hidden border-b border-[var(--border)] p-5",
            visual.surface,
            isGrid ? "min-h-24" : "xl:min-h-full xl:w-44 xl:flex-col xl:items-start xl:justify-between xl:border-b-0 xl:border-r",
          )}
        >
          <div className="absolute inset-y-0 right-0 w-20 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.34),transparent_58%)] opacity-80" />
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--muted-foreground)] uppercase">
              {document.type}
            </p>
            <p className="mt-3 font-display text-2xl text-[var(--foreground)]">
              #{String(document.sourceId).padStart(3, "0")}
            </p>
            <p className="mt-2 text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
              {visual.label}
            </p>
          </div>
          <div className="rounded-full border border-white/30 bg-white/50 p-3 text-current backdrop-blur">
            <VisualIcon className="h-5 w-5" />
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
            <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
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
            {metadataChips.map((item) => (
              <Badge key={`${document.id}-${item.id}`} tone="muted">
                <HighlightText text={item.label} terms={highlightTerms} />
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
