"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/common/Badge";
import type { RelationshipGraph, RelationshipNode } from "@/lib/search/types";

interface TradeNetworkViewProps {
  graph: RelationshipGraph;
  onSelectPlace: (value: string) => void;
  onSelectSubject: (value: string) => void;
  onSelectEdge?: (place: string, subject: string) => void;
  variant?: "rail" | "workspace";
}

function activateOnKeyboard(
  event: KeyboardEvent<SVGGElement>,
  callback: () => void,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
}

function nodePositions(nodes: RelationshipNode[], x: number, top: number, height: number) {
  const usableHeight = Math.max(height - top * 2, 1);
  const spacing = nodes.length > 1 ? usableHeight / (nodes.length - 1) : 0;

  return new Map(
    nodes.map((node, index) => [
      node.id,
      {
        x,
        y: top + index * spacing,
      },
    ]),
  );
}

function truncateLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

function curvePath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  curveStrength: number,
) {
  return `M ${source.x} ${source.y} C ${source.x + curveStrength} ${source.y}, ${target.x - curveStrength} ${target.y}, ${target.x} ${target.y}`;
}

function strongestConnection(graph: RelationshipGraph) {
  const strongest = graph.edges[0];
  if (!strongest) {
    return null;
  }

  return {
    place: graph.leftNodes.find((node) => node.id === strongest.source)?.label ?? strongest.source,
    theme:
      graph.rightNodes.find((node) => node.id === strongest.target)?.label ?? strongest.target,
    weight: strongest.weight,
    sharedRecords: strongest.sharedRecords,
  };
}

