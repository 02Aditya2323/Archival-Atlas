import type { RecordChatMessage } from "@/lib/ai/types";

interface RecordChatMessagesProps {
  messages: RecordChatMessage[];
  isLoading: boolean;
  error: string | null;
  onRetry: (() => void) | null;
}

export function RecordChatMessages({
  messages,
  isLoading,
  error,
  onRetry,
}: RecordChatMessagesProps) {
  const hasMessages = messages.length > 0;

  return (
    <div className="space-y-4">
      {!hasMessages ? (
        <div className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,251,245,0.76)] p-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
            No conversation yet
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Ask for a summary, interpret the metadata, or use the current match evidence to decide
            what to inspect next.
          </p>
        </div>
      ) : null}

      {messages.map((message) => (
        <article
          key={message.id}
          className={
            message.role === "user"
              ? "ml-auto max-w-[88%] rounded-[1.6rem] border border-[rgba(159,79,45,0.16)] bg-[rgba(159,79,45,0.1)] px-4 py-3"
              : "max-w-[92%] rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,251,245,0.8)] px-4 py-4"
          }
        >
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
            {message.role === "user" ? "Research question" : "Record companion"}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
            {message.content}
          </p>
        </article>
      ))}

      {isLoading ? (
        <article className="max-w-[92%] rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,251,245,0.8)] px-4 py-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
            Record companion
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Reading the record and grounding a reply in the metadata...
          </p>
        </article>
      ) : null}

      {error ? (
        <div className="rounded-[1.4rem] border border-[rgba(159,79,45,0.18)] bg-[rgba(159,79,45,0.08)] p-4">
          <p className="text-sm font-semibold text-[var(--accent)]">Unable to answer just now.</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="focus-ring mt-3 rounded-full border border-[rgba(159,79,45,0.18)] bg-white/72 px-3.5 py-2 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase"
            >
              Retry response
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
