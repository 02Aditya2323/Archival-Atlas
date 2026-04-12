export const SEARCHABLE_FIELDS = [
  "title",
  "description",
  "subjects",
  "tags",
  "keywords",
  "place",
  "author",
  "collection",
] as const;

export const FIELD_WEIGHTS: Record<SearchField, number> = {
  title: 5,
  subjects: 4,
  tags: 3.5,
  keywords: 3,
  description: 2.2,
  place: 2,
  author: 1.7,
  collection: 1.5,
};

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A-Z" },
] as const;

export const VIEW_MODES = ["list", "grid"] as const;
export const EXPLORER_MODES = ["results", "relationships"] as const;

export type SearchField = (typeof SEARCHABLE_FIELDS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export type ViewMode = (typeof VIEW_MODES)[number];
export type ExplorerMode = (typeof EXPLORER_MODES)[number];
export type MatchKind = "exact" | "prefix" | "fuzzy" | "phrase";

export interface RawArchiveDocument {
  id: number | string;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  date?: string | null;
  place?: string | null;
  region?: string | null;
  subjects?: string[] | null;
  language?: string | null;
  holdingInstitution?: string | null;
  author?: string | null;
  format?: string | null;
  collection?: string | null;
  tags?: string[] | null;
  keywords?: string[] | null;
}

export interface ArchiveDocument {
  id: string;
  sourceId: number | string;
  title: string;
  description: string;
  type: string;
  date: string | null;
  year: number | null;
  place: string;
  region: string;
  subjects: string[];
  language: string;
  holdingInstitution: string;
  author: string;
  format: string;
  collection: string;
  tags: string[];
  keywords: string[];
  completeness: number;
  searchable: Record<SearchField, string>;
}

export interface SearchFilters {
  types: string[];
  places: string[];
  regions: string[];
  languages: string[];
  subjects: string[];
  institutions: string[];
  dateRange: [number, number] | null;
}

export const EMPTY_FILTERS: SearchFilters = {
  types: [],
  places: [],
  regions: [],
  languages: [],
  subjects: [],
  institutions: [],
  dateRange: null,
};

export interface ParsedQuery {
  raw: string;
  normalized: string;
  freeTerms: string[];
  phrases: string[];
  searchableFieldTerms: Partial<Record<SearchField, string[]>>;
  facetFieldTerms: Partial<
    Record<"type" | "region" | "language" | "holdingInstitution", string[]>
  >;
  years: number[];
  yearRange: [number, number] | null;
  mode: "AND" | "OR";
  highlightTerms: string[];
  hasText: boolean;
  advanced: boolean;
}

export interface SearchIndex {
  documents: ArchiveDocument[];
  documentsById: Map<string, ArchiveDocument>;
  invertedIndex: Record<SearchField, Map<string, Map<string, number>>>;
  docFrequencies: Record<SearchField, Map<string, number>>;
  docLengths: Record<SearchField, Map<string, number>>;
  averageFieldLengths: Record<SearchField, number>;
  tokenSet: Set<string>;
  lexicon: string[];
  prefixIndex: Map<string, Set<string>>;
  globalDocFrequencies: Map<string, number>;
  minYear: number;
  maxYear: number;
  suggestionCatalog: SuggestionSeed[];
}

export interface FacetValueCount {
  value: string;
  count: number;
}

export interface FacetCounts {
  types: FacetValueCount[];
  places: FacetValueCount[];
  regions: FacetValueCount[];
  languages: FacetValueCount[];
  subjects: FacetValueCount[];
  institutions: FacetValueCount[];
}

export interface HighlightChunk {
  text: string;
  match: boolean;
}

export interface SearchResultItem {
  document: ArchiveDocument;
  score: number;
  snippet: string;
  matchedFields: SearchField[];
  matchedTermsByField: Partial<Record<SearchField, string[]>>;
  matchKinds: MatchKind[];
  whyMatched: string[];
}

export interface TimelineBucket {
  start: number;
  end: number;
  count: number;
}

export interface TimelineData {
  minYear: number;
  maxYear: number;
  selectedRange: [number, number] | null;
  buckets: TimelineBucket[];
}

export interface SuggestionSeed {
  value: string;
  normalized: string;
  category:
    | "title"
    | "place"
    | "subject"
    | "tag"
    | "keyword"
    | "author"
    | "collection";
  weight: number;
}

export interface Suggestion {
  value: string;
  label: string;
  category: SuggestionSeed["category"];
}

export interface RelationshipNode {
  id: string;
  label: string;
  side: "left" | "right";
  category: "place" | "subject";
  count: number;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface RelationshipGraph {
  leftNodes: RelationshipNode[];
  rightNodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  filteredIds: string[];
  queryMatchedIds: string[];
  facetCounts: FacetCounts;
  timeline: TimelineData;
  relationshipGraph: RelationshipGraph;
  suggestions: Suggestion[];
  filters: SearchFilters;
}

export interface RelatedRecord {
  document: ArchiveDocument;
  score: number;
  reasons: string[];
}
