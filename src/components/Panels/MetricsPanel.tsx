import type { SearchResult } from "../../algorithms/types";

interface MetricsPanelProps {
  result: SearchResult | null;
  frontierSize: number;
  playbackEnabled: boolean;
}

function formatRuntime(milliseconds: number): string {
  if (milliseconds < 0.01) return "<0.01 ms";
  if (milliseconds < 10) return `${milliseconds.toFixed(2)} ms`;
  return `${milliseconds.toFixed(1)} ms`;
}

export function MetricsPanel({ result, frontierSize, playbackEnabled }: MetricsPanelProps) {
  return (
    <section className="panel-section metrics-panel">
      <div className="section-heading compact-heading">
        <h2>Run metrics</h2>
        {result && (
          <span className={`status-badge ${result.found ? "status-found" : "status-missing"}`}>
            {result.found ? "Path found" : "No path"}
          </span>
        )}
      </div>

      {result ? (
        <dl className="metric-grid">
          <div><dt>Path cost</dt><dd>{result.pathCost ?? "—"}</dd></div>
          <div><dt>Path steps</dt><dd>{result.found ? result.pathLength : "—"}</dd></div>
          <div><dt>Discovered</dt><dd>{result.discoveredCount}</dd></div>
          <div><dt>Expanded</dt><dd>{result.expandedCount}</dd></div>
          <div><dt>Max frontier</dt><dd>{result.maxFrontierSize}</dd></div>
          <div><dt>Execution</dt><dd>{formatRuntime(result.executionTimeMs)}</dd></div>
        </dl>
      ) : (
        <p className="empty-copy">Run an algorithm to populate structural metrics.</p>
      )}
      <div className="live-frontier">
        <span>{playbackEnabled ? "Playback frontier" : "Playback events"}</span>
        <strong>{playbackEnabled ? frontierSize : "Not recorded"}</strong>
      </div>
    </section>
  );
}

export { formatRuntime };