export function TradeNetworkView({
  graph,
  onSelectPlace,
  onSelectSubject,
  onSelectEdge,
  variant = "rail",
}: TradeNetworkViewProps) {
  const isWorkspace = variant === "workspace";
  const leftNodes = graph.leftNodes.slice(0, isWorkspace ? 8 : 4);
  const rightNodes = graph.rightNodes.slice(0, isWorkspace ? 8 : 4);
  const allowedLeft = new Set(leftNodes.map((node) => node.id));
  const allowedRight = new Set(rightNodes.map((node) => node.id));
  const edges = graph.edges
    .filter((edge) => allowedLeft.has(edge.source) && allowedRight.has(edge.target))
    .slice(0, isWorkspace ? 12 : 6);

  const width = isWorkspace ? 900 : 420;
  const graphHeight = Math.max(
    isWorkspace ? 460 : 212,
    Math.max(leftNodes.length, rightNodes.length) * (isWorkspace ? 58 : 34) + 14,
  );
  const topInset = isWorkspace ? 52 : 22;
  const leftPillX = isWorkspace ? 22 : 12;
  const leftPillWidth = isWorkspace ? 180 : 100;
  const leftCircleX = isWorkspace ? 224 : 120;
  const rightCircleX = isWorkspace ? 674 : 282;
  const rightPillX = isWorkspace ? 694 : 298;
  const rightPillWidth = isWorkspace ? 180 : 100;
  const pillHeight = isWorkspace ? 40 : 28;
  const curveStrength = isWorkspace ? 120 : 48;
  const labelLength = isWorkspace ? 18 : 8;
  const leftPositions = nodePositions(leftNodes, leftCircleX, topInset, graphHeight);
  const rightPositions = nodePositions(rightNodes, rightCircleX, topInset, graphHeight);
  const maxWeight = Math.max(...edges.map((edge) => edge.weight), 1);
  const strongest = strongestConnection(graph);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const activeEdge = edges.find((edge) => edge.id === activeEdgeId) ?? edges[0] ?? null;
  const maxLeftScore = Math.max(...leftNodes.map((node) => node.score), 1);
  const maxRightScore = Math.max(...rightNodes.map((node) => node.score), 1);

  const activeState = useMemo(() => {
    const edgeIds = new Set<string>();
    const nodeIds = new Set<string>();

    if (activeEdgeId) {
      const edge = edges.find((candidate) => candidate.id === activeEdgeId);
      if (edge) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
      return { edgeIds, nodeIds };
    }

    if (!activeNodeId) {
      return { edgeIds, nodeIds };
    }

    nodeIds.add(activeNodeId);

    edges.forEach((edge) => {
      if (edge.source === activeNodeId || edge.target === activeNodeId) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
    });

    return { edgeIds, nodeIds };
  }, [activeEdgeId, activeNodeId, edges]);

  return (
    <section className={`panel rounded-[1.8rem] ${isWorkspace ? "p-5" : "p-3.5"}`}>
      <div className={`flex flex-col ${isWorkspace ? "gap-4" : "gap-3"}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
              Relationship explorer
            </p>
            <h2 className={`mt-1 font-display text-[var(--foreground)] ${isWorkspace ? "text-3xl" : "text-[2.18rem] leading-none"}`}>
              Place-to-theme network
            </h2>
            <p className={`mt-2 max-w-2xl text-[var(--muted-foreground)] ${isWorkspace ? "text-sm leading-6" : "text-[12px] leading-[1.35rem]"}`}>
              {isWorkspace
                ? "Links reflect relevance-weighted co-occurrence across the current archive slice. Stronger lines indicate more distinctive place-theme associations."
                : "Distinctive place-theme corridors in the current result set. Click nodes or lines to pivot the search."}
            </p>
          </div>

          {isWorkspace ? (
            <div className="flex flex-wrap gap-2">
              <Badge tone="teal">{leftNodes.length} places</Badge>
              <Badge tone="accent">{rightNodes.length} themes</Badge>
              <Badge>{edges.length} links</Badge>
            </div>
          ) : null}
        </div>

        {activeEdge ? (
          <div className={`rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] text-[var(--muted-foreground)] ${isWorkspace ? "px-3.5 py-2.5 text-sm leading-6" : "px-3 py-2 text-[12px] leading-5"}`}>
            <span className="font-medium text-[var(--foreground)]">
              {graph.leftNodes.find((node) => node.id === activeEdge.source)?.label}
            </span>
            <span className="mx-2 text-[var(--accent)]">↔</span>
            <span className="font-medium text-[var(--foreground)]">
              {graph.rightNodes.find((node) => node.id === activeEdge.target)?.label}
            </span>
            <span className={`ml-2 block tracking-[0.1em] uppercase text-[var(--muted-foreground)] sm:inline sm:normal-case sm:tracking-normal ${isWorkspace ? "text-xs sm:text-sm" : "text-[11px] sm:text-[12px]"}`}>
              {activeEdge.sharedRecords} records · score {activeEdge.weight.toFixed(2)}
            </span>
          </div>
        ) : null}
      </div>

      {leftNodes.length && rightNodes.length && edges.length ? (
        <div className={`rounded-[1.6rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(248,242,232,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${isWorkspace ? "mt-6 p-3" : "mt-4 p-1.5"}`}>
          <svg
            viewBox={`0 0 ${width} ${graphHeight}`}
            className="h-auto w-full"
            role="img"
            aria-label="Place and theme relationship network"
          >
            <defs>
              <linearGradient id={`trade-network-edge-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(47,111,104,0.78)" />
                <stop offset="100%" stopColor="rgba(159,79,45,0.72)" />
              </linearGradient>
            </defs>

            <rect
              x={isWorkspace ? 378 : 173}
              y={10}
              width={isWorkspace ? 138 : 54}
              height={graphHeight - 20}
              rx={isWorkspace ? 34 : 28}
              fill="rgba(243,234,219,0.82)"
            />

            {edges.map((edge) => {
              const source = leftPositions.get(edge.source);
              const target = rightPositions.get(edge.target);
              if (!source || !target) {
                return null;
              }

              const isActive = !activeNodeId && !activeEdgeId ? true : activeState.edgeIds.has(edge.id);
              const edgeOpacity = isActive
                ? (activeEdgeId ? 0.96 : 0.28 + (edge.weight / maxWeight) * 0.56)
                : 0.08;
              const edgeWidth =
                1.8 + (edge.weight / maxWeight) * (isWorkspace ? 4.2 : 3.1);
              const placeLabel =
                graph.leftNodes.find((node) => node.id === edge.source)?.label ?? edge.source;
              const subjectLabel =
                graph.rightNodes.find((node) => node.id === edge.target)?.label ?? edge.target;
              const clickEdge = () => onSelectEdge?.(placeLabel, subjectLabel);

              return (
                <g
                  key={edge.id}
                  onMouseEnter={() => setActiveEdgeId(edge.id)}
                  onMouseLeave={() => setActiveEdgeId(null)}
                  onFocus={() => setActiveEdgeId(edge.id)}
                  onBlur={() => setActiveEdgeId(null)}
                  onClick={clickEdge}
                  onKeyDown={(event) => activateOnKeyboard(event, clickEdge)}
                  tabIndex={0}
                  role="button"
                  className={onSelectEdge ? "cursor-pointer" : undefined}
                >
                  <title>{`${placeLabel} ↔ ${subjectLabel}, ${edge.sharedRecords} records, score ${edge.weight.toFixed(2)}`}</title>
                  <path
                    d={curvePath(source, target, curveStrength)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(edgeWidth + 9, 12)}
                    strokeLinecap="round"
                  />
                  <path
                    d={curvePath(source, target, curveStrength)}
                    fill="none"
                    stroke={`url(#trade-network-edge-${variant})`}
                    strokeWidth={edgeWidth}
                    strokeOpacity={edgeOpacity}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {leftNodes.map((node) => {
              const position = leftPositions.get(node.id);
              if (!position) {
                return null;
              }

              const callback = () => onSelectPlace(node.label);
              const isActive = !activeNodeId || activeState.nodeIds.has(node.id);
              const radius = (isWorkspace ? 12 : 9) + (node.score / maxLeftScore) * (isWorkspace ? 10 : 7);

              return (
                <g
                  key={node.id}
                  tabIndex={0}
                  role="button"
                  onClick={callback}
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  onMouseLeave={() => setActiveNodeId(null)}
                  onFocus={() => setActiveNodeId(node.id)}
                  onBlur={() => setActiveNodeId(null)}
                  onKeyDown={(event) => activateOnKeyboard(event, callback)}
                  className="cursor-pointer"
                >
                  <title>{`${node.label}, ${node.count} linked records`}</title>
                  <rect
                    x={leftPillX}
                    y={position.y - pillHeight / 2}
                    width={leftPillWidth}
                    height={pillHeight}
                    rx={pillHeight / 2}
                    fill={isActive ? "rgba(47,111,104,0.12)" : "rgba(47,111,104,0.07)"}
                    stroke={isActive ? "rgba(47,111,104,0.26)" : "rgba(47,111,104,0.14)"}
                  />
                  <text
                    x={leftPillX + 14}
                    y={position.y + 4}
                    fontSize={isWorkspace ? "13" : "10.5"}
                    fontWeight="600"
                    fill="currentColor"
                    opacity={isActive ? 1 : 0.72}
                  >
                    {truncateLabel(node.label, labelLength)} · {node.count}
                  </text>
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={radius}
                    fill="rgba(218,230,227,0.96)"
                    stroke="rgba(47,111,104,0.42)"
                    strokeWidth={isActive ? "2.4" : "1.5"}
                    opacity={isActive ? 1 : 0.74}
                  />
                </g>
              );
            })}

            {rightNodes.map((node) => {
              const position = rightPositions.get(node.id);
              if (!position) {
                return null;
              }

              const callback = () => onSelectSubject(node.label);
              const isActive = !activeNodeId || activeState.nodeIds.has(node.id);
              const radius = (isWorkspace ? 12 : 9) + (node.score / maxRightScore) * (isWorkspace ? 10 : 7);

              return (
                <g
                  key={node.id}
                  tabIndex={0}
                  role="button"
                  onClick={callback}
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  onMouseLeave={() => setActiveNodeId(null)}
                  onFocus={() => setActiveNodeId(node.id)}
                  onBlur={() => setActiveNodeId(null)}
                  onKeyDown={(event) => activateOnKeyboard(event, callback)}
                  className="cursor-pointer"
                >
                  <title>{`${node.label}, ${node.count} linked records`}</title>
                  <circle
                    cx={rightCircleX}
                    cy={position.y}
                    r={radius}
                    fill="rgba(247,230,220,0.95)"
                    stroke="rgba(159,79,45,0.38)"
                    strokeWidth={isActive ? "2.4" : "1.5"}
                    opacity={isActive ? 1 : 0.74}
                  />
                  <rect
                    x={rightPillX}
                    y={position.y - pillHeight / 2}
                    width={rightPillWidth}
                    height={pillHeight}
                    rx={pillHeight / 2}
                    fill={isActive ? "rgba(159,79,45,0.11)" : "rgba(159,79,45,0.07)"}
                    stroke={isActive ? "rgba(159,79,45,0.22)" : "rgba(159,79,45,0.14)"}
                  />
                  <text
                    x={rightPillX + 14}
                    y={position.y + 4}
                    fontSize={isWorkspace ? "13" : "10.5"}
                    fontWeight="600"
                    fill="currentColor"
                    opacity={isActive ? 1 : 0.72}
                  >
                    {truncateLabel(node.label, labelLength)} · {node.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
          Relationship data becomes richer once a query or filter narrows the archive into a
          coherent thematic set.
        </div>
      )}

    </section>
  );
}
