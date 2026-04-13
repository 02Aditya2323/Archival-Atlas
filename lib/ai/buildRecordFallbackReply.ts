import type { RecordChatContext } from "@/lib/ai/types";

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function joinList(values: string[], limit = 4) {
  if (!values.length) {
    return "not specified";
  }

  return values.slice(0, limit).join(", ");
}

function describeRecord(context: RecordChatContext) {
  const { document } = context;
  const dateLabel = document.date ?? "an undated record";
  return `${document.title} is a ${document.type} from ${dateLabel} associated with ${document.place} in ${document.region}. ${document.description}`;
}

export function buildRecordFallbackReply(
  latestUserMessage: string,
  context: RecordChatContext,
) {
  const question = latestUserMessage.trim().toLowerCase();
  const { document, result, relatedRecords, currentSearchQuery } = context;

  const responseParts: string[] = [
    "Live Gemini responses are temporarily unavailable for this API key, so this answer is grounded only in the record metadata currently loaded in the drawer.",
  ];

  if (question.includes("summarize") || question.includes("summary")) {
    responseParts.push(
      describeRecord(context),
      `The strongest themes in the metadata are ${joinList(document.subjects)}. Supporting descriptors include ${joinList(document.tags)} and ${joinList(document.keywords)}.`,
    );
    return responseParts.join("\n\n");
  }

  if (question.includes("important") || question.includes("matter") || question.includes("significant")) {
    responseParts.push(
      describeRecord(context),
      `It looks important in this archive because it connects ${document.place}, ${document.collection}, and themes such as ${joinList(document.subjects)}. Those fields make it useful as evidence for larger research threads rather than as an isolated object.`,
    );
    return responseParts.join("\n\n");
  }

  if (question.includes("why did this match") || question.includes("why match") || question.includes("matched")) {
    const matchReasons = result?.whyMatched.length
      ? result.whyMatched.join(", ")
      : "the overlap between the query and the record metadata";
    const matchedFields = result?.matchedFields.length
      ? result.matchedFields.join(", ")
      : "title and descriptive metadata";

    responseParts.push(
      `This record matched because of ${matchReasons}. The active evidence is strongest in ${matchedFields}.`,
      currentSearchQuery
        ? `Against the query "${currentSearchQuery}", the archive is seeing alignment with metadata such as ${joinList(document.subjects)} and ${joinList(document.tags)}.`
        : `The metadata alignment comes from fields such as ${joinList(document.subjects)} and ${joinList(document.tags)}.`,
    );
    return responseParts.join("\n\n");
  }

  if (
    question.includes("what should i inspect next") ||
    question.includes("inspect next") ||
    question.includes("next") ||
    question.includes("look at next")
  ) {
    const nextSteps = [
      `Compare the title, place, and collection against nearby records in ${document.collection}.`,
      document.author !== "Unknown" ? `Check how ${document.author} appears elsewhere in the archive.` : null,
      relatedRecords.length
        ? `Then inspect related records such as ${relatedRecords
            .slice(0, 3)
            .map((record) => record.document.title)
            .join(", ")}.`
        : null,
    ].filter(Boolean);

    responseParts.push(
      describeRecord(context),
      nextSteps.join(" "),
    );
    return responseParts.join("\n\n");
  }

  if (question.includes("simple") || question.includes("plain") || question.includes("easier")) {
    responseParts.push(
      `${document.title} is basically ${document.type === "unknown" ? "a historical record" : `a historical ${document.type}`} about ${joinList(document.subjects, 3)}.`,
      `In plain terms, it deals with ${document.description.toLowerCase()}`,
    );
    return responseParts.join("\n\n");
  }

  responseParts.push(
    describeRecord(context),
    `Key metadata to use in your interpretation: subjects ${joinList(document.subjects)}, tags ${joinList(document.tags)}, keywords ${joinList(document.keywords)}, institution ${document.holdingInstitution}, and collection ${document.collection}.`,
  );

  if (result?.whyMatched.length) {
    responseParts.push(`For this search session, the system flagged it because ${sentenceCase(result.whyMatched.join(", "))}.`);
  }

  if (relatedRecords.length) {
    responseParts.push(
      `If you want to deepen the thread, compare it with ${relatedRecords
        .slice(0, 3)
        .map((record) => record.document.title)
        .join(", ")}.`,
    );
  }

  return responseParts.join("\n\n");
}
