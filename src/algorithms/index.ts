import type { Grid } from "../core/types";
import { astar } from "./astar";
import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { dijkstra } from "./dijkstra";
import type { AlgorithmId, SearchOptions, SearchResult } from "./types";

export { astar, bfs, dfs, dijkstra };
export type * from "./types";

export function runAlgorithm(
  algorithm: AlgorithmId,
  grid: Grid,
  options: SearchOptions = {},
): SearchResult {
  switch (algorithm) {
    case "bfs":
      return bfs(grid, options);
    case "dfs":
      return dfs(grid, options);
    case "dijkstra":
      return dijkstra(grid, options);
    case "astar":
      return astar(grid, options);
  }
}

export function runAllAlgorithms(
  grid: Grid,
  options: SearchOptions = {},
): Record<AlgorithmId, SearchResult> {
  return {
    bfs: bfs(grid, options),
    dfs: dfs(grid, options),
    dijkstra: dijkstra(grid, options),
    astar: astar(grid, options),
  };
}
