import type { HighlightChunk } from "./types";

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightText(text: string, terms: string[]): HighlightChunk[] {
  const normalizedTerms = [...new Set(terms.map((term) => term.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length)
    .slice(0, 12);

  if (!normalizedTerms.length) {
    return [{ text, match: false }];
  }

  const expression = new RegExp(
    `(${normalizedTerms.map((term) => escapeForRegExp(term)).join("|")})`,
    "gi",
  );

  const parts = text.split(expression).filter(Boolean);
  return parts.map((part) => ({
    text: part,
    match: normalizedTerms.some((term) => term.toLowerCase() === part.toLowerCase()),
  }));
}

export function buildSnippet(text: string, terms: string[], limit = 180) {
  if (text.length <= limit) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const firstMatch = terms
    .map((term) => lowerText.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (firstMatch === undefined) {
    return `${text.slice(0, limit).trimEnd()}…`;
  }

  const start = Math.max(0, firstMatch - 48);
  const end = Math.min(text.length, start + limit);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
