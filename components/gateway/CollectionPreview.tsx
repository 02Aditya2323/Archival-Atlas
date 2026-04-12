import type { StaticImageData } from "next/image";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import type { ArchiveDocument } from "@/lib/search/types";
import { formatDateLabel } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/classNames";

export interface CollectionPreviewItem {
  key: string;
  document: ArchiveDocument;
  image: StaticImageData;
  label: string;
}

interface CollectionPreviewProps {
  items: CollectionPreviewItem[];
  onOpenRecord: (query: string) => void;
}

const GRID_CLASSES = [
  "md:col-span-6 lg:col-span-5 lg:row-span-2",
  "md:col-span-6 lg:col-span-4",
  "md:col-span-6 lg:col-span-3",
  "md:col-span-6 lg:col-span-4",
  "md:col-span-6 lg:col-span-3",
  "md:col-span-12 lg:col-span-5",
];

export function CollectionPreview({ items, onOpenRecord }: CollectionPreviewProps) {
  return (
    <section className="px-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1560px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#b59b68] uppercase">
              Curated collection preview
            </p>
            <h2 className="mt-2 font-display text-4xl text-[#f3ead8] md:text-5xl">
              Object types prepared for investigation.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#c9baa1]">
            A quick survey of the archive before the full search workspace begins.
          </p>
        </div>

        <div className="mt-8 grid auto-rows-[220px] gap-4 lg:grid-cols-12">
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onOpenRecord(item.document.title)}
              className={cn(
                "group relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[rgba(255,250,242,0.04)] text-left transition-transform hover:-translate-y-1",
                GRID_CLASSES[index] ?? "md:col-span-6 lg:col-span-4",
              )}
            >
              <Image
                src={item.image}
                alt={item.document.title}
                fill
                className="object-cover opacity-64 transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,6,0.2),rgba(10,8,6,0.68)_54%,rgba(10,8,6,0.92))]" />
              <div className="relative flex h-full flex-col justify-between p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent" className="border-white/10 bg-[rgba(213,176,107,0.16)] text-[#e7c98a]">
                    {item.document.type}
                  </Badge>
                  <Badge className="border-white/10 bg-[rgba(255,255,255,0.08)] text-[#f1e7d3]">
                    {item.label}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-[#b59b68] uppercase">
                    {formatDateLabel(item.document.date)}
                  </p>
                  <h3 className="mt-3 max-w-md font-display text-2xl leading-tight text-[#f8efdf]">
                    {item.document.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-[#d9ccb4]">
                    {item.document.holdingInstitution} · {item.document.collection}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#e7c98a]">
                    Open in archive
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
