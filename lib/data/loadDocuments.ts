import dataset from "@/data/documents.json";
import { normalizeDocuments } from "./normalizeDocuments";

let cachedDocuments: ReturnType<typeof normalizeDocuments> | null = null;

export function loadDocuments() {
  if (!cachedDocuments) {
    cachedDocuments = normalizeDocuments(dataset.documents);
  }

  return cachedDocuments;
}
