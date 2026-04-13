import { buildIndex } from "./buildIndex";
import { computeFacets, matchesFilters } from "./computeFacets";
import { retrieveCandidates } from "./retrieveCandidates";
import { rerankResults } from "./rerankResults";
import { getRelatedRecords } from "./relatedRecords";
import type {
  ArchiveDocument,
  ParsedQuery,
  RelationshipGraph,
  SearchResultItem,
  SearchFilters,
  SearchResponse,
  SortOption,
  TimelineData,
} from "./types";
import { normalizeText } from "./normalizeText";

function mergeQueryFilters(parsedQuery: ParsedQuery, filters: SearchFilters): SearchFilters {
  const merge = (existing: string[], incoming: string[] | undefined) => {
    const merged = [...existing];
    (incoming ?? []).forEach((value) => {
      if (!merged.some((candidate) => normalizeText(candidate) === normalizeText(value))) {
        merged.push(value);
      }
    });
    return merged;
  };

  let dateRange = filters.dateRange;
  if (parsedQuery.yearRange) {
    if (!dateRange) {
      dateRange = parsedQuery.yearRange;
    } else {
      const intersected: [number, number] = [
        Math.max(dateRange[0], parsedQuery.yearRange[0]),
        Math.min(dateRange[1], parsedQuery.yearRange[1]),
      ];
      dateRange =
        intersected[0] <= intersected[1]
          ? intersected
          : ([intersected[1], intersected[0]].sort(
              (left, right) => left - right,
            ) as [number, number]);
    }
  }

  return {
    types: merge(filters.types, parsedQuery.facetFieldTerms.type),
    places: filters.places,
    regions: merge(filters.regions, parsedQuery.facetFieldTerms.region),
    languages: merge(filters.languages, parsedQuery.facetFieldTerms.language),
    subjects: filters.subjects,
    institutions: merge(filters.institutions, parsedQuery.facetFieldTerms.holdingInstitution),
    dateRange,
  };
}

function buildTimeline(
  documents: ArchiveDocument[],
  range: [number, number],
  selectedRange: [number, number] | null,
): TimelineData {
  const [minYear, maxYear] = range;
  const bucketCount = 16;
  const span = Math.max(maxYear - minYear, 1);
  const bucketSize = Math.max(1, Math.ceil(span / bucketCount));

  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    start: minYear + index * bucketSize,
    end:
      index === bucketCount - 1
        ? maxYear
        : Math.min(maxYear, minYear + (index + 1) * bucketSize - 1),
    count: 0,
  }));

  documents.forEach((document) => {
    if (document.year === null) {
      return;
    }

    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((document.year - minYear) / bucketSize)),
    );
    buckets[bucketIndex].count += 1;
  });

  return {
    minYear,
    maxYear,
    selectedRange,
    buckets,
  };
}

interface RelationshipCorpusStats {
  totalDocuments: number;
  placeFrequencies: Map<string, number>;
  subjectFrequencies: Map<string, number>;
}

function buildRelationshipCorpusStats(documents: ArchiveDocument[]): RelationshipCorpusStats {
  const placeFrequencies = new Map<string, number>();
  const subjectFrequencies = new Map<string, number>();

  documents.forEach((document) => {
    placeFrequencies.set(document.place, (placeFrequencies.get(document.place) ?? 0) + 1);

    [...new Set(document.subjects)].forEach((subject) => {
      subjectFrequencies.set(subject, (subjectFrequencies.get(subject) ?? 0) + 1);
    });
  });

  return {
    totalDocuments: documents.length,
    placeFrequencies,
    subjectFrequencies,
  };
}

function buildRelationshipQueryTerms(parsedQuery: ParsedQuery) {
  return [...new Set(parsedQuery.highlightTerms.map((term) => normalizeText(term)).filter(Boolean))];
}

function isRelationshipQueryRelevant(value: string, queryTerms: string[]) {
  const normalized = normalizeText(value);
  return queryTerms.some(
    (term) => normalized.includes(term) || term.includes(normalized),
  );
}

function subjectPenalty(
  subjectFrequency: number,
  totalDocuments: number,
  queryRelevant: boolean,
) {
  if (queryRelevant) {
    return 1.16;
  }

  const ratio = subjectFrequency / Math.max(totalDocuments, 1);
  if (ratio >= 0.32) {
    return 0.26;
  }
  if (ratio >= 0.22) {
    return 0.48;
  }
  if (ratio >= 0.12) {
    return 0.74;
  }
  return 1;
}

function normalizeResultWeight(
  score: number,
  minScore: number,
  maxScore: number,
  rankIndex: number,
) {
  if (maxScore <= minScore) {
    return Math.max(0.5, 1 - rankIndex * 0.03);
  }

  return 0.4 + ((score - minScore) / (maxScore - minScore)) * 0.6;
}

