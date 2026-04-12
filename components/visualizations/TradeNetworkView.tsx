"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/common/Badge";
import type { RelationshipGraph, RelationshipNode } from "@/lib/search/types";

interface TradeNetworkViewProps {
  graph: RelationshipGraph;
  onSelectPlace: (value: string) => void;
  onSelectSubject: (value: string) => void;
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
  };
}

export function TradeNetworkView({
  graph,
  onSelectPlace,
  onSelectSubject,
  variant = "rail",
}: TradeNetworkViewProps) {
  const isWorkspace = variant === "workspace";
  const leftNodes = graph.leftNodes.slice(0, isWorkspace ? 8 : 5);
  const rightNodes = graph.rightNodes.slice(0, isWorkspace ? 8 : 5);
  const allowedLeft = new Set(leftNodes.map((node) => node.id));
  const allowedRight = new Set(rightNodes.map((node) => node.id));
  const edges = graph.edges
    .filter((edge) => allowedLeft.has(edge.source) && allowedRight.has(edge.target))
    .slice(0, isWorkspace ? 14 : 10);

  const width = isWorkspace ? 900 : 420;
  const graphHeight = Math.max(
    isWorkspace ? 460 : 320,
    Math.max(leftNodes.length, rightNodes.length) * (isWorkspace ? 58 : 54) + 26,
  );
  const topInset = isWorkspace ? 52 : 34;
  const leftPillX = isWorkspace ? 22 : 12;
  const leftPillWidth = isWorkspace ? 180 : 120;
  const leftCircleX = isWorkspace ? 224 : 144;
  const rightCircleX = isWorkspace ? 674 : 248;
  const rightPillX = isWorkspace ? 694 : 264;
  const rightPillWidth = isWorkspace ? 180 : 120;
  const pillHeight = isWorkspace ? 40 : 34;
  const curveStrength = isWorkspace ? 120 : 48;
  const labelLength = isWorkspace ? 18 : 12;
  const leftPositions = nodePositions(leftNodes, leftCircleX, topInset, graphHeight);
  const rightPositions = nodePositions(rightNodes, rightCircleX, topInset, graphHeight);
  const maxWeight = Math.max(...edges.map((edge) => edge.weight), 1);
  const strongest = strongestConnection(graph);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const activeState = useMemo(() => {
    const edgeIds = new Set<string>();
    const nodeIds = new Set<string>();

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
  }, [activeNodeId, edges]);

  return (
    <section className="panel rounded-[1.8rem] p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
              Relationship explorer
            </p>
            <h2 className="mt-1 font-display text-3xl text-[var(--foreground)]">
              Place-to-theme network
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              {isWorkspace
                ? "The network becomes the primary exploration layer here. Hover to surface the strongest corridors, then click nodes to pivot the archive immediately."
                : "This compact network surfaces the strongest place and subject corridors inside the current result set. Click nodes to pivot the search."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="teal">{leftNodes.length} places</Badge>
            <Badge tone="accent">{rightNodes.length} themes</Badge>
            <Badge>{edges.length} links</Badge>
          </div>
        </div>

        {isWorkspace && strongest ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                Top place
              </p>
              <p className="mt-2 font-display text-2xl text-[var(--foreground)]">
                {leftNodes[0]?.label ?? "Awaiting context"}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                Top theme
              </p>
              <p className="mt-2 font-display text-2xl text-[var(--foreground)]">
                {rightNodes[0]?.label ?? "Awaiting context"}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                Strongest connection
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                {strongest.place} → {strongest.theme}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {leftNodes.length && rightNodes.length && edges.length ? (
        <div className="mt-6 rounded-[1.6rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(248,242,232,0.9))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
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
              x={isWorkspace ? 378 : 170}
              y={10}
              width={isWorkspace ? 138 : 56}
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

              const isActive = !activeNodeId || activeState.edgeIds.has(edge.id);

              return (
                <path
                  key={edge.id}
                  d={curvePath(source, target, curveStrength)}
                  fill="none"
                  stroke={`url(#trade-network-edge-${variant})`}
                  strokeWidth={1.6 + (edge.weight / maxWeight) * (isWorkspace ? 3.8 : 2.6)}
                  strokeOpacity={isActive ? (isWorkspace ? 0.88 : 0.82) : 0.14}
                  strokeLinecap="round"
                />
              );
            })}

            {leftNodes.map((node) => {
              const position = leftPositions.get(node.id);
              if (!position) {
                return null;
              }

              const callback = () => onSelectPlace(node.label);
              const isActive = !activeNodeId || activeState.nodeIds.has(node.id);
              const radius = Math.min(isWorkspace ? 22 : 17, (isWorkspace ? 9 : 7) + node.count * 1.3);

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
                    fontSize={isWorkspace ? "13" : "12"}
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
              const radius = Math.min(isWorkspace ? 22 : 17, (isWorkspace ? 9 : 7) + node.count * 1.3);

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
                    fontSize={isWorkspace ? "13" : "12"}
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

      {!isWorkspace && strongest ? (
        <div className="mt-4 rounded-[1.3rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Strongest corridor:
          <span className="ml-2 font-medium text-[var(--foreground)]">{strongest.place}</span>
          <span className="mx-2 text-[var(--accent)]">→</span>
          <span className="font-medium text-[var(--foreground)]">{strongest.theme}</span>
        </div>
      ) : null}
    </section>
  );
}
