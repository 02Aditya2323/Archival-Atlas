"use client";

import { formatYearLabel } from "@/lib/utils/formatters";
import type { TimelineData } from "@/lib/search/types";
import { cn } from "@/lib/utils/classNames";

interface TimelineViewProps {
  timeline: TimelineData;
  resultCount: number;
  onRangeChange: (value: [number, number] | null) => void;
  compact?: boolean;
}

function normalizeRange(
  fullRange: [number, number],
  value: [number, number],
): [number, number] | null {
  if (value[0] <= fullRange[0] && value[1] >= fullRange[1]) {
    return null;
  }

  return value;
}

export function TimelineView({
  timeline,
  resultCount,
  onRangeChange,
  compact = false,
}: TimelineViewProps) {
  const fullRange: [number, number] = [timeline.minYear, timeline.maxYear];
  const activeRange = timeline.selectedRange ?? fullRange;
  const maxCount = Math.max(...timeline.buckets.map((bucket) => bucket.count), 1);

  return (
    <section className="panel rounded-[1.8rem] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
            Timeline explorer
          </p>
          <h2
            className={cn(
              "mt-1 font-display text-[var(--foreground)]",
              compact ? "text-2xl" : "text-3xl",
            )}
          >
            Temporal distribution
          </h2>
          <p
            className={cn(
              "mt-2 text-sm leading-6 text-[var(--muted-foreground)]",
              compact ? "max-w-none" : "max-w-2xl",
            )}
          >
            {compact
              ? "Brush the date rail without pushing the primary results off-screen."
              : "Brush the date range to re-scope results instantly. The histogram always reflects the current query context before date filtering."}
          </p>
        </div>
        <div className="rounded-full border border-[var(--border)] bg-[rgba(255,250,242,0.86)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
          {formatYearLabel(activeRange[0])} to {formatYearLabel(activeRange[1])} · {resultCount} records
        </div>
      </div>

      <div
        className={cn(
          "mt-6 grid items-end",
          compact ? "h-28 gap-1.5" : "h-36 gap-2",
        )}
        style={{ gridTemplateColumns: `repeat(${timeline.buckets.length}, minmax(0, 1fr))` }}
      >
        {timeline.buckets.map((bucket, index) => {
          const height = `${Math.max(12, (bucket.count / maxCount) * 100)}%`;
          const overlaps =
            bucket.end >= activeRange[0] && bucket.start <= activeRange[1];
          const showLabel =
            !compact ||
            index === 0 ||
            index === timeline.buckets.length - 1 ||
            index % 3 === 0;

          return (
            <button
              key={`${bucket.start}-${bucket.end}`}
              type="button"
              onClick={() => onRangeChange([bucket.start, bucket.end])}
              className="focus-ring group flex h-full flex-col justify-end"
              aria-label={`Filter timeline to ${bucket.start} to ${bucket.end}`}
            >
              <div
                className={cn(
                  "rounded-t-[1rem] transition-all",
                  overlaps
                    ? "bg-[linear-gradient(180deg,var(--accent-teal),rgba(47,111,104,0.44))]"
                    : "bg-[linear-gradient(180deg,rgba(159,79,45,0.72),rgba(159,79,45,0.2))]",
                )}
                style={{ height }}
              />
              <span className="mt-2 min-h-4 text-[10px] font-medium text-[var(--muted-foreground)]">
                {showLabel ? bucket.start : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cn("mt-6 grid gap-4", compact ? "md:grid-cols-1" : "md:grid-cols-2")}>
        <label className="text-sm text-[var(--muted-foreground)]">
          Start year
          <input
            type="range"
            min={timeline.minYear}
            max={timeline.maxYear}
            value={activeRange[0]}
            onChange={(event) => {
              const start = Math.min(Number(event.target.value), activeRange[1]);
              onRangeChange(normalizeRange(fullRange, [start, activeRange[1]]));
            }}
            className="focus-ring mt-2 h-2 w-full cursor-pointer accent-[var(--accent-teal)]"
          />
        </label>
        <label className="text-sm text-[var(--muted-foreground)]">
          End year
          <input
            type="range"
            min={timeline.minYear}
            max={timeline.maxYear}
            value={activeRange[1]}
            onChange={(event) => {
              const end = Math.max(Number(event.target.value), activeRange[0]);
              onRangeChange(normalizeRange(fullRange, [activeRange[0], end]));
            }}
            className="focus-ring mt-2 h-2 w-full cursor-pointer accent-[var(--accent)]"
          />
        </label>
      </div>
    </section>
  );
}
