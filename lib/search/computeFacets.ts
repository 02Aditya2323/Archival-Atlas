import { normalizeText } from "./normalizeText";
import type { ArchiveDocument, FacetCounts, SearchFilters } from "./types";

function countValues(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function matchesValueFilter(values: string[], targets: string[]) {
  if (!targets.length) {
    return true;
  }

  const normalizedValues = values.map((value) => normalizeText(value));
  return targets.some((target) => normalizedValues.includes(normalizeText(target)));
}

export function matchesFilters(document: ArchiveDocument, filters: SearchFilters) {
  if (!matchesValueFilter([document.type], filters.types)) {
    return false;
  }
  if (!matchesValueFilter([document.place], filters.places)) {
    return false;
  }
  if (!matchesValueFilter([document.region], filters.regions)) {
    return false;
  }
  if (!matchesValueFilter([document.language], filters.languages)) {
    return false;
  }
  if (!matchesValueFilter(document.subjects, filters.subjects)) {
    return false;
  }
  if (!matchesValueFilter([document.holdingInstitution], filters.institutions)) {
    return false;
  }
  if (filters.dateRange) {
    if (document.year === null) {
      return false;
    }
    const [start, end] = filters.dateRange;
    if (document.year < start || document.year > end) {
      return false;
    }
  }
  return true;
}

function withFilterOmitted(filters: SearchFilters, key: keyof SearchFilters): SearchFilters {
  return {
    ...filters,
    [key]: key === "dateRange" ? null : [],
  };
}

export function computeFacets(
  documents: ArchiveDocument[],
  queryMatchedIds: Set<string>,
  filters: SearchFilters,
): FacetCounts {
  const queryMatchedDocs = documents.filter((document) => queryMatchedIds.has(document.id));

  const scoped = (key: keyof SearchFilters) =>
    queryMatchedDocs.filter((document) =>
      matchesFilters(document, withFilterOmitted(filters, key)),
    );

  return {
    types: countValues(scoped("types").map((document) => document.type)),
    places: countValues(scoped("places").map((document) => document.place)),
    regions: countValues(scoped("regions").map((document) => document.region)),
    languages: countValues(scoped("languages").map((document) => document.language)),
    subjects: countValues(scoped("subjects").flatMap((document) => document.subjects)),
    institutions: countValues(
      scoped("institutions").map((document) => document.holdingInstitution),
    ),
  };
}
