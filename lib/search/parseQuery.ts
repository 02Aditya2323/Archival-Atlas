import { tokenize } from "./tokenize";
import type { ParsedQuery, SearchField } from "./types";
import { normalizeText } from "./normalizeText";

interface ParseQueryOptions {
  advanced?: boolean;
}

const SEARCHABLE_FIELD_ALIASES: Record<string, SearchField> = {
  author: "author",
  collection: "collection",
  description: "description",
  keyword: "keywords",
  keywords: "keywords",
  place: "place",
  subject: "subjects",
  subjects: "subjects",
  tag: "tags",
  tags: "tags",
  title: "title",
};

const FACET_FIELD_ALIASES: Record<
  string,
  "type" | "region" | "language" | "holdingInstitution"
> = {
  institution: "holdingInstitution",
  language: "language",
  region: "region",
  type: "type",
};

function pushUnique(target: string[], value: string) {
  if (value && !target.includes(value)) {
    target.push(value);
  }
}

export function parseQuery(raw: string, options: ParseQueryOptions = {}): ParsedQuery {
  const advanced = Boolean(options.advanced);
  let working = raw.trim();
  const phrases: string[] = [];
  const searchableFieldTerms: ParsedQuery["searchableFieldTerms"] = {};
  const facetFieldTerms: ParsedQuery["facetFieldTerms"] = {};

  working = working.replace(
    /(^|\s)([a-zA-Z]+):("([^"]+)"|[^\s]+)/g,
    (_, prefix: string, rawField: string, rawValue: string, quotedValue?: string) => {
      const value = normalizeText(quotedValue ?? rawValue.replace(/^"|"$/g, ""));
      const field = rawField.toLowerCase();

      if (SEARCHABLE_FIELD_ALIASES[field] && value) {
        const key = SEARCHABLE_FIELD_ALIASES[field];
        const nextValues = searchableFieldTerms[key] ?? [];
        pushUnique(nextValues, value);
        searchableFieldTerms[key] = nextValues;
      } else if (FACET_FIELD_ALIASES[field] && value) {
        const key = FACET_FIELD_ALIASES[field];
        const nextValues = facetFieldTerms[key] ?? [];
        pushUnique(nextValues, value);
        facetFieldTerms[key] = nextValues;
      }

      return prefix;
    },
  );

  working = working.replace(/"([^"]+)"/g, (_, phrase: string) => {
    const normalized = normalizeText(phrase);
    if (normalized) {
      pushUnique(phrases, normalized);
    }
    return " ";
  });

  const rangeMatch =
    raw.match(/\b(\d{3,4})\s*-\s*(\d{3,4})\b/) ??
    raw.match(/\b(\d{3,4})\s+to\s+(\d{3,4})\b/i);

  const yearRange = rangeMatch
    ? ([Number(rangeMatch[1]), Number(rangeMatch[2])].sort(
        (left, right) => left - right,
      ) as [number, number])
    : null;

  const years = [...working.matchAll(/\b\d{4}\b/g)]
    .map((match) => Number(match[0]))
    .filter((year) => Number.isFinite(year));

  const mode = advanced && /\bOR\b/i.test(working) ? "OR" : "AND";
  const booleanFreeText = advanced ? working.replace(/\b(?:AND|OR)\b/gi, " ") : working;
  const freeTerms = tokenize(booleanFreeText, {
    minLength: 2,
    removeStopWords: true,
  }).filter((token) => !years.includes(Number(token)));

  const highlightTerms = [...new Set([
    ...phrases,
    ...freeTerms,
    ...Object.values(searchableFieldTerms).flat(),
  ])];

  return {
    raw,
    normalized: normalizeText(raw),
    freeTerms,
    phrases,
    searchableFieldTerms,
    facetFieldTerms,
    years,
    yearRange,
    mode,
    highlightTerms,
    hasText:
      freeTerms.length > 0 ||
      phrases.length > 0 ||
      Object.values(searchableFieldTerms).flat().length > 0,
    advanced,
  };
}
