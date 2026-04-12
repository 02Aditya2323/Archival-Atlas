"use client";

import { ArrowDown, ArrowRight, Network, Search } from "lucide-react";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import heroBackdrop from "@/assets/old-compass-ancient-map.jpg";

interface GatewayHeroProps {
  activeRecords: number;
  totalDocuments: number;
  onEnterArchive: (query: string) => void;
  onExploreRelationships: (query: string) => void;
  onBrowseByEra: (query: string) => void;
}

function submitOnEnter(
  event: KeyboardEvent<HTMLInputElement>,
  callback: () => void,
) {
  if (event.key === "Enter") {
    event.preventDefault();
    callback();
  }
}

export function GatewayHero({
  activeRecords,
  totalDocuments,
  onEnterArchive,
  onExploreRelationships,
  onBrowseByEra,
}: GatewayHeroProps) {
  const [query, setQuery] = useState("");

  return (
    <section className="relative overflow-hidden px-4 pt-4 md:px-6 lg:px-8">
      <div className="gateway-panel gateway-hero relative mx-auto min-h-[84svh] max-w-[1560px] overflow-hidden rounded-[2.5rem] border border-white/10 px-6 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12">
        <Image
          src={heroBackdrop}
          alt="Antique cartographic instrument resting on a historical map"
          fill
          priority
          className="object-cover object-center opacity-26"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(232,195,112,0.22),transparent_24%),linear-gradient(180deg,rgba(9,8,7,0.4),rgba(9,8,7,0.88)_36%,rgba(14,11,9,0.96)_100%)]" />
        <div className="gateway-grid absolute inset-0 opacity-40" />

        <div className="relative flex min-h-[calc(84svh-3rem)] flex-col justify-between gap-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-[#cbb489] uppercase">
                Intelligent Archival Discovery
              </p>
              <p className="mt-3 font-display text-2xl text-[#f7efdf] md:text-[2.5rem]">
                The Digital Curator
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#e1d5bf] uppercase">
              <span className="rounded-full border border-white/12 bg-white/6 px-3 py-2 backdrop-blur">
                {activeRecords} active records
              </span>
              <span className="rounded-full border border-white/12 bg-white/6 px-3 py-2 backdrop-blur">
                {totalDocuments} total documents
              </span>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-sm font-medium tracking-[0.22em] text-[#b49a6b] uppercase">
                Search Historical Records like a Curator
              </p>
              <h1 className="mt-4 max-w-4xl font-display text-[clamp(3rem,7vw,5.95rem)] leading-[0.93] text-[#f6eedf]">
                Search Historical Records like a Curator
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#d5c7ad] md:text-lg">
                Query four millennia of manuscripts, maps, diagrams, and letters ranked by
                archival intelligence, not keyword frequency.
              </p>

              <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-[rgba(247,239,223,0.08)] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] border border-white/8 bg-[rgba(255,252,244,0.06)] px-4 py-3">
                    <Search className="h-5 w-5 text-[#dbc69b]" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => submitOnEnter(event, () => onEnterArchive(query))}
                      placeholder='Begin with "persian gulf", "trade", or a place'
                      className="min-w-0 flex-1 bg-transparent text-base text-[#f9f1e2] placeholder:text-[#b8aa8e] focus:outline-none"
                      aria-label="Archive gateway search"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterArchive(query)}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[#d5b06b] px-5 py-3 text-sm font-semibold text-[#120f0b] transition-transform hover:-translate-y-0.5"
                  >
                    Enter the Archive
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onExploreRelationships(query)}
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-3 text-sm font-semibold text-[#f3ead8] transition-colors hover:bg-white/10"
                >
                  <Network className="h-4 w-4" />
                  Explore Relationships
                </button>
                <button
                  type="button"
                  onClick={() => onBrowseByEra(query)}
                  className="focus-ring rounded-full border border-white/12 bg-white/6 px-4 py-3 text-sm font-semibold text-[#d7c7a8] transition-colors hover:bg-white/10"
                >
                  Browse by Era
                </button>
              </div>
            </div>

            <div className="hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,244,222,0.08),rgba(255,244,222,0.02))] p-6 text-[#e4d5bb] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] lg:block">
              <p className="text-xs font-semibold tracking-[0.22em] text-[#b89c67] uppercase">
                Curatorial scope
              </p>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="font-display text-4xl text-[#fbf3e2]">4,000+</p>
                  <p className="mt-2 text-sm leading-6 text-[#cabba0]">
                    Years represented across maps, manuscripts, trade correspondence, and
                    visual records.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[1.3rem] border border-white/10 bg-black/15 p-4">
                    <p className="text-xs tracking-[0.18em] text-[#b89c67] uppercase">Modes</p>
                    <p className="mt-2 font-display text-2xl text-[#fbf3e2]">Search</p>
                    <p className="text-[#c5b89f]">timeline + network</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-black/15 p-4">
                    <p className="text-xs tracking-[0.18em] text-[#b89c67] uppercase">Signal</p>
                    <p className="mt-2 font-display text-2xl text-[#fbf3e2]">Field-aware</p>
                    <p className="text-[#c5b89f]">ranking and facets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#bba98a]">
            <ArrowDown className="h-4 w-4" />
            Scroll to move from route, to record, to archive.
          </div>
        </div>
      </div>
    </section>
  );
}
