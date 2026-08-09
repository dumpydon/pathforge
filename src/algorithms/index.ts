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
      return bfs(grid);
    case "dfs":
      return dfs(grid);
    case "dijkstra":
      return dijkstra(grid);
    case "astar":
      return astar(grid, options);
  }
}

