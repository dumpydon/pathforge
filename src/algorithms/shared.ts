import { calculatePathCost } from "../core/path";
import type { Coordinate, Grid } from "../core/types";
import type { AlgorithmId, SearchEvent, SearchResult } from "./types";

interface ResultParts {
  algorithm: AlgorithmId;
  grid: Grid;
  found: boolean;
  path: Coordinate[];
  discoveredCount: number;
  expandedCount: number;
  maxFrontierSize: number;
  events: SearchEvent[];
  startedAt: number;
  knownPathCost?: number;
}

export function finishSearch(parts: ResultParts): SearchResult {
  const pathCost = parts.found
    ? (parts.knownPathCost ?? calculatePathCost(parts.grid, parts.path))
    : null;

  if (parts.found) {
    parts.path.forEach((coordinate, pathIndex) => {
      parts.events.push({
        type: "path",
        coordinate,
        pathIndex,
        pathLength: parts.path.length,
        frontierSize: 0,
      });
    });
  }

  return {
    algorithm: parts.algorithm,
    found: parts.found,
    path: parts.path,
    pathCost,
    pathLength: Math.max(0, parts.path.length - 1),
    discoveredCount: parts.discoveredCount,
    expandedCount: parts.expandedCount,
    maxFrontierSize: parts.maxFrontierSize,
    executionTimeMs: performance.now() - parts.startedAt,
    events: parts.events,
  };
}

