import { getPrefixes, tokenize } from "./tokenize";
import type { ArchiveDocument, SearchField, SearchIndex, SuggestionSeed } from "./types";
import { SEARCHABLE_FIELDS } from "./types";
import { normalizeText } from "./normalizeText";

function createFieldMap<T>(factory: () => T) {
  return Object.fromEntries(
    SEARCHABLE_FIELDS.map((field) => [field, factory()]),
  ) as Record<SearchField, T>;
}

function pushSuggestion(
  suggestions: SuggestionSeed[],
  seen: Set<string>,
  value: string,
  category: SuggestionSeed["category"],
  weight: number,
) {
  const key = `${category}:${value}`;
  if (!value || seen.has(key)) {
    return;
  }

  seen.add(key);
  suggestions.push({
    value,
    normalized: normalizeText(value),
    category,
    weight,
  });
}

export function buildIndex(documents: ArchiveDocument[]): SearchIndex {
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const invertedIndex = createFieldMap(() => new Map<string, Map<string, number>>());
  const docFrequencies = createFieldMap(() => new Map<string, number>());
  const docLengths = createFieldMap(() => new Map<string, number>());
  const prefixIndex = new Map<string, Set<string>>();
  const tokenSet = new Set<string>();
  const globalDocFrequencies = new Map<string, number>();
  const suggestionCatalog: SuggestionSeed[] = [];
  const suggestionSeen = new Set<string>();

  let minYear = Number.POSITIVE_INFINITY;
  let maxYear = Number.NEGATIVE_INFINITY;

  documents.forEach((document) => {
    if (document.year !== null) {
      minYear = Math.min(minYear, document.year);
      maxYear = Math.max(maxYear, document.year);
    }

    pushSuggestion(suggestionCatalog, suggestionSeen, document.title, "title", 8);
    pushSuggestion(suggestionCatalog, suggestionSeen, document.place, "place", 6);
    pushSuggestion(
      suggestionCatalog,
      suggestionSeen,
      document.collection,
      "collection",
      4,
    );
    if (document.author !== "Unknown") {
      pushSuggestion(suggestionCatalog, suggestionSeen, document.author, "author", 4);
    }
    document.subjects.forEach((subject) =>
      pushSuggestion(suggestionCatalog, suggestionSeen, subject, "subject", 6),
    );
    document.tags.forEach((tag) =>
      pushSuggestion(suggestionCatalog, suggestionSeen, tag, "tag", 5),
    );
    document.keywords.forEach((keyword) =>
      pushSuggestion(suggestionCatalog, suggestionSeen, keyword, "keyword", 4),
    );

    SEARCHABLE_FIELDS.forEach((field) => {
      const tokens = tokenize(document.searchable[field]);
      docLengths[field].set(document.id, Math.max(tokens.length, 1));

      const tokenCounts = new Map<string, number>();
      tokens.forEach((token) =>
        tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1),
      );

      tokenCounts.forEach((count, token) => {
        tokenSet.add(token);

        if (!invertedIndex[field].has(token)) {
          invertedIndex[field].set(token, new Map());
        }
        invertedIndex[field].get(token)?.set(document.id, count);

        docFrequencies[field].set(token, (docFrequencies[field].get(token) ?? 0) + 1);
        globalDocFrequencies.set(
          token,
          (globalDocFrequencies.get(token) ?? 0) + 1,
        );

        getPrefixes(token).forEach((prefix) => {
          if (!prefixIndex.has(prefix)) {
            prefixIndex.set(prefix, new Set());
          }
          prefixIndex.get(prefix)?.add(token);
        });
      });
    });
  });

  const averageFieldLengths = createFieldMap(() => 0);

  SEARCHABLE_FIELDS.forEach((field) => {
    const lengths = [...docLengths[field].values()];
    const total = lengths.reduce((sum, length) => sum + length, 0);
    averageFieldLengths[field] = lengths.length ? total / lengths.length : 1;
  });

  return {
    documents,
    documentsById,
    invertedIndex,
    docFrequencies,
    docLengths,
    averageFieldLengths,
    tokenSet,
    lexicon: [...tokenSet],
    prefixIndex,
    globalDocFrequencies,
    minYear: Number.isFinite(minYear) ? minYear : 0,
    maxYear: Number.isFinite(maxYear) ? maxYear : 0,
    suggestionCatalog,
  };
}
