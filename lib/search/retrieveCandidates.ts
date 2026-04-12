import { tokenize } from "./tokenize";
import type { MatchKind, ParsedQuery, SearchField, SearchIndex } from "./types";
import { SEARCHABLE_FIELDS } from "./types";

interface MatchEvidence {
  matchedFields: Set<SearchField>;
  matchedTermsByField: Partial<Record<SearchField, Set<string>>>;
  matchKinds: Set<MatchKind>;
  matchedGroups: Set<string>;
}

export interface CandidateRetrieval {
  candidateIds: string[];
  evidence: Map<string, MatchEvidence>;
}

interface ResolvedTerm {
  token: string;
  kind: Exclude<MatchKind, "phrase">;
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

function resolveTermMatches(index: SearchIndex, term: string): ResolvedTerm[] {
  const resolved: ResolvedTerm[] = [];

  if (index.tokenSet.has(term)) {
    resolved.push({ token: term, kind: "exact" });
  }

  const prefixCandidates = [...(index.prefixIndex.get(term) ?? [])]
    .filter((token) => token !== term)
    .sort(
      (left, right) =>
        (index.globalDocFrequencies.get(right) ?? 0) -
        (index.globalDocFrequencies.get(left) ?? 0),
    )
    .slice(0, 8);

  prefixCandidates.forEach((token) => {
    resolved.push({ token, kind: "prefix" });
  });

  if (resolved.length === 0 && term.length >= 4) {
    const maxDistance = term.length >= 8 ? 2 : 1;
    const fuzzyMatches = index.lexicon
      .filter((candidate) => candidate[0] === term[0])
      .filter(
        (candidate) => Math.abs(candidate.length - term.length) <= maxDistance,
      )
      .map((candidate) => ({
        token: candidate,
        distance: levenshteinDistance(term, candidate),
      }))
      .filter((candidate) => candidate.distance <= maxDistance)
      .sort((left, right) => {
        if (left.distance !== right.distance) {
          return left.distance - right.distance;
        }

        return (
          (index.globalDocFrequencies.get(right.token) ?? 0) -
          (index.globalDocFrequencies.get(left.token) ?? 0)
        );
      })
      .slice(0, 6);

    fuzzyMatches.forEach((candidate) => {
      resolved.push({ token: candidate.token, kind: "fuzzy" });
    });
  }

  return resolved;
}

function registerEvidence(
  evidence: Map<string, MatchEvidence>,
  docId: string,
  field: SearchField,
  value: string,
  groupId: string,
  kind: MatchKind,
) {
  if (!evidence.has(docId)) {
    evidence.set(docId, {
      matchedFields: new Set<SearchField>(),
      matchedTermsByField: {},
      matchKinds: new Set<MatchKind>(),
      matchedGroups: new Set<string>(),
    });
  }

  const current = evidence.get(docId);
  if (!current) {
    return;
  }

  current.matchedFields.add(field);
  current.matchKinds.add(kind);
  current.matchedGroups.add(groupId);

  if (!current.matchedTermsByField[field]) {
    current.matchedTermsByField[field] = new Set<string>();
  }
  current.matchedTermsByField[field]?.add(value);
}

function intersectSets(sets: Set<string>[]) {
  if (sets.length === 0) {
    return new Set<string>();
  }

  const [first, ...rest] = sets;
  const result = new Set<string>();
  first.forEach((value) => {
    if (rest.every((set) => set.has(value))) {
      result.add(value);
    }
  });
  return result;
}

export function retrieveCandidates(
  index: SearchIndex,
  parsedQuery: ParsedQuery,
): CandidateRetrieval {
  const evidence = new Map<string, MatchEvidence>();
  const groupSets: Set<string>[] = [];

  const termGroups = [
    ...parsedQuery.freeTerms.map((term) => ({
      id: `free:${term}`,
      value: term,
      fields: SEARCHABLE_FIELDS,
      kind: "term" as const,
    })),
    ...Object.entries(parsedQuery.searchableFieldTerms).flatMap(([field, values]) =>
      (values ?? []).map((value) => ({
        id: `${field}:${value}`,
        value,
        fields: [field as SearchField] as SearchField[],
        kind: value.includes(" ") ? ("phrase" as const) : ("term" as const),
      })),
    ),
    ...parsedQuery.phrases.map((phrase) => ({
      id: `phrase:${phrase}`,
      value: phrase,
      fields: SEARCHABLE_FIELDS,
      kind: "phrase" as const,
    })),
  ];

  if (termGroups.length === 0) {
    return {
      candidateIds: index.documents.map((document) => document.id),
      evidence,
    };
  }

  termGroups.forEach((group) => {
    const groupMatches = new Set<string>();

    if (group.kind === "term") {
      const matches = resolveTermMatches(index, group.value);

      matches.forEach((match) => {
        group.fields.forEach((field) => {
          const postings = index.invertedIndex[field].get(match.token);
          if (!postings) {
            return;
          }

          postings.forEach((_, docId) => {
            groupMatches.add(docId);
            registerEvidence(
              evidence,
              docId,
              field,
              group.value,
              group.id,
              match.kind,
            );
          });
        });
      });
    } else {
      const phraseTokens = tokenize(group.value, { minLength: 2 });
      if (phraseTokens.length === 0) {
        return;
      }

      const seedDocs = new Set<string>();

      phraseTokens.forEach((token) => {
        group.fields.forEach((field) => {
          const postings = index.invertedIndex[field].get(token);
          postings?.forEach((_, docId) => seedDocs.add(docId));
        });
      });

      seedDocs.forEach((docId) => {
        const document = index.documentsById.get(docId);
        if (!document) {
          return;
        }

        const matchedField = group.fields.find((field) =>
          document.searchable[field].includes(group.value),
        );

        if (!matchedField) {
          return;
        }

        groupMatches.add(docId);
        registerEvidence(
          evidence,
          docId,
          matchedField,
          group.value,
          group.id,
          "phrase",
        );
      });
    }

    groupSets.push(groupMatches);
  });

  const candidateIds =
    parsedQuery.mode === "AND"
      ? [...intersectSets(groupSets)]
      : [...new Set(groupSets.flatMap((group) => [...group]))];

  return {
    candidateIds,
    evidence,
  };
}
