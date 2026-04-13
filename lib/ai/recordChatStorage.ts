import type { RecordChatMessage } from "@/lib/ai/types";

const STORAGE_KEY = "digital-curator-record-chat-history";
const MAX_STORED_MESSAGES = 40;

export type RecordChatHistoryMap = Record<string, RecordChatMessage[]>;

function isValidMessage(value: unknown): value is RecordChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RecordChatMessage>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "number"
  );
}

function sanitizeMessages(messages: unknown): RecordChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(isValidMessage)
    .map((message) => ({
      ...message,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_STORED_MESSAGES);
}

export function capRecordChatMessages(messages: RecordChatMessage[]) {
  return messages.slice(-MAX_STORED_MESSAGES);
}

export function loadRecordChatHistoryMap(): RecordChatHistoryMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed as Record<string, unknown>).reduce<RecordChatHistoryMap>(
      (accumulator, [recordId, messages]) => {
        accumulator[recordId] = sanitizeMessages(messages);
        return accumulator;
      },
      {},
    );
  } catch {
    return {};
  }
}

export function saveRecordChatHistoryMap(historyMap: RecordChatHistoryMap) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(historyMap));
  } catch {
    // Local storage is an enhancement; keep in-memory state if writes fail.
  }
}
