"use client";

import { LayoutGrid, Network, Rows3 } from "lucide-react";
import type { ExplorerMode, SortOption, ViewMode } from "@/lib/search/types";
import { SORT_OPTIONS } from "@/lib/search/types";
import { cn } from "@/lib/utils/classNames";

interface SortMenuProps {
  sort: SortOption;
  viewMode: ViewMode;
  explorerMode: ExplorerMode;
  onSortChange: (value: SortOption) => void;
  onViewModeChange: (value: ViewMode) => void;
  onExplorerModeChange: (value: ExplorerMode) => void;
}

export function SortMenu({
  sort,
  viewMode,
  explorerMode,
  onSortChange,
  onViewModeChange,
  onExplorerModeChange,
}: SortMenuProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,251,245,0.88)] p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-[var(--muted-foreground)]">
          Sort
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            className="focus-ring ml-3 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-[var(--foreground)]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white/75 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "focus-ring rounded-full px-3 py-2",
              viewMode === "list" ? "bg-[rgba(47,111,104,0.12)] text-[var(--accent-teal)]" : "text-[var(--muted-foreground)]",
            )}
            aria-label="List view"
          >
            <Rows3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "focus-ring rounded-full px-3 py-2",
              viewMode === "grid" ? "bg-[rgba(47,111,104,0.12)] text-[var(--accent-teal)]" : "text-[var(--muted-foreground)]",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/75 p-1">
        <button
          type="button"
          onClick={() => onExplorerModeChange("results")}
          className={cn(
            "focus-ring rounded-full px-4 py-2 text-sm font-semibold",
            explorerMode === "results"
              ? "bg-[rgba(159,79,45,0.12)] text-[var(--accent)]"
              : "text-[var(--muted-foreground)]",
          )}
        >
          Results
        </button>
        <button
          type="button"
          onClick={() => onExplorerModeChange("relationships")}
          className={cn(
            "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
            explorerMode === "relationships"
              ? "bg-[rgba(47,111,104,0.12)] text-[var(--accent-teal)]"
              : "text-[var(--muted-foreground)]",
          )}
        >
          <Network className="h-4 w-4" />
          Relationships
        </button>
      </div>
    </div>
  );
}
