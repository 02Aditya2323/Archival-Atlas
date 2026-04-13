import type { ArchiveDocument, RelatedRecord, SearchResultItem } from "@/lib/search/types";

export type DrawerView = "details" | "chat";
export type RecordChatRole = "user" | "assistant";

export interface RecordChatMessage {
  id: string;
  role: RecordChatRole;
  content: string;
  createdAt: number;
}

export interface RecordChatContext {
  document: ArchiveDocument;
  result: Pick<SearchResultItem, "whyMatched" | "matchedFields" | "snippet"> | null;
  relatedRecords: Array<Pick<RelatedRecord, "reasons"> & { document: Pick<ArchiveDocument, "id" | "title"> }>;
  currentSearchQuery?: string;
}

export interface RecordChatRequestBody {
  recordId: string;
  latestUserMessage: string;
  chatHistory: RecordChatMessage[];
  recordContext: RecordChatContext;
}

export interface RecordChatResponseBody {
  reply: string;
  model: string;
  source?: "gemini" | "fallback";
}
