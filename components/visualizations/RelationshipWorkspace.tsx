import { Badge } from "@/components/common/Badge";
import type { RelationshipGraph, TimelineData } from "@/lib/search/types";
import { TradeNetworkView } from "./TradeNetworkView";
import { TimelineView } from "./TimelineView";

interface RelationshipWorkspaceProps {
  graph: RelationshipGraph;
  timeline: TimelineData;
  resultCount: number;
  onSelectPlace: (value: string) => void;
  onSelectSubject: (value: string) => void;
  onRangeChange: (value: [number, number] | null) => void;
}

function strongestConnection(graph: RelationshipGraph) {
  const edge = graph.edges[0];
  if (!edge) {
    return null;
  }

  const place = graph.leftNodes.find((node) => node.id === edge.source)?.label ?? edge.source;
  const subject =
    graph.rightNodes.find((node) => node.id === edge.target)?.label ?? edge.target;

  return { place, subject, weight: edge.weight };
}

export function RelationshipWorkspace({
  graph,
  timeline,
  resultCount,
  onSelectPlace,
  onSelectSubject,
  onRangeChange,
}: RelationshipWorkspaceProps) {
  const topPlace = graph.leftNodes[0] ?? null;
  const topTheme = graph.rightNodes[0] ?? null;
  const strongest = strongestConnection(graph);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
      <TradeNetworkView
        graph={graph}
        onSelectPlace={onSelectPlace}
        onSelectSubject={onSelectSubject}
        variant="workspace"
      />

      <div className="space-y-6">
        <section className="panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
            Network reading
          </p>
          <h3 className="mt-1 font-display text-3xl text-[var(--foreground)]">
            Relationship highlights
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            The graph is now the primary workspace. Use the strongest nodes or the timeline to
            pivot the archive from pattern to record.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-[1.3rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                Top place
              </p>
              <p className="mt-2 font-display text-2xl text-[var(--foreground)]">
                {topPlace?.label ?? "Awaiting context"}
              </p>
              <div className="mt-2">
                <Badge tone="teal">{topPlace?.count ?? 0} linked records</Badge>
              </div>
            </div>

            <div className="rounded-[1.3rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                Top theme
              </p>
              <p className="mt-2 font-display text-2xl text-[var(--foreground)]">
                {topTheme?.label ?? "Awaiting context"}
              </p>
              <div className="mt-2">
                <Badge tone="accent">{topTheme?.count ?? 0} linked records</Badge>
              </div>
            </div>

            <div className="rounded-[1.3rem] border border-[var(--border)] bg-[rgba(255,251,245,0.74)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                Strongest connection
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {strongest
                  ? `${strongest.place} → ${strongest.subject}`
                  : "Narrow the archive to reveal the most coherent corridor."}
              </p>
              {strongest ? (
                <div className="mt-2">
                  <Badge>{strongest.weight} shared records</Badge>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <TimelineView
          timeline={timeline}
          resultCount={resultCount}
          compact
          onRangeChange={onRangeChange}
        />
      </div>
    </section>
  );
}
