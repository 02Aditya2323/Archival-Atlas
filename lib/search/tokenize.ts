import { normalizeText } from "./normalizeText";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

interface TokenizeOptions {
  removeStopWords?: boolean;
  minLength?: number;
}

export function tokenize(value: string, options: TokenizeOptions = {}) {
  const normalized = normalizeText(value);
  const minLength = options.minLength ?? 1;

  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .filter((token) => token.length >= minLength)
    .filter((token) => !options.removeStopWords || !STOP_WORDS.has(token));
}

export function getPrefixes(token: string, minLength = 2, maxLength = 12) {
  const prefixes: string[] = [];
  for (
    let length = minLength;
    length <= Math.min(token.length, maxLength);
    length += 1
  ) {
    prefixes.push(token.slice(0, length));
  }
  return prefixes;
}
