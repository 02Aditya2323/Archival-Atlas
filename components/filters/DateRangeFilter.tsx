"use client";

import { formatYearLabel } from "@/lib/utils/formatters";

interface DateRangeFilterProps {
  minYear: number;
  maxYear: number;
  value: [number, number] | null;
  onChange: (value: [number, number] | null) => void;
}

function normalizeRange(
  minYear: number,
  maxYear: number,
  value: [number, number],
): [number, number] | null {
  if (value[0] <= minYear && value[1] >= maxYear) {
    return null;
  }

  return value;
}

export function DateRangeFilter({
  minYear,
  maxYear,
  value,
  onChange,
}: DateRangeFilterProps) {
  const activeRange = value ?? [minYear, maxYear];

  return (
    <section className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,252,246,0.68)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Date range</h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {formatYearLabel(activeRange[0])} to {formatYearLabel(activeRange[1])}
          </p>
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="focus-ring text-xs font-medium text-[var(--accent)]"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={activeRange[0]}
          onChange={(event) => {
            const start = Math.min(Number(event.target.value), activeRange[1]);
            onChange(normalizeRange(minYear, maxYear, [start, activeRange[1]]));
          }}
          className="focus-ring h-2 w-full cursor-pointer accent-[var(--accent-teal)]"
        />
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={activeRange[1]}
          onChange={(event) => {
            const end = Math.max(Number(event.target.value), activeRange[0]);
            onChange(normalizeRange(minYear, maxYear, [activeRange[0], end]));
          }}
          className="focus-ring h-2 w-full cursor-pointer accent-[var(--accent)]"
        />
      </div>
    </section>
  );
}