function buildRelationshipGraph(
  results: SearchResultItem[],
  parsedQuery: ParsedQuery,
  corpusStats: RelationshipCorpusStats,
): RelationshipGraph {
  const slice = results.slice(0, 36);
  if (!slice.length) {
    return { leftNodes: [], rightNodes: [], edges: [] };
  }

  const queryTerms = buildRelationshipQueryTerms(parsedQuery);
  const scores = slice.map((result) => result.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const placeNodes = new Map<string, { count: number; weightedCount: number; score: number }>();
  const subjectNodes = new Map<string, { count: number; weightedCount: number; score: number }>();
  const edgeMap = new Map<
    string,
    { place: string; subject: string; sharedRecords: number; weightedCount: number; weight: number }
  >();

  slice.forEach((result, rankIndex) => {
    const { document } = result;
    const baseWeight = normalizeResultWeight(result.score, minScore, maxScore, rankIndex);
    const placeFrequency = corpusStats.placeFrequencies.get(document.place) ?? 1;
    const placeIdf = Math.log(1 + corpusStats.totalDocuments / placeFrequency);
    const placeRelevant = isRelationshipQueryRelevant(document.place, queryTerms);
    const placeBoost = placeRelevant ? 1.08 : 1;

    const currentPlace = placeNodes.get(document.place) ?? {
      count: 0,
      weightedCount: 0,
      score: 0,
    };

    currentPlace.count += 1;
    currentPlace.weightedCount += baseWeight;
    currentPlace.score += baseWeight * placeIdf * placeBoost;
    placeNodes.set(document.place, currentPlace);

    [...new Set(document.subjects)].forEach((subject) => {
      const subjectFrequency = corpusStats.subjectFrequencies.get(subject) ?? 1;
      const subjectIdf = Math.log(1 + corpusStats.totalDocuments / subjectFrequency);
      const subjectRelevant = isRelationshipQueryRelevant(subject, queryTerms);
      const subjectBoost = subjectPenalty(
        subjectFrequency,
        corpusStats.totalDocuments,
        subjectRelevant,
      );
      const weightedContribution = baseWeight * subjectBoost;

      const currentSubject = subjectNodes.get(subject) ?? {
        count: 0,
        weightedCount: 0,
        score: 0,
      };

      currentSubject.count += 1;
      currentSubject.weightedCount += weightedContribution;
      currentSubject.score += weightedContribution * subjectIdf;
      subjectNodes.set(subject, currentSubject);

      const edgeKey = `${document.place}:::${subject}`;
      const currentEdge = edgeMap.get(edgeKey) ?? {
        place: document.place,
        subject,
        sharedRecords: 0,
        weightedCount: 0,
        weight: 0,
      };

      currentEdge.sharedRecords += 1;
      currentEdge.weightedCount += baseWeight;
      currentEdge.weight +=
        (baseWeight * subjectBoost * placeBoost) /
        Math.sqrt(placeFrequency * subjectFrequency);
      edgeMap.set(edgeKey, currentEdge);
    });
  });

  const rankedLeftNodes = [...placeNodes.entries()]
    .sort(
      (left, right) =>
        right[1].score - left[1].score ||
        right[1].weightedCount - left[1].weightedCount ||
        right[1].count - left[1].count ||
        left[0].localeCompare(right[0]),
    )
    .slice(0, 7)
    .map(([label, node]) => ({
      id: `place:${label}`,
      label,
      side: "left" as const,
      category: "place" as const,
      count: node.count,
      weightedCount: Number(node.weightedCount.toFixed(3)),
      score: Number(node.score.toFixed(3)),
    }));

  const rankedRightNodes = [...subjectNodes.entries()]
    .sort(
      (left, right) =>
        right[1].score - left[1].score ||
        right[1].weightedCount - left[1].weightedCount ||
        right[1].count - left[1].count ||
        left[0].localeCompare(right[0]),
    )
    .slice(0, 7)
    .map(([label, node]) => ({
      id: `subject:${label}`,
      label,
      side: "right" as const,
      category: "subject" as const,
      count: node.count,
      weightedCount: Number(node.weightedCount.toFixed(3)),
      score: Number(node.score.toFixed(3)),
    }));

  const allowedPlaces = new Set(rankedLeftNodes.map((node) => node.label));
  const allowedSubjects = new Set(rankedRightNodes.map((node) => node.label));
  const rankedEdges = [...edgeMap.values()]
    .filter(
      (edge) => allowedPlaces.has(edge.place) && allowedSubjects.has(edge.subject),
    )
    .sort(
      (left, right) =>
        right.weight - left.weight ||
        right.weightedCount - left.weightedCount ||
        right.sharedRecords - left.sharedRecords,
    );

  const strongestWeight = rankedEdges[0]?.weight ?? 0;
  const edges = rankedEdges
    .filter(
      (edge, index) =>
        index < 5 || edge.weight >= strongestWeight * 0.22 || edge.sharedRecords >= 2,
    )
    .slice(0, 12)
    .map((edge) => ({
      id: `${edge.place}:::${edge.subject}`,
      source: `place:${edge.place}`,
      target: `subject:${edge.subject}`,
      weight: Number(edge.weight.toFixed(3)),
      sharedRecords: edge.sharedRecords,
      weightedCount: Number(edge.weightedCount.toFixed(3)),
    }));

  const connectedLeft = new Set(edges.map((edge) => edge.source));
  const connectedRight = new Set(edges.map((edge) => edge.target));

  return {
    leftNodes: rankedLeftNodes.filter((node) => connectedLeft.has(node.id)),
    rightNodes: rankedRightNodes.filter((node) => connectedRight.has(node.id)),
    edges,
  };
}

function sortResults(
  results: SearchResponse["results"],
  sort: SortOption,
  hasText: boolean,
) {
  const sorted = [...results];

  if (sort === "title") {
    sorted.sort((left, right) => left.document.title.localeCompare(right.document.title));
    return sorted;
  }

  if (sort === "newest") {
    sorted.sort(
      (left, right) =>
        (right.document.year ?? Number.NEGATIVE_INFINITY) -
          (left.document.year ?? Number.NEGATIVE_INFINITY) || right.score - left.score,
    );
    return sorted;
  }

  if (sort === "oldest") {
    sorted.sort(
      (left, right) =>
        (left.document.year ?? Number.POSITIVE_INFINITY) -
          (right.document.year ?? Number.POSITIVE_INFINITY) || right.score - left.score,
    );
    return sorted;
  }

  if (!hasText) {
    sorted.sort((left, right) => right.score - left.score || left.document.title.localeCompare(right.document.title));
  }

  return sorted;
}

function suggest(
  query: string,
  suggestions: ReturnType<typeof buildIndex>["suggestionCatalog"],
) {
  const normalized = normalizeText(query);
  if (normalized.length < 2) {
    return [];
  }

  const uniqueSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.normalized.startsWith(normalized) ||
        suggestion.normalized.includes(normalized),
    )
    .sort((left, right) => {
      const leftStarts = left.normalized.startsWith(normalized) ? 1 : 0;
      const rightStarts = right.normalized.startsWith(normalized) ? 1 : 0;

      if (leftStarts !== rightStarts) {
        return rightStarts - leftStarts;
      }

      if (left.weight !== right.weight) {
        return right.weight - left.weight;
      }

      return left.value.localeCompare(right.value);
    })
    .reduce<typeof suggestions>((accumulator, suggestion) => {
      if (
        accumulator.some(
          (candidate) => candidate.normalized === suggestion.normalized,
        )
      ) {
        return accumulator;
      }

      accumulator.push(suggestion);
      return accumulator;
    }, [])
    .slice(0, 6);

  return uniqueSuggestions.map((suggestion) => ({
      value: suggestion.value,
      label: suggestion.value,
      category: suggestion.category,
    }));
}

