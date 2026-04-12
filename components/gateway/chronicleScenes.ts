import type { StaticImageData } from "next/image";
import tradeMap from "@/assets/Gemini_Generated_Image_q8ds5dq8ds5dq8ds.png";
import recordedKnowledge from "@/assets/Gemini_Generated_Image_usa24lusa24lusa2.png";
import archiveAccess from "@/assets/large-collection-old-books-wooden-shelves-generated-by-ai.jpg";
import diagramOverlay from "@/assets/Gemini_Generated_Image_rzi3imrzi3imrzi3.png";

export interface ChronicleSceneConfig {
  id: "trade" | "knowledge" | "archive";
  eyebrow: string;
  title: string;
  description: string;
  image: StaticImageData;
  overlayImage?: StaticImageData;
  overlayLabel?: string;
  accentTone: "gold" | "sage" | "ivory";
}

export const CHRONICLE_SCENES: ChronicleSceneConfig[] = [
  {
    id: "trade",
    eyebrow: "Trade and Geography",
    title: "Routes connected civilizations.",
    description:
      "Maps, coastlines, and trade corridors carried goods, ideas, and memory across distance.",
    image: tradeMap,
    overlayLabel: "Maritime corridors",
    accentTone: "gold",
  },
  {
    id: "knowledge",
    eyebrow: "Recorded Knowledge",
    title: "Knowledge was written, translated, and preserved.",
    description:
      "Manuscripts, diagrams, and treatises transformed memory into enduring record.",
    image: recordedKnowledge,
    overlayImage: diagramOverlay,
    overlayLabel: "Scholarly transmission",
    accentTone: "sage",
  },
  {
    id: "archive",
    eyebrow: "Curated Access",
    title: "Now it can be searched.",
    description:
      "Step into the archive and explore records through metadata, chronology, and connection.",
    image: archiveAccess,
    overlayLabel: "Reading room access",
    accentTone: "ivory",
  },
];
