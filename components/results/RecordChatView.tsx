import type { RefObject } from "react";
import type { RecordChatMessage } from "@/lib/ai/types";
import { RecordChatComposer } from "@/components/results/RecordChatComposer";
import { RecordChatMessages } from "@/components/results/RecordChatMessages";
import { RecordChatSuggestions } from "@/components/results/RecordChatSuggestions";

interface RecordChatViewProps {
  draft: string;
  messages: RecordChatMessage[];
  isLoading: boolean;
  error: string | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onRetry: (() => void) | null;
  onSuggestionSelect: (value: string) => void;
}

export function RecordChatView({
  draft,
  messages,
  isLoading,
  error,
  scrollRef,
  onDraftChange,
  onSend,
  onRetry,
  onSuggestionSelect,
}: RecordChatViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-[var(--border)] px-5 py-4 md:px-6">
        <RecordChatSuggestions disabled={isLoading} onSelect={onSuggestionSelect} />
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-6"
      >
        <RecordChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
        />
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[rgba(255,248,237,0.72)] px-5 py-4 md:px-6">
        <RecordChatComposer
          value={draft}
          disabled={isLoading}
          onChange={onDraftChange}
          onSubmit={onSend}
        />
      </div>
    </div>
  );
}
