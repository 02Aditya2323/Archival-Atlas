import { ArrowRight, Clock3, Network, Sparkles } from "lucide-react";

interface FeatureFramingProps {
  onEnterArchive: () => void;
  onExploreRelationships: () => void;
}

const FEATURE_ITEMS = [
  {
    icon: Sparkles,
    title: "Curator-ranked results",
    description:
      "Results privilege title evidence, phrases, archival descriptors, and metadata richness rather than flat keyword count.",
  },
  {
    icon: Clock3,
    title: "Temporal navigation",
    description:
      "The timeline remains query-aware, letting investigators brush entire eras without losing relevance context.",
  },
  {
    icon: Network,
    title: "Place-to-theme network",
    description:
      "Switch from ranked reading into a networked mode where place and subject relationships become a second route through the archive.",
  },
];

export function FeatureFraming({
  onEnterArchive,
  onExploreRelationships,
}: FeatureFramingProps) {
  return (
    <section className="px-4 pb-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1560px]">
        <div className="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,250,243,0.03),rgba(255,250,243,0.02))] px-6 py-7 md:px-8 md:py-9">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[#b59b68] uppercase">
                Why it feels intelligent
              </p>
              <h2 className="mt-2 font-display text-4xl text-[#f3ead8] md:text-5xl">
                A discovery system, not a document list.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onEnterArchive}
                className="focus-ring rounded-full bg-[#d5b06b] px-5 py-3 text-sm font-semibold text-[#120f0b]"
              >
                Enter the Archive
              </button>
              <button
                type="button"
                onClick={onExploreRelationships}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-[#f4ebda]"
              >
                Explore relationship mode
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {FEATURE_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.7rem] border border-white/8 bg-[rgba(255,250,243,0.04)] p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(213,176,107,0.18)] bg-[rgba(213,176,107,0.08)] text-[#d5b06b]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl text-[#f7efdf]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#cabca2]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
