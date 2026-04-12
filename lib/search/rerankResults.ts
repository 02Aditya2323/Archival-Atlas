import { buildSnippet } from "./highlight";
import type {
  MatchKind,
  ParsedQuery,
  SearchField,
  SearchIndex,
  SearchResultItem,
} from "./types";
import { FIELD_WEIGHTS, SEARCHABLE_FIELDS } from "./types";

interface EvidenceShape {
  matchedFields: Set<SearchField>;
  matchedTermsByField: Partial<Record<SearchField, Set<string>>>;
  matchKinds: Set<MatchKind>;
  matchedGroups: Set<string>;
}

const BM25_K1 = 1.2;
const BM25_B = 0.75;

function bm25(
  fieldDocCount: number,
  documentFrequency: number,
  termFrequency: number,
  fieldLength: number,
  averageFieldLength: number,
) {
  const idf = Math.log(
    1 + (fieldDocCount - documentFrequency + 0.5) / (documentFrequency + 0.5),
  );
  const numerator = termFrequency * (BM25_K1 + 1);
  const denominator =
    termFrequency +
    BM25_K1 * (1 - BM25_B + BM25_B * (fieldLength / Math.max(averageFieldLength, 1)));

  return idf * (numerator / denominator);
}

function scoreToken(
  index: SearchIndex,
  docId: string,
  term: string,
  fields: readonly SearchField[],
  multiplier: number,
) {
  let score = 0;

  fields.forEach((field) => {
    const postings = index.invertedIndex[field].get(term);
    const tf = postings?.get(docId);
    if (!tf) {
      return;
    }

    const df = index.docFrequencies[field].get(term) ?? 1;
    const fieldLength = index.docLengths[field].get(docId) ?? 1;
    const fieldDocCount = index.docLengths[field].size;
    const base = bm25(
      fieldDocCount,
      df,
      tf,
      fieldLength,
      index.averageFieldLengths[field],
    );
    score += base * FIELD_WEIGHTS[field] * multiplier;
  });

  return score;
}

function resolveQueryTermMatches(index: SearchIndex, term: string) {
  const resolved: Array<{ token: string; kind: Exclude<MatchKind, "phrase"> }> = [];

  if (index.tokenSet.has(term)) {
    resolved.push({ token: term, kind: "exact" });
  }

  if (resolved.length === 0) {
    const prefixMatches = [...(index.prefixIndex.get(term) ?? [])].slice(0, 8);
    prefixMatches.forEach((token) => {
      resolved.push({ token, kind: "prefix" });
    });
  }

  if (resolved.length === 0 && term.length >= 4) {
    index.lexicon
      .filter((candidate) => candidate.startsWith(term.slice(0, 1)))
      .filter((candidate) => Math.abs(candidate.length - term.length) <= 2)
      .map((candidate) => ({
        token: candidate,
        distance: levenshteinDistance(term, candidate),
      }))
      .filter((candidate) => candidate.distance <= (term.length >= 8 ? 2 : 1))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 5)
      .forEach((candidate) => resolved.push({ token: candidate.token, kind: "fuzzy" }));
  }

  return resolved;
}

