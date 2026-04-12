import type { SearchField } from "@/lib/search/types";

const FIELD_LABELS: Record<SearchField, string> = {
  title: "Title",
  description: "Description",
  subjects: "Subjects",
  tags: "Tags",
  keywords: "Keywords",
  place: "Place",
  author: "Author",
  collection: "Collection",
};

interface MatchedFieldsProps {
  fields: SearchField[];
}

export function MatchedFields({ fields }: MatchedFieldsProps) {
  if (!fields.length) {
    return (
      <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
        Discovery ranking
      </p>
    );
  }

  return (
    <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
      Matched in {fields.map((field) => FIELD_LABELS[field]).join(", ")}
    </p>
  );
}
