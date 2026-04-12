"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { HighlightText } from "@/components/common/HighlightText";
import type { ArchiveDocument, RelatedRecord, SearchResultItem } from "@/lib/search/types";
import { formatDateLabel } from "@/lib/utils/formatters";

interface ResultDetailDrawerProps {
  document: ArchiveDocument | null;
  result: SearchResultItem | null;
  relatedRecords: RelatedRecord[];
  highlightTerms: string[];
  onClose: () => void;
  onSelectRecord: (id: string) => void;
}

export function ResultDetailDrawer({
  document,
  result,
  relatedRecords,
  highlightTerms,
  onClose,
  onSelectRecord,
}: ResultDetailDrawerProps) {
  if (!document) {
    return null;
  }

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
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(27,23,16,0.3)] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close record detail drawer"
      />
      <aside className="panel-strong scrollbar-none relative h-full w-full max-w-2xl overflow-y-auto rounded-none border-l border-[var(--border)] p-5 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
              Record detail
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-[var(--foreground)]">
              <HighlightText text={document.title} terms={highlightTerms} />
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full border border-[var(--border)] bg-white/70 p-3 text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone="accent">{document.type}</Badge>
          <Badge tone="teal">{document.language}</Badge>
          <Badge>{document.holdingInstitution}</Badge>
          <Badge>{formatDateLabel(document.date)}</Badge>
        </div>

        <section className="mt-8">
          <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
            Description
          </h3>
          <p className="mt-3 text-base leading-7 text-[var(--foreground)]">
            <HighlightText text={document.description} terms={highlightTerms} />
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {metadata.map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,251,245,0.72)] p-4"
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

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
              Related records
            </h3>
            <span className="text-sm text-[var(--muted-foreground)]">{relatedRecords.length} suggestions</span>
          </div>

          <div className="mt-4 space-y-3">
            {relatedRecords.map((record) => (
              <button
                key={record.document.id}
                type="button"
                onClick={() => onSelectRecord(record.document.id)}
                className="focus-ring w-full rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,251,245,0.72)] p-4 text-left"
              >
                <p className="font-display text-2xl text-[var(--foreground)]">
                  {record.document.title}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {record.reasons.slice(0, 2).join(" · ")}
                </p>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
