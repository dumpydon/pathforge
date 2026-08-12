import type { AlgorithmId, SearchResult } from "../../algorithms/types";
import { ALGORITHM_INFO, ALGORITHM_ORDER } from "../../data/algorithmInfo";
import { formatPathCost, formatRuntime } from "./MetricsPanel";

interface ComparisonPanelProps {
  results: Partial<Record<AlgorithmId, SearchResult>>;
  activeAlgorithm: AlgorithmId;
  hasWeightedTerrain: boolean;
  playbackEnabled: boolean;
  onReplay: (algorithm: AlgorithmId) => void;
}

export function ComparisonPanel({
  results,
  activeAlgorithm,
  hasWeightedTerrain,
  playbackEnabled,
  onReplay,
}: ComparisonPanelProps) {
  const hasResults = Object.keys(results).length > 0;

  return (
    <section className="comparison-section">
      <div className="comparison-heading">
        <h2>Algorithm comparison</h2>
        {hasWeightedTerrain && (
          <p className="weight-notice">
            BFS and DFS traverse weighted cells but do not optimize their cost.
          </p>
        )}
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>Objective</th>
              <th>Found</th>
              <th>Path cost</th>
              <th>Steps</th>
              <th>Expanded</th>
              <th>Max frontier</th>
              <th>Execution</th>
              <th><span className="sr-only">Replay</span></th>
            </tr>
          </thead>
          <tbody>
            {ALGORITHM_ORDER.map((algorithm) => {
              const result = results[algorithm];
              return (
                <tr key={algorithm} className={activeAlgorithm === algorithm && result ? "is-active" : ""}>
                  <th scope="row">{ALGORITHM_INFO[algorithm].name}</th>
                  <td>
                    {algorithm === "bfs"
                      ? "Fewest edges"
                      : algorithm === "dfs"
                        ? "Reachability"
                        : "Minimum cost"}
                  </td>
                  <td>{result ? (result.found ? "Yes" : "No") : "—"}</td>
                  <td>{formatPathCost(result?.pathCost ?? null)}</td>
                  <td>{result?.found ? result.pathLength : "—"}</td>
                  <td>{result?.expandedCount ?? "—"}</td>
                  <td>{result?.maxFrontierSize ?? "—"}</td>
                  <td>{result ? formatRuntime(result.executionTimeMs) : "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="replay-button"
                      disabled={!result}
                      onClick={() => onReplay(algorithm)}
                    >
                      {playbackEnabled ? "Replay" : "Inspect"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!hasResults && <p className="comparison-empty">Run all to compare structural behavior without animation time.</p>}
    </section>
  );
}
