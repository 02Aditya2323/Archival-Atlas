import { normalizeText } from "@/lib/search/normalizeText";
import type { ArchiveDocument, RawArchiveDocument, SearchField } from "@/lib/search/types";

const SEARCHABLE_FIELD_BUILDERS: Record<
  SearchField,
  (document: Omit<ArchiveDocument, "searchable">) => string
> = {
  title: (document) => document.title,
  description: (document) => document.description,
  subjects: (document) => document.subjects.join(" "),
  tags: (document) => document.tags.join(" "),
  keywords: (document) => document.keywords.join(" "),
  place: (document) => document.place,
  author: (document) => document.author,
  collection: (document) => document.collection,
};

function cleanValue(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function cleanArray(values: string[] | null | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function parseYear(date: string | null) {
  if (!date) {
    return null;
  }

  const match = date.match(/^-?\d{1,4}/);
  if (!match) {
    return null;
  }

  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
}

export function normalizeDocuments(documents: RawArchiveDocument[]) {
  return documents.map((document) => {
    const normalizedBase: Omit<ArchiveDocument, "searchable"> = {
      id: String(document.id),
      sourceId: document.id,
      title: cleanValue(document.title, "Untitled record"),
      description: cleanValue(document.description, "No description available."),
      type: cleanValue(document.type, "Unknown type"),
      date: document.date?.trim() ? document.date.trim() : null,
      year: parseYear(document.date?.trim() ?? null),
      place: cleanValue(document.place, "Unknown place"),
      region: cleanValue(document.region, "Unknown region"),
      subjects: cleanArray(document.subjects),
      language: cleanValue(document.language, "Unknown"),
      holdingInstitution: cleanValue(
        document.holdingInstitution,
        "Unknown institution",
      ),
      author: cleanValue(document.author, "Unknown"),
      format: cleanValue(document.format, "Unknown format"),
      collection: cleanValue(document.collection, "Unclassified collection"),
      tags: cleanArray(document.tags),
      keywords: cleanArray(document.keywords),
      completeness: 0,
    };

    const completenessFields = [
      normalizedBase.title,
      normalizedBase.description,
      normalizedBase.type,
      normalizedBase.date,
      normalizedBase.place,
      normalizedBase.region,
      normalizedBase.subjects.length ? "yes" : "",
      normalizedBase.language,
      normalizedBase.holdingInstitution,
      normalizedBase.author === "Unknown" ? "" : normalizedBase.author,
      normalizedBase.format,
      normalizedBase.collection,
      normalizedBase.tags.length ? "yes" : "",
      normalizedBase.keywords.length ? "yes" : "",
    ];

    const completeness =
      completenessFields.filter(Boolean).length / completenessFields.length;

    const searchable = Object.fromEntries(
      Object.entries(SEARCHABLE_FIELD_BUILDERS).map(([field, builder]) => [
        field,
        normalizeText(builder(normalizedBase)),
      ]),
    ) as Record<SearchField, string>;

    return {
      ...normalizedBase,
      completeness,
      searchable,
    };
  });
}
