const SUGGESTIONS = [
  "Summarize this record",
  "Why is this important?",
  "Why did this match?",
  "What should I inspect next?",
] as const;

interface RecordChatSuggestionsProps {
  disabled?: boolean;
  onSelect: (value: string) => void;
}

export function RecordChatSuggestions({
  disabled = false,
  onSelect,
}: RecordChatSuggestionsProps) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
        Suggested questions
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(suggestion)}
            className="focus-ring inline-flex items-center rounded-full border border-[rgba(77,56,30,0.14)] bg-[rgba(255,250,242,0.92)] px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[var(--foreground)] uppercase transition hover:border-[rgba(47,111,104,0.24)] hover:bg-[rgba(47,111,104,0.08)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
