"use client";

import { useMemo, useRef, useState } from "react";
import mapAsset from "@/assets/Gemini_Generated_Image_q8ds5dq8ds5dq8ds.png";
import manuscriptAsset from "@/assets/Gemini_Generated_Image_usa24lusa24lusa2.png";
import diagramAsset from "@/assets/Gemini_Generated_Image_rzi3imrzi3imrzi3.png";
import letterAsset from "@/assets/close-up-old-paper-map.jpg";
import journalAsset from "@/assets/old-compass-ancient-map.jpg";
import archiveAsset from "@/assets/large-collection-old-books-wooden-shelves-generated-by-ai.jpg";
import { DiscoveryApp, type DiscoveryGatewayCommand } from "@/components/DiscoveryApp";
import { AuthorityStrip } from "@/components/gateway/AuthorityStrip";
import { ChronicleExpansion } from "@/components/gateway/ChronicleExpansion";
import {
  CollectionPreview,
  type CollectionPreviewItem,
} from "@/components/gateway/CollectionPreview";
import { FeatureFraming } from "@/components/gateway/FeatureFraming";
import { GatewayHero } from "@/components/gateway/GatewayHero";
import type { ArchiveDocument, ExplorerMode } from "@/lib/search/types";
import { formatNumber } from "@/lib/utils/formatters";

interface HomeExperienceProps {
  documents: ArchiveDocument[];
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

function yearSpan(documents: ArchiveDocument[]) {
  const years = documents.map((document) => document.year).filter((year): year is number => year !== null);
  if (!years.length) {
    return 0;
  }

  return Math.max(...years) - Math.min(...years);
}

function pickFeaturedDocuments(documents: ArchiveDocument[]) {
  const desiredTypes = ["map", "manuscript", "diagram", "letter", "journal", "photograph"];
  const assets = [mapAsset, manuscriptAsset, diagramAsset, letterAsset, journalAsset, archiveAsset];

  return desiredTypes
    .map((type, index) => {
      const document = documents.find((candidate) => candidate.type.toLowerCase() === type);
      if (!document) {
        return null;
      }

      return {
        key: `${type}-${document.id}`,
        document,
        image: assets[index],
        label:
          type === "map"
            ? "Routes"
            : type === "manuscript"
              ? "Preservation"
              : type === "diagram"
                ? "Scientific figure"
                : type === "letter"
                  ? "Correspondence"
                  : type === "journal"
                    ? "Daily record"
                    : "Visual archive",
      } satisfies CollectionPreviewItem;
    })
    .filter((item): item is CollectionPreviewItem => item !== null);
}

export function HomeExperience({ documents }: HomeExperienceProps) {
  const archiveRef = useRef<HTMLDivElement | null>(null);
  const [gatewayCommand, setGatewayCommand] = useState<DiscoveryGatewayCommand | null>(null);

  const stats = useMemo(() => {
    const span = yearSpan(documents);
    return [
      {
        label: "History represented",
        value: `${formatNumber(Math.max(1000, Math.floor(span / 100) * 100))}+ years`,
        note: "From ancient inscriptions to modern institutional records.",
      },
      {
        label: "Active records",
        value: formatNumber(documents.length),
        note: "Live archival entries already indexed inside the search workspace.",
      },
      {
        label: "Document forms",
        value: formatNumber(uniqueCount(documents.map((document) => document.type))),
        note: "Maps, journals, letters, plans, photographs, and more.",
      },
      {
        label: "Languages",
        value: formatNumber(uniqueCount(documents.map((document) => document.language))),
        note: "A multilingual archive surfaced through one coherent discovery interface.",
      },
    ];
  }, [documents]);

  const collectionItems = useMemo(() => pickFeaturedDocuments(documents), [documents]);

  const launchArchive = (
    query: string,
    explorerMode: ExplorerMode = "results",
    focusTarget: DiscoveryGatewayCommand["focusTarget"] = "workspace",
  ) => {
    setGatewayCommand({
      nonce: Date.now(),
      query,
      explorerMode,
      focusTarget,
    });

    requestAnimationFrame(() => {
      archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main className="relative">
      <div className="gateway-shell relative pb-10">
        <GatewayHero
          activeRecords={documents.length}
          totalDocuments={documents.length}
          onEnterArchive={(query) => launchArchive(query, "results", "workspace")}
          onExploreRelationships={(query) => launchArchive(query, "relationships", "relationships")}
          onBrowseByEra={(query) => launchArchive(query, "results", "timeline")}
        />

        <div className="mt-6 space-y-8 md:space-y-10">
          <AuthorityStrip stats={stats} />
          <ChronicleExpansion onEnterArchive={() => launchArchive("", "results", "workspace")} />
          <CollectionPreview
            items={collectionItems}
            onOpenRecord={(query) => launchArchive(query, "results", "workspace")}
          />
          <FeatureFraming
            onEnterArchive={() => launchArchive("", "results", "workspace")}
            onExploreRelationships={() => launchArchive("", "relationships", "relationships")}
          />
        </div>

        <section className="px-4 pt-4 md:px-6 lg:px-8">
          <div className="portal-transition mx-auto max-w-[1560px] overflow-hidden rounded-t-[2.8rem] px-6 md:px-10">
            <div className="portal-transition__glow" />
            <div className="portal-transition__fog" />
            <div className="portal-transition__grain" />

            <div className="portal-caption relative z-10 mx-auto max-w-3xl py-18 text-center md:py-24">
              <p className="text-xs font-semibold tracking-[0.28em] text-[#b69663] uppercase">
                Reading room transfer
              </p>
              <h2 className="mt-4 font-display text-4xl text-[#f3e7d1] md:text-6xl">
                Cross the threshold into the reading room.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#8c7353] md:text-[1.02rem] md:leading-8">
                Dark atmosphere falls away. Warm light, chronology, and metadata rise into focus.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div ref={archiveRef} id="archive-workspace" className="portal-emergence relative z-10 -mt-18 pt-4 md:-mt-22 md:pt-6">
        <div className="portal-emergence__grain" />
        <DiscoveryApp documents={documents} gatewayCommand={gatewayCommand} />
      </div>
    </main>
  );
}
