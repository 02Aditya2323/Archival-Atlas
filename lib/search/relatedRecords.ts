import type { ArchiveDocument, RelatedRecord } from "./types";

function overlapScore(left: string[], right: string[], weight: number) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).length * weight;
}

export function getRelatedRecords(
  documents: ArchiveDocument[],
  current: ArchiveDocument,
  limit = 6,
) {
  const related = documents
    .filter((document) => document.id !== current.id)
    .map<RelatedRecord>((document) => {
      const reasons: string[] = [];
      let score = 0;

      const subjectScore = overlapScore(current.subjects, document.subjects, 3);
      if (subjectScore) {
        score += subjectScore;
        reasons.push("Overlapping subjects");
      }

      const tagScore = overlapScore(current.tags, document.tags, 2.2);
      if (tagScore) {
        score += tagScore;
        reasons.push("Shared thematic tags");
      }

      if (current.place === document.place) {
        score += 2.5;
        reasons.push("Same place");
      }

      if (current.region === document.region) {
        score += 1.4;
        reasons.push("Same region");
      }

      if (current.collection === document.collection) {
        score += 1.8;
        reasons.push("Same collection");
      }

      if (current.type === document.type) {
        score += 1.2;
        reasons.push("Same document type");
      }

      if (
        current.author !== "Unknown" &&
        document.author !== "Unknown" &&
        current.author === document.author
      ) {
        score += 1;
        reasons.push("Same author");
      }

      if (current.year !== null && document.year !== null) {
        const distance = Math.abs(current.year - document.year);
        if (distance <= 5) {
          score += 1;
          reasons.push("Nearby in time");
        } else if (distance <= 15) {
          score += 0.4;
        }
      }

      return {
        document,
        score,
        reasons,
      };
    })
    .filter((record) => record.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return related;
}
