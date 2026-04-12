import { buildIndex } from "./buildIndex";
import { computeFacets, matchesFilters } from "./computeFacets";
import { retrieveCandidates } from "./retrieveCandidates";
import { rerankResults } from "./rerankResults";
import { getRelatedRecords } from "./relatedRecords";
import type {
  ArchiveDocument,
  ParsedQuery,
  RelationshipGraph,
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

function buildRelationshipGraph(documents: ArchiveDocument[]): RelationshipGraph {
  const placeCounts = new Map<string, number>();
  const subjectCounts = new Map<string, number>();
  const edgeCounts = new Map<string, number>();

  documents.forEach((document) => {
    placeCounts.set(document.place, (placeCounts.get(document.place) ?? 0) + 1);
    document.subjects.forEach((subject) => {
      subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1);
      const edgeKey = `${document.place}:::${subject}`;
      edgeCounts.set(edgeKey, (edgeCounts.get(edgeKey) ?? 0) + 1);
    });
  });

  const leftNodes = [...placeCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 7)
    .map(([label, count]) => ({
      id: `place:${label}`,
      label,
      side: "left" as const,
      category: "place" as const,
      count,
    }));

  const rightNodes = [...subjectCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 7)
    .map(([label, count]) => ({
      id: `subject:${label}`,
      label,
      side: "right" as const,
      category: "subject" as const,
      count,
    }));

  const allowedPlaces = new Set(leftNodes.map((node) => node.label));
  const allowedSubjects = new Set(rightNodes.map((node) => node.label));

  const edges = [...edgeCounts.entries()]
    .map(([key, weight]) => {
      const [place, subject] = key.split(":::");
      return {
        id: key,
        source: `place:${place}`,
        target: `subject:${subject}`,
        weight,
      };
    })
    .filter(
      (edge) =>
        allowedPlaces.has(edge.source.replace("place:", "")) &&
        allowedSubjects.has(edge.target.replace("subject:", "")),
    )
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 16);

  return {
    leftNodes,
    rightNodes,
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

  return suggestions
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
    .slice(0, 6)
    .map((suggestion) => ({
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
        results.slice(0, 36).map((result) => result.document),
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