export interface SearchEngineInstance {
  index: ReturnType<typeof buildIndex>;
  search(params: {
    parsedQuery: ParsedQuery;
    filters: SearchFilters;
    sort: SortOption;
  }): SearchResponse;
  getDocumentById(id: string): ArchiveDocument | undefined;
  getRelatedRecords(id: string): ReturnType<typeof getRelatedRecords>;
}

export function createSearchEngine(documents: ArchiveDocument[]): SearchEngineInstance {
  const index = buildIndex(documents);
  const relationshipCorpusStats = buildRelationshipCorpusStats(documents);

  return {
    index,
    search({ parsedQuery, filters, sort }) {
      const effectiveFilters = mergeQueryFilters(parsedQuery, filters);
      const retrieval = retrieveCandidates(index, parsedQuery);
      const queryMatchedIds = new Set(retrieval.candidateIds);
      const filteredIds = retrieval.candidateIds.filter((docId) => {
        const document = index.documentsById.get(docId);
        return document ? matchesFilters(document, effectiveFilters) : false;
      });

      const ranked = rerankResults(index, parsedQuery, filteredIds, retrieval.evidence);
      const results = sortResults(ranked, sort, parsedQuery.hasText);
      const facetCounts = computeFacets(index.documents, queryMatchedIds, effectiveFilters);

      const timelineDocs = index.documents.filter(
        (document) =>
          queryMatchedIds.has(document.id) &&
          matchesFilters(document, { ...effectiveFilters, dateRange: null }),
      );

      const timeline = buildTimeline(
        timelineDocs,
        [index.minYear, index.maxYear],
        effectiveFilters.dateRange,
      );

      const relationshipGraph = buildRelationshipGraph(
        results,
        parsedQuery,
        relationshipCorpusStats,
      );

      return {
        results,
        total: results.length,
        filteredIds,
        queryMatchedIds: [...queryMatchedIds],
        facetCounts,
        timeline,
        relationshipGraph,
        suggestions: suggest(parsedQuery.raw, index.suggestionCatalog),
        filters: effectiveFilters,
      };
    },
    getDocumentById(id) {
      return index.documentsById.get(id);
    },
    getRelatedRecords(id) {
      const document = index.documentsById.get(id);
      return document ? getRelatedRecords(index.documents, document) : [];
    },
  };
}
