import type { FormEvent, KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";

interface RecordChatComposerProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function RecordChatComposer({
  value,
  disabled = false,
  onChange,
  onSubmit,
}: RecordChatComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,251,245,0.82)] px-4 py-3 shadow-[0_12px_30px_rgba(70,48,26,0.08)]">
        <textarea
          value={value}
          disabled={disabled}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask grounded questions about this record..."
          className="focus-ring h-24 w-full resize-none bg-transparent text-sm leading-6 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
        />

        <div className="mt-3 flex items-center justify-between gap-4 border-t border-[rgba(77,56,30,0.08)] pt-3">
          <p className="text-xs leading-5 text-[var(--muted-foreground)]">
            Grounded in record metadata, match evidence, and related records.
          </p>

          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full border border-[rgba(159,79,45,0.22)] bg-[rgba(213,176,107,0.94)] px-4 py-2 text-xs font-semibold tracking-[0.14em] text-[var(--foreground)] uppercase transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SendHorizontal className="h-3.5 w-3.5" />
            {disabled ? "Thinking" : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
}
