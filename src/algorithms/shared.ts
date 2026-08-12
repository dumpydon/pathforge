import { calculatePathCost } from "../core/path";
import { resolveMovementOptions, type MovementOptions } from "../core/neighbors";
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
  recordEvents: boolean;
  startedAt: number;
  movement: MovementOptions;
  knownPathCost?: number;
}

export function finishSearch(parts: ResultParts): SearchResult {
  const movement = resolveMovementOptions(parts.movement);
  const pathCost = parts.found
    ? (parts.knownPathCost ?? calculatePathCost(parts.grid, parts.path, movement))
    : null;

  if (parts.found && parts.recordEvents) {
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
    movementMode: movement.movementMode,
    cornerPolicy: movement.cornerPolicy,
    eventRecordingEnabled: parts.recordEvents,
    events: parts.events,
  };
}
