"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ChronicleScene } from "./ChronicleScene";
import { CHRONICLE_SCENES } from "./chronicleScenes";

interface ChronicleExpansionProps {
  onEnterArchive: () => void;
}

export function ChronicleExpansion({ onEnterArchive }: ChronicleExpansionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const { scrollY } = useScroll();
  const activeScene = CHRONICLE_SCENES[activeSceneIndex];
  const startHold = 0.08;
  const endHold = 0.1;
  const firstSceneCutoff = 0.36;
  const secondSceneCutoff = 0.73;

  const measureProgress = () => {
    const element = sectionRef.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollStart = window.innerHeight * 0.12;
    const totalDistance = Math.max(element.offsetHeight - window.innerHeight, 1);
    const traveled = scrollStart - rect.top;
    const rawProgress = Math.min(1, Math.max(0, traveled / totalDistance));

    if (rawProgress <= startHold) {
      setProgress(0);
      return;
    }

    if (rawProgress >= 1 - endHold) {
      setProgress(1);
      return;
    }

    const nextProgress =
      (rawProgress - startHold) / (1 - startHold - endHold);
    setProgress(nextProgress);
  };

  useEffect(() => {
    measureProgress();
    window.addEventListener("resize", measureProgress);

    return () => {
      window.removeEventListener("resize", measureProgress);
    };
  }, []);

  useMotionValueEvent(scrollY, "change", () => {
    measureProgress();
  });

  useEffect(() => {
    const nextIndex =
      progress < firstSceneCutoff ? 0 : progress < secondSceneCutoff ? 1 : 2;

    setActiveSceneIndex((current) => (current === nextIndex ? current : nextIndex));
  }, [firstSceneCutoff, progress, secondSceneCutoff]);

  const stageScale = 0.88 + Math.min(progress, 0.22) / 0.22 * 0.12;
  const stageY = 48 - Math.min(progress, 0.22) / 0.22 * 48;
  const stageRadius = progress < 0.48 ? 38 - (progress / 0.48) * 10 : 28;

  if (prefersReducedMotion) {
    return (
      <section className="px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1560px] space-y-6">
          {CHRONICLE_SCENES.map((scene, index) => (
            <div key={scene.id} className="relative h-[32rem] overflow-hidden rounded-[2rem]">
              <ChronicleScene
                scene={scene}
                showCta={index === CHRONICLE_SCENES.length - 1}
                onEnterArchive={onEnterArchive}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[286svh] px-4 md:px-6 lg:px-8">
      <div className="sticky top-4 h-[96svh]">
        <div className="mx-auto flex h-full max-w-[1560px] flex-col justify-center">
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#b59b68] uppercase">
              Chronicle expansion
            </p>
            <h2 className="mt-2 font-display text-4xl text-[#f3ead8] md:text-5xl">
              History narrows into discovery.
            </h2>
          </div>

          <motion.div
            style={{ scale: stageScale, y: stageY, borderRadius: stageRadius }}
            className="relative h-[76svh] min-h-[560px] overflow-hidden border border-white/10 bg-[#0f0b09] shadow-[0_36px_120px_rgba(0,0,0,0.4)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,10,0.95),rgba(10,8,6,0.98))]" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeScene.id}
                initial={{ opacity: 0, y: 26, scale: 1.015 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.995 }}
                transition={{ duration: 0.38, ease: "easeOut" }}
                className="absolute inset-0 z-[3]"
              >
                <ChronicleScene
                  scene={activeScene}
                  showCta={activeScene.id === "archive"}
                  onEnterArchive={onEnterArchive}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
