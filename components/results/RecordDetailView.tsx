import type { RefObject } from "react";
import { Badge } from "@/components/common/Badge";
import { HighlightText } from "@/components/common/HighlightText";
import type { ArchiveDocument, RelatedRecord, SearchResultItem } from "@/lib/search/types";
import { cn } from "@/lib/utils/classNames";
import { formatDateLabel } from "@/lib/utils/formatters";

interface RecordDetailViewProps {
  document: ArchiveDocument;
  result: SearchResultItem | null;
  relatedRecords: RelatedRecord[];
  highlightTerms: string[];
  hasConversation: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onAsk: () => void;
  onSelectRecord: (id: string) => void;
}

export function RecordDetailView({
  document,
  result,
  relatedRecords,
  highlightTerms,
  hasConversation,
  scrollRef,
  onAsk,
  onSelectRecord,
}: RecordDetailViewProps) {
  const metadata = [
    ["Type", document.type],
    ["Date", formatDateLabel(document.date)],
    ["Place", document.place],
    ["Region", document.region],
    ["Language", document.language],
    ["Institution", document.holdingInstitution],
    ["Author", document.author],
    ["Collection", document.collection],
    ["Format", document.format],
  ] as const;

  const subjectMetadata = [
    ...document.subjects.map((subject, index) => ({
      id: `subject-${index}-${subject}`,
      label: subject,
      tone: "teal" as const,
    })),
    ...document.tags.map((tag, index) => ({
      id: `tag-${index}-${tag}`,
      label: tag,
      tone: "accent" as const,
    })),
    ...document.keywords.map((keyword, index) => ({
      id: `keyword-${index}-${keyword}`,
      label: keyword,
      tone: "default" as const,
    })),
  ];

  return (
    <div
      ref={scrollRef}
      tabIndex={-1}
      className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5 outline-none md:px-6 md:pb-8 md:pt-6"
    >
      <section>
        <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
          Description
        </h3>
        <p className="mt-3 text-base leading-7 text-[var(--foreground)]">
          <HighlightText text={document.description} terms={highlightTerms} />
        </p>
      </section>

      <section className="mt-8 grid auto-rows-fr gap-4 md:grid-cols-2">
        {metadata.map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,251,245,0.72)] p-4",
              metadata.length % 2 === 1 && index === metadata.length - 1 && "md:col-span-2",
            )}
          >
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
              {label}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
          Subject metadata
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {subjectMetadata.map((item) => (
            <Badge key={`${document.id}-${item.id}`} tone={item.tone}>
              <HighlightText text={item.label} terms={highlightTerms} />
            </Badge>
          ))}
        </div>
      </section>

      {result?.whyMatched.length ? (
        <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(47,111,104,0.08)] p-5">
          <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
            Why this matched
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.whyMatched.map((reason, index) => (
              <Badge key={`${document.id}-reason-${index}`} tone="teal">
                {reason}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-[1.6rem] border border-[var(--border)] bg-[rgba(47,111,104,0.07)] p-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
          Record companion
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <h3 className="font-display text-[1.9rem] leading-tight text-[var(--foreground)]">
              Interrogate the metadata without leaving the drawer.
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Ask for a grounded summary, understand why this record matched, or get suggestions on
              what to inspect next.
            </p>
          </div>

          <button
            type="button"
            onClick={onAsk}
            className="focus-ring inline-flex shrink-0 items-center rounded-full border border-[rgba(159,79,45,0.22)] bg-[rgba(213,176,107,0.94)] px-4 py-2.5 text-xs font-semibold tracking-[0.14em] text-[var(--foreground)] uppercase transition hover:translate-y-[-1px]"
          >
            {hasConversation ? "Continue conversation" : "Ask about this record"}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
            Related records
          </h3>
          <span className="text-sm text-[var(--muted-foreground)]">
            {relatedRecords.length} suggestions
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {relatedRecords.map((record) => (
            <button
              key={record.document.id}
              type="button"
              onClick={() => onSelectRecord(record.document.id)}
              className="focus-ring w-full rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,251,245,0.72)] p-4 text-left"
            >
              <p className="font-display text-2xl text-[var(--foreground)]">{record.document.title}</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {record.reasons.slice(0, 2).join(" · ")}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
