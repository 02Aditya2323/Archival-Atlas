"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, X } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { HighlightText } from "@/components/common/HighlightText";
import type { ArchiveDocument, RelatedRecord, SearchResultItem } from "@/lib/search/types";
import { RecordChatView } from "@/components/results/RecordChatView";
import { RecordDetailView } from "@/components/results/RecordDetailView";
import {
  capRecordChatMessages,
  loadRecordChatHistoryMap,
  saveRecordChatHistoryMap,
  type RecordChatHistoryMap,
} from "@/lib/ai/recordChatStorage";
import type { DrawerView, RecordChatMessage, RecordChatRequestBody } from "@/lib/ai/types";
import { formatDateLabel } from "@/lib/utils/formatters";

interface ResultDetailDrawerProps {
  document: ArchiveDocument | null;
  result: SearchResultItem | null;
  relatedRecords: RelatedRecord[];
  highlightTerms: string[];
  currentSearchQuery?: string;
  onClose: () => void;
  onSelectRecord: (id: string) => void;
}

export function ResultDetailDrawer({
  document,
  result,
  relatedRecords,
  highlightTerms,
  currentSearchQuery,
  onClose,
  onSelectRecord,
}: ResultDetailDrawerProps) {
  const detailScrollRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [drawerView, setDrawerView] = useState<DrawerView>("details");
  const [chatThreads, setChatThreads] = useState<RecordChatHistoryMap>({});
  const [storageReady, setStorageReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [retryPrompt, setRetryPrompt] = useState<string | null>(null);
  const activeRecordId = document?.id ?? "";
  const messages = activeRecordId ? chatThreads[activeRecordId] ?? [] : [];

  useEffect(() => {
    setPortalTarget(window.document.body);
  }, []);

  useEffect(() => {
    setChatThreads(loadRecordChatHistoryMap());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    saveRecordChatHistoryMap(chatThreads);
  }, [chatThreads, storageReady]);

  useEffect(() => {
    if (!document) {
      return;
    }

    setDrawerView("details");
    setDraft("");
    setChatError(null);
    setRetryPrompt(null);
  }, [document?.id]);

  useLayoutEffect(() => {
    if (!document) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (drawerView === "details" && detailScrollRef.current) {
        detailScrollRef.current.scrollTo({ top: 0, behavior: "auto" });
        detailScrollRef.current.focus({ preventScroll: true });
      }

      if (drawerView === "chat" && chatScrollRef.current) {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: "auto",
        });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [document?.id, drawerView]);

  useEffect(() => {
    if (drawerView !== "chat" || !chatScrollRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      chatScrollRef.current?.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [drawerView, messages.length, isSending]);

  useEffect(() => {
    if (!document) {
      return;
    }

    const { body, documentElement } = window.document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [document]);

  useEffect(() => {
    if (!document) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (drawerView === "chat") {
          setDrawerView("details");
          return;
        }

        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [document, drawerView, onClose]);

  if (!document) {
    return null;
  }

  if (!portalTarget) {
    return null;
  }

  const hasConversation = messages.length > 0;

  const recordContext = {
    document,
    result: result
      ? {
          whyMatched: result.whyMatched,
          matchedFields: result.matchedFields,
          snippet: result.snippet,
        }
      : null,
    relatedRecords: relatedRecords.slice(0, 4).map((record) => ({
      document: {
        id: record.document.id,
        title: record.document.title,
      },
      reasons: record.reasons,
    })),
    currentSearchQuery,
  };

  const appendMessages = (recordId: string, nextMessages: RecordChatMessage[]) => {
    setChatThreads((current) => ({
      ...current,
      [recordId]: capRecordChatMessages(nextMessages),
    }));
  };

  const requestAssistantReply = async (
    latestUserMessage: string,
    historyBeforeUser: RecordChatMessage[],
  ) => {
    const payload: RecordChatRequestBody = {
      recordId: document.id,
      latestUserMessage,
      chatHistory: historyBeforeUser,
      recordContext,
    };

    const response = await fetch("/api/record-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as { reply?: string; error?: string };

    if (!response.ok || !json.reply) {
      throw new Error(json.error ?? "The record companion could not answer right now.");
    }

    return json.reply;
  };

  const handleSubmitMessage = async (value?: string, retry = false) => {
    const prompt = (value ?? draft).trim();
    if (!prompt || isSending) {
      return;
    }

    setDrawerView("chat");
    setChatError(null);
    setRetryPrompt(null);
    setDraft("");
    setIsSending(true);

    const userMessage: RecordChatMessage = {
      id: `${document.id}-user-${Date.now()}`,
      role: "user",
      content: prompt,
      createdAt: Date.now(),
    };

    const historyBeforeUser = retry ? messages.slice(0, -1) : messages;
    const historyWithUser = retry ? messages : [...historyBeforeUser, userMessage];

    if (!retry) {
      appendMessages(document.id, historyWithUser);
    }

    try {
      const reply = await requestAssistantReply(prompt, historyBeforeUser);
      const assistantMessage: RecordChatMessage = {
        id: `${document.id}-assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      };

      appendMessages(document.id, [...historyWithUser, assistantMessage]);
      setRetryPrompt(null);
      setChatError(null);
    } catch (error) {
      setRetryPrompt(prompt);
      setChatError(error instanceof Error ? error.message : "The record companion could not answer right now.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = retryPrompt
    ? () => {
        void handleSubmitMessage(retryPrompt, true);
      }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[rgba(27,23,16,0.32)] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close record detail drawer"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={`record-detail-title-${document.id}`}
        className="panel-strong absolute inset-x-3 inset-y-3 z-10 flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] shadow-[0_28px_90px_rgba(20,14,8,0.24)] md:inset-y-4 md:right-4 md:left-auto md:w-[min(40rem,calc(100vw-2rem))]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {drawerView === "details" ? (
            <motion.div
              key={`details-${document.id}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <header className="shrink-0 border-b border-[var(--border)] bg-[rgba(255,248,237,0.96)] px-5 py-5 md:px-6 md:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
                      Record detail
                    </p>
                    <h2
                      id={`record-detail-title-${document.id}`}
                      className="mt-3 font-display text-3xl leading-tight text-[var(--foreground)] md:text-[2.45rem]"
                    >
                      <HighlightText text={document.title} terms={highlightTerms} />
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="focus-ring shrink-0 rounded-full border border-[var(--border)] bg-white/72 p-3 text-[var(--foreground)]"
                    aria-label="Close record detail"
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
              </header>

              <RecordDetailView
                document={document}
                result={result}
                relatedRecords={relatedRecords}
                highlightTerms={highlightTerms}
                hasConversation={hasConversation}
                scrollRef={detailScrollRef}
                onAsk={() => setDrawerView("chat")}
                onSelectRecord={onSelectRecord}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`chat-${document.id}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <header className="shrink-0 border-b border-[var(--border)] bg-[rgba(255,248,237,0.96)] px-5 py-5 md:px-6 md:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setDrawerView("details")}
                      className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to details
                    </button>
                    <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
                      Record companion
                    </p>
                    <h2 className="mt-3 font-display text-3xl leading-tight text-[var(--foreground)] md:text-[2.45rem]">
                      Record Companion
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
                      Ask grounded questions about this record and its metadata.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="focus-ring shrink-0 rounded-full border border-[var(--border)] bg-white/72 p-3 text-[var(--foreground)]"
                    aria-label="Close record detail"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge tone="muted">{document.title}</Badge>
                  <Badge tone="accent">{document.type}</Badge>
                  <Badge tone="teal">{document.place}</Badge>
                </div>
              </header>

              <RecordChatView
                draft={draft}
                messages={messages}
                isLoading={isSending}
                error={chatError}
                scrollRef={chatScrollRef}
                onDraftChange={setDraft}
                onSend={() => {
                  void handleSubmitMessage();
                }}
                onRetry={handleRetry}
                onSuggestionSelect={(value) => {
                  void handleSubmitMessage(value);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>,
    portalTarget,
  );
}
