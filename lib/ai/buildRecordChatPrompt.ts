import type { RecordChatContext } from "@/lib/ai/types";

function joinValues(values: string[]) {
  return values.length ? values.join(", ") : "Not specified";
}

export function buildRecordContextBlock({
  document,
  result,
  relatedRecords,
  currentSearchQuery,
}: RecordChatContext) {
  const lines = [
    `Record ID: ${document.id}`,
    `Title: ${document.title}`,
    `Description: ${document.description}`,
    `Type: ${document.type}`,
    `Date: ${document.date ?? "Not specified"}`,
    `Place: ${document.place}`,
    `Region: ${document.region}`,
    `Language: ${document.language}`,
    `Institution: ${document.holdingInstitution}`,
    `Author: ${document.author}`,
    `Collection: ${document.collection}`,
    `Format: ${document.format}`,
    `Subjects: ${joinValues(document.subjects)}`,
    `Tags: ${joinValues(document.tags)}`,
    `Keywords: ${joinValues(document.keywords)}`,
  ];

  if (currentSearchQuery?.trim()) {
    lines.push(`Current search query: ${currentSearchQuery.trim()}`);
  }

  if (result?.whyMatched.length) {
    lines.push(`Why this matched: ${result.whyMatched.join("; ")}`);
  }

  if (result?.matchedFields.length) {
    lines.push(`Matched fields: ${result.matchedFields.join(", ")}`);
  }

  if (relatedRecords.length) {
    lines.push(
      `Related records: ${relatedRecords
        .slice(0, 4)
        .map((record) => `${record.document.title} (${record.reasons.slice(0, 2).join("; ")})`)
        .join(" | ")}`,
    );
  }

  return lines.join("\n");
}

export function buildRecordChatSystemInstruction() {
  return [
    "You are Record Companion, a grounded research assistant inside an archival discovery system.",
    "Answer only from the supplied record metadata, match evidence, current query, and related-record hints.",
    "Do not invent unsupported historical facts, dates, provenance, or interpretation beyond the provided metadata.",
    "If the metadata does not support a claim, say that clearly and suggest what the researcher should inspect next.",
    "Be concise, insightful, and calm. Prefer short paragraphs or a short flat bullet list when it improves clarity.",
    "When the user asks why the record matched, anchor your explanation in the supplied match evidence and metadata fields.",
  ].join(" ");
}
