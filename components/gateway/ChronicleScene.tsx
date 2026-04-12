import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/classNames";
import type { ChronicleSceneConfig } from "./chronicleScenes";

interface ChronicleSceneProps {
  scene: ChronicleSceneConfig;
  className?: string;
  showCta?: boolean;
  onEnterArchive?: () => void;
}

export function ChronicleScene({
  scene,
  className,
  showCta = false,
  onEnterArchive,
}: ChronicleSceneProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden rounded-[2rem]", className)}>
      <Image
        src={scene.image}
        alt={scene.title}
        fill
        className={cn(
          "object-cover",
          scene.id === "trade"
            ? "object-center"
            : scene.id === "knowledge"
              ? "object-center"
              : "object-[center_38%]",
        )}
        sizes="(max-width: 1024px) 100vw, 1200px"
      />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(8,6,5,0.88),rgba(8,6,5,0.46)_46%,rgba(8,6,5,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(213,176,107,0.16),transparent_22%),radial-gradient(circle_at_80%_80%,rgba(47,111,104,0.14),transparent_24%)]" />

      {scene.id === "trade" ? (
        <svg
          className="absolute inset-y-[16%] right-[9%] hidden h-[68%] w-[40%] opacity-70 lg:block"
          viewBox="0 0 320 420"
          aria-hidden="true"
        >
          <path
            d="M20 40 C110 70, 160 110, 240 180 S310 280, 290 360"
            fill="none"
            stroke="rgba(213,176,107,0.44)"
            strokeWidth="2"
            strokeDasharray="7 8"
          />
          <path
            d="M28 118 C102 148, 152 170, 290 150"
            fill="none"
            stroke="rgba(248,239,222,0.18)"
            strokeWidth="1.5"
          />
          <path
            d="M48 282 C126 214, 190 198, 296 224"
            fill="none"
            stroke="rgba(213,176,107,0.34)"
            strokeWidth="1.5"
          />
        </svg>
      ) : null}

      {scene.id === "knowledge" ? (
        <div className="pointer-events-none absolute inset-y-10 right-8 hidden w-[38%] items-center justify-center lg:flex">
          <div className="relative h-[16rem] w-[16rem] rounded-full border border-[rgba(213,176,107,0.22)] bg-[rgba(255,248,233,0.06)]">
            <div className="absolute inset-4 rounded-full border border-[rgba(213,176,107,0.18)]" />
            <div className="absolute inset-8 rounded-full border border-dashed border-[rgba(213,176,107,0.24)]" />
            {scene.overlayImage ? (
              <Image
                src={scene.overlayImage}
                alt=""
                fill
                className="rounded-full object-cover opacity-16 mix-blend-screen"
                sizes="320px"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent,rgba(8,6,5,0.76))]" />

      <div className="relative flex h-full max-w-3xl flex-col justify-end p-6 md:p-8 lg:p-10">
        <div className="max-w-2xl rounded-[1.7rem] border border-white/10 bg-[rgba(13,10,8,0.32)] p-5 backdrop-blur-sm md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold tracking-[0.24em] text-[#d5b06b] uppercase">
              {scene.eyebrow}
            </p>
            {scene.overlayLabel ? (
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-[#e2d6c0] uppercase">
                {scene.overlayLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 max-w-xl font-display text-[clamp(2.2rem,4vw,4rem)] leading-[0.96] text-[#f8efdf]">
            {scene.title}
          </h3>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#d9ccb4]">
            {scene.description}
          </p>

          {showCta && onEnterArchive ? (
            <button
              type="button"
              onClick={onEnterArchive}
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-[#d5b06b] px-5 py-3 text-sm font-semibold text-[#120f0b] transition-transform hover:-translate-y-0.5"
            >
              Enter the Archive
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
