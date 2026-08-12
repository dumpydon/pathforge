import type { Coordinate, CornerPolicy, Grid, MovementMode } from "../core/types";

export type AlgorithmId = "bfs" | "dfs" | "dijkstra" | "astar";
export type HeuristicName = "manhattan" | "euclidean" | "octile" | "zero";

export interface NodeSearchValues {
  parent: Coordinate | null;
  level?: number;
  g?: number;
  h?: number;
  f?: number;
  discoveryOrder?: number;
  expansionOrder?: number;
}

interface BaseSearchEvent {
  coordinate: Coordinate;
  frontierSize: number;
}

export type SearchEvent =
  | (BaseSearchEvent & {
      type: "discovered";
      values: NodeSearchValues;
    })
  | (BaseSearchEvent & {
      type: "expanded";
      values: NodeSearchValues;
    })
  | (BaseSearchEvent & {
      type: "relaxed";
      from: Coordinate;
      previousCost: number | null;
      values: NodeSearchValues;
    })
  | (BaseSearchEvent & {
      type: "closed";
    })
  | {
      type: "path";
      coordinate: Coordinate;
      pathIndex: number;
      pathLength: number;
      frontierSize: 0;
    };

export interface SearchResult {
  algorithm: AlgorithmId;
  found: boolean;
  path: Coordinate[];
  pathCost: number | null;
  pathLength: number;
  discoveredCount: number;
  expandedCount: number;
  maxFrontierSize: number;
  executionTimeMs: number;
  movementMode: MovementMode;
  cornerPolicy: CornerPolicy;
  eventRecordingEnabled: boolean;
  events: SearchEvent[];
}

export interface SearchOptions {
  heuristic?: HeuristicName;
  movementMode?: MovementMode;
  cornerPolicy?: CornerPolicy;
  recordEvents?: boolean;
}

export type SearchAlgorithm = (grid: Grid, options?: SearchOptions) => SearchResult;