function levenshteinDistance(left: string, right: string) {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0),
  );

  for (let row = 0; row <= left.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function pushReason(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

export function rerankResults(
  index: SearchIndex,
  parsedQuery: ParsedQuery,
  candidateIds: string[],
  evidence: Map<string, EvidenceShape>,
) {
  return candidateIds
    .map<SearchResultItem>((docId) => {
      const document = index.documentsById.get(docId);
      if (!document) {
        throw new Error(`Missing document for id ${docId}`);
      }

      const currentEvidence = evidence.get(docId);
      const reasons: string[] = [];
      let score = 0;

      if (!parsedQuery.hasText) {
        score += document.completeness * 2.2;
        if (document.year !== null) {
          score += 0.12;
        }
        pushReason(reasons, "Metadata-rich archival record");
      } else {
        parsedQuery.freeTerms.forEach((term) => {
          const matches = resolveQueryTermMatches(index, term);
          matches.forEach((match) => {
            const multiplier =
              match.kind === "exact" ? 1 : match.kind === "prefix" ? 0.72 : 0.42;
            score += scoreToken(index, docId, match.token, SEARCHABLE_FIELDS, multiplier);
          });
        });

        Object.entries(parsedQuery.searchableFieldTerms).forEach(([field, values]) => {
          (values ?? []).forEach((value) => {
            const typedField = field as SearchField;

            if (value.includes(" ")) {
              if (document.searchable[typedField].includes(value)) {
                score += FIELD_WEIGHTS[typedField] * 2.4;
                pushReason(reasons, `Exact phrase in ${typedField}`);
              }
              return;
            }

            const matches = resolveQueryTermMatches(index, value);
            matches.forEach((match) => {
              const multiplier =
                match.kind === "exact" ? 1.12 : match.kind === "prefix" ? 0.82 : 0.46;
              score += scoreToken(index, docId, match.token, [typedField], multiplier);
            });
          });
        });

        parsedQuery.phrases.forEach((phrase) => {
          SEARCHABLE_FIELDS.forEach((field) => {
            if (document.searchable[field].includes(phrase)) {
              const multiplier =
                field === "title" ? 2.2 : field === "subjects" || field === "tags" ? 1.8 : 1.25;
              score += FIELD_WEIGHTS[field] * multiplier;
              pushReason(reasons, `Phrase match in ${field}`);
            }
          });
        });

        if (parsedQuery.normalized && document.searchable.title === parsedQuery.normalized) {
          score += 9;
          pushReason(reasons, "Exact title match");
        } else if (
          parsedQuery.normalized.length >= 4 &&
          document.searchable.title.includes(parsedQuery.normalized)
        ) {
          score += 4.8;
          pushReason(reasons, "Query phrase appears in title");
        }

        const matchedFieldCount = currentEvidence?.matchedFields.size ?? 0;
        if (matchedFieldCount > 1) {
          score += (matchedFieldCount - 1) * 0.65;
          pushReason(reasons, "Hits across multiple metadata fields");
        }

        const curatedHits =
          Number(currentEvidence?.matchedFields.has("subjects")) +
          Number(currentEvidence?.matchedFields.has("tags")) +
          Number(currentEvidence?.matchedFields.has("keywords"));

        if (curatedHits) {
          score += curatedHits * 0.82;
          pushReason(reasons, "Strong curated subject metadata alignment");
        }

        if (
          currentEvidence?.matchKinds.size === 1 &&
          currentEvidence.matchKinds.has("fuzzy")
        ) {
          score -= 0.9;
          pushReason(reasons, "Matched through typo-tolerant fallback");
        }

        if (parsedQuery.years.length && document.year !== null) {
          if (parsedQuery.years.includes(document.year)) {
            score += 1.7;
            pushReason(reasons, "Exact year mentioned in query");
          } else if (
            parsedQuery.years.some((year) => Math.abs(year - document.year!) <= 5)
          ) {
            score += 0.6;
          }
        }

        score += document.completeness * 0.45;
      }

      if (document.place !== "Unknown place") {
        score += 0.04;
      }
      if (document.author !== "Unknown") {
        score += 0.04;
      }

      return {
        document,
        score,
        snippet: buildSnippet(document.description, parsedQuery.highlightTerms),
        matchedFields: [...(currentEvidence?.matchedFields ?? new Set<SearchField>())],
        matchedTermsByField: Object.fromEntries(
          Object.entries(currentEvidence?.matchedTermsByField ?? {}).map(([field, values]) => [
            field,
            [...(values ?? new Set<string>())],
          ]),
        ) as Partial<Record<SearchField, string[]>>,
        matchKinds: [...(currentEvidence?.matchKinds ?? new Set<MatchKind>())],
        whyMatched: reasons.slice(0, 4),
      };
    })
    .sort((left, right) => right.score - left.score);
}
