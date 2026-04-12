"use client";

import type { KeyboardEvent } from "react";
import type { RelationshipGraph } from "@/lib/search/types";

interface TradeNetworkViewProps {
  graph: RelationshipGraph;
  onSelectPlace: (value: string) => void;
  onSelectSubject: (value: string) => void;
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

export function TradeNetworkView({
  graph,
  onSelectPlace,
  onSelectSubject,
}: TradeNetworkViewProps) {
  const width = 860;
  const height = 420;
  const leftSpacing = height / Math.max(graph.leftNodes.length, 1);
  const rightSpacing = height / Math.max(graph.rightNodes.length, 1);

  const leftPositions = new Map(
    graph.leftNodes.map((node, index) => [
      node.id,
      { x: 160, y: 48 + index * leftSpacing },
    ]),
  );

  const rightPositions = new Map(
    graph.rightNodes.map((node, index) => [
      node.id,
      { x: width - 160, y: 48 + index * rightSpacing },
    ]),
  );

  return (
    <section className="panel rounded-[1.8rem] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
            Relationship explorer
          </p>
          <h2 className="mt-1 font-display text-3xl text-[var(--foreground)]">
            Place-to-theme network
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            This secondary view surfaces dominant place and subject relationships inside the
            current result set. Click nodes to pivot the search with one move.
          </p>
        </div>
      </div>

      {graph.leftNodes.length && graph.rightNodes.length && graph.edges.length ? (
        <div className="mt-6 overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-[720px] overflow-visible"
            role="img"
            aria-label="Place and subject relationship network"
          >
            {graph.edges.map((edge) => {
              const source = leftPositions.get(edge.source);
              const target = rightPositions.get(edge.target);
              if (!source || !target) {
                return null;
              }

              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgba(159,79,45,0.28)"
                  strokeWidth={Math.max(1.5, edge.weight * 1.4)}
                  strokeLinecap="round"
                />
              );
            })}

            {graph.leftNodes.map((node) => {
              const position = leftPositions.get(node.id);
              if (!position) {
                return null;
              }

              const callback = () => onSelectPlace(node.label);

              return (
                <g
                  key={node.id}
                  transform={`translate(${position.x}, ${position.y})`}
                  tabIndex={0}
                  role="button"
                  onClick={callback}
                  onKeyDown={(event) => activateOnKeyboard(event, callback)}
                  className="cursor-pointer"
                >
                  <circle r={16 + node.count * 1.4} fill="rgba(47,111,104,0.18)" stroke="rgba(47,111,104,0.45)" />
                  <text
                    x={-22}
                    y={4}
                    textAnchor="end"
                    fontSize="13"
                    fill="currentColor"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {graph.rightNodes.map((node) => {
              const position = rightPositions.get(node.id);
              if (!position) {
                return null;
              }

              const callback = () => onSelectSubject(node.label);

              return (
                <g
                  key={node.id}
                  transform={`translate(${position.x}, ${position.y})`}
                  tabIndex={0}
                  role="button"
                  onClick={callback}
                  onKeyDown={(event) => activateOnKeyboard(event, callback)}
                  className="cursor-pointer"
                >
                  <circle r={16 + node.count * 1.4} fill="rgba(159,79,45,0.18)" stroke="rgba(159,79,45,0.38)" />
                  <text
                    x={24}
                    y={4}
                    fontSize="13"
                    fill="currentColor"
                  >
                    {node.label}
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

