import { tokenize } from "./tokenize";
import type { BooleanOperator, ParsedQuery, SearchField } from "./types";
import { BOOLEAN_SEARCH_FIELDS } from "./types";
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

function pushBooleanClause(
  target: ParsedQuery["booleanClauses"],
  clause: Omit<ParsedQuery["booleanClauses"][number], "id">,
) {
  target.push({
    ...clause,
    id: `${clause.fields.join(",")}:${clause.kind}:${clause.value}:${target.length}`,
  });
}

export function parseQuery(raw: string, options: ParseQueryOptions = {}): ParsedQuery {
  const advanced = Boolean(options.advanced);
  const working = raw.trim();
  const phrases: string[] = [];
  const searchableFieldTerms: ParsedQuery["searchableFieldTerms"] = {};
  const facetFieldTerms: ParsedQuery["facetFieldTerms"] = {};
  const booleanClauses: ParsedQuery["booleanClauses"] = [];
  let pendingOperator: BooleanOperator | null = null;
  const tokenPattern = /([a-zA-Z]+):("([^"]+)"|[^\s]+)|"([^"]+)"|\b(AND|OR)\b|(\S+)/gi;

  const appendTermClauses = (
    rawValue: string,
    fields: SearchField[],
    source: "free" | "field",
  ) => {
    const terms = tokenize(rawValue, {
      minLength: 2,
      removeStopWords: true,
    });

    terms.forEach((term, index) => {
      if (/^\d{4}$/.test(term)) {
        return;
      }

      if (source === "free") {
        pushUnique(freeTerms, term);
      }

      pushBooleanClause(booleanClauses, {
        value: term,
        fields,
        kind: "term",
        operator:
          booleanClauses.length === 0
            ? null
            : index === 0
              ? (pendingOperator ?? "AND")
              : "AND",
      });
    });

    if (terms.length > 0) {
      pendingOperator = null;
    }
  };

  const freeTerms: string[] = [];

  for (const match of working.matchAll(tokenPattern)) {
    const [, rawField, rawFieldValue, quotedFieldValue, quotedPhrase, operator, freeToken] = match;

    if (operator) {
      pendingOperator = operator.toUpperCase() as BooleanOperator;
      continue;
    }

    if (rawField && rawFieldValue) {
      const value = normalizeText(quotedFieldValue ?? rawFieldValue.replace(/^"|"$/g, ""));
      const field = rawField.toLowerCase();

      if (SEARCHABLE_FIELD_ALIASES[field] && value) {
        const key = SEARCHABLE_FIELD_ALIASES[field];
        const nextValues = searchableFieldTerms[key] ?? [];
        pushUnique(nextValues, value);
        searchableFieldTerms[key] = nextValues;

        if (value.includes(" ")) {
          pushBooleanClause(booleanClauses, {
            value,
            fields: [key],
            kind: "phrase",
            operator: booleanClauses.length === 0 ? null : (pendingOperator ?? "AND"),
          });
          pendingOperator = null;
        } else {
          appendTermClauses(value, [key], "field");
        }
      } else if (FACET_FIELD_ALIASES[field] && value) {
        const key = FACET_FIELD_ALIASES[field];
        const nextValues = facetFieldTerms[key] ?? [];
        pushUnique(nextValues, value);
        facetFieldTerms[key] = nextValues;
      }

      continue;
    }

    if (quotedPhrase) {
      const normalized = normalizeText(quotedPhrase);
      if (normalized) {
        pushUnique(phrases, normalized);
        pushBooleanClause(booleanClauses, {
          value: normalized,
          fields: [...BOOLEAN_SEARCH_FIELDS],
          kind: "phrase",
          operator: booleanClauses.length === 0 ? null : (pendingOperator ?? "AND"),
        });
        pendingOperator = null;
      }
      continue;
    }

    if (freeToken) {
      appendTermClauses(freeToken, [...BOOLEAN_SEARCH_FIELDS], "free");
    }
  }

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

  const mode = booleanClauses.some((clause) => clause.operator === "OR") ? "OR" : "AND";

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
    booleanClauses,
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
