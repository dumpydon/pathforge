import type { AlgorithmId } from "../../algorithms/types";
import { terrainAt, terrainCost } from "../../core/grid";
import type { Coordinate, Grid } from "../../core/types";
import type { PlaybackNode } from "../../playback/types";

interface NodeInspectorProps {
  algorithm: AlgorithmId;
  grid: Grid;
  coordinate: Coordinate | null;
  node: PlaybackNode | undefined;
}

function formatCoordinate(coordinate: Coordinate | null): string {
  return coordinate ? `(${coordinate.row}, ${coordinate.col})` : "—";
}

export function NodeInspector({ algorithm, grid, coordinate, node }: NodeInspectorProps) {
  const terrain = coordinate ? terrainAt(grid, coordinate) : null;
  const cost = terrain && terrain !== "wall" ? terrainCost(terrain) : null;

  return (
    <section className="panel-section inspector-panel">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Playback state</p>
          <h2>Node inspector</h2>
        </div>
        <code>{formatCoordinate(coordinate)}</code>
      </div>

      {coordinate ? (
        <dl className="inspector-list">
          <div><dt>Terrain</dt><dd>{terrain}{cost !== null ? ` · cost ${cost}` : ""}</dd></div>
          <div><dt>State</dt><dd>{node?.state ?? "unvisited"}</dd></div>
          {algorithm === "bfs" && <div><dt>Level</dt><dd>{node?.level ?? "—"}</dd></div>}
          {(algorithm === "dijkstra" || algorithm === "astar") && (
            <div><dt>{algorithm === "astar" ? "g score" : "Distance"}</dt><dd>{node?.g ?? "—"}</dd></div>
          )}
          {algorithm === "astar" && <div><dt>h score</dt><dd>{node?.h?.toFixed(2) ?? "—"}</dd></div>}
          {algorithm === "astar" && <div><dt>f score</dt><dd>{node?.f?.toFixed(2) ?? "—"}</dd></div>}
          <div><dt>Parent</dt><dd>{formatCoordinate(node?.parent ?? null)}</dd></div>
          {node?.discoveryOrder !== undefined && <div><dt>Discovered</dt><dd>#{node.discoveryOrder}</dd></div>}
          {node?.expansionOrder !== undefined && <div><dt>Expanded</dt><dd>#{node.expansionOrder}</dd></div>}
        </dl>
      ) : (
        <p className="empty-copy">Select a cell to inspect its terrain and recorded search values.</p>
      )}
    </section>
  );
}

