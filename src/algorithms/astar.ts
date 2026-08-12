import { assertValidGrid, fromIndex, toIndex } from "../core/grid";
import { getNeighbors, resolveMovementOptions } from "../core/neighbors";
import { reconstructPath } from "../core/path";
import type { Grid } from "../core/types";
import { MinHeap } from "../structures/MinHeap";
import {
  defaultHeuristicForMovement,
  getHeuristic,
  isHeuristicCompatible,
} from "./heuristics";
import { finishSearch } from "./shared";
import type { SearchEvent, SearchOptions, SearchResult } from "./types";

interface HeapEntry {
  index: number;
  g: number;
  h: number;
  f: number;
  sequence: number;
}

export function astar(grid: Grid, options: SearchOptions = {}): SearchResult {
  assertValidGrid(grid);
  const recordEvents = options.recordEvents ?? true;
  const startedAt = performance.now();
  const movement = resolveMovementOptions(options);
  const heuristicName = options.heuristic ?? defaultHeuristicForMovement(movement.movementMode);
  if (!isHeuristicCompatible(heuristicName, movement.movementMode)) {
    throw new Error(`${heuristicName} is incompatible with ${movement.movementMode} movement.`);
  }
  const heuristic = getHeuristic(heuristicName);
  const startIndex = toIndex(grid, grid.start);
  const targetIndex = toIndex(grid, grid.target);
  const gScores = Array<number>(grid.terrain.length).fill(Number.POSITIVE_INFINITY);
  const parents = new Map<number, number>();
  const closed = new Set<number>();
  const open = new Set<number>([startIndex]);
  const events: SearchEvent[] = [];
  let sequence = 0;
  const frontier = new MinHeap<HeapEntry>((a, b) => {
    if (a.f !== b.f) return a.f - b.f;
    if (a.h !== b.h) return a.h - b.h;
    return a.sequence - b.sequence;
  });
  let discoveredCount = 1;
  let expandedCount = 0;
  let maxFrontierSize = 1;
  let found = false;

  const startH = heuristic(grid.start, grid.target);
  gScores[startIndex] = 0;
  frontier.push({ index: startIndex, g: 0, h: startH, f: startH, sequence: sequence++ });
  if (recordEvents) events.push({
    type: "discovered",
    coordinate: grid.start,
    frontierSize: 1,
    values: { parent: null, g: 0, h: startH, f: startH, discoveryOrder: 1 },
  });

  while (!frontier.isEmpty) {
    const entry = frontier.pop();
    if (!entry) break;

    if (entry.g !== gScores[entry.index] || closed.has(entry.index)) continue;

    const current = entry.index;
    const coordinate = fromIndex(grid, current);
    open.delete(current);
    expandedCount += 1;
    if (recordEvents) events.push({
      type: "expanded",
      coordinate,
      frontierSize: open.size,
      values: {
        parent: parents.has(current) ? fromIndex(grid, parents.get(current)!) : null,
        g: entry.g,
        h: entry.h,
        f: entry.f,
        expansionOrder: expandedCount,
      },
    });

    closed.add(current);
    if (current === targetIndex) {
      found = true;
      if (recordEvents) events.push({ type: "closed", coordinate, frontierSize: open.size });
      break;
    }

    for (const neighbor of getNeighbors(grid, coordinate, movement)) {
      const candidateG = gScores[current] + neighbor.cost;
      if (candidateG >= gScores[neighbor.index]) continue;

      const previousG = Number.isFinite(gScores[neighbor.index]) ? gScores[neighbor.index] : null;
      const firstDiscovery = previousG === null;
      const nextH = heuristic(neighbor.coordinate, grid.target);
      const nextF = candidateG + nextH;
      gScores[neighbor.index] = candidateG;
      parents.set(neighbor.index, current);

      // Reopening preserves correctness for an admissible but inconsistent heuristic.
      closed.delete(neighbor.index);
      open.add(neighbor.index);
      frontier.push({
        index: neighbor.index,
        g: candidateG,
        h: nextH,
        f: nextF,
        sequence: sequence++,
      });

      if (firstDiscovery) {
        discoveredCount += 1;
        if (recordEvents) events.push({
          type: "discovered",
          coordinate: neighbor.coordinate,
          frontierSize: open.size,
          values: {
            parent: coordinate,
            g: candidateG,
            h: nextH,
            f: nextF,
            discoveryOrder: discoveredCount,
          },
        });
      }

      if (recordEvents) events.push({
        type: "relaxed",
        coordinate: neighbor.coordinate,
        from: coordinate,
        previousCost: previousG,
        frontierSize: open.size,
        values: { parent: coordinate, g: candidateG, h: nextH, f: nextF },
      });
      maxFrontierSize = Math.max(maxFrontierSize, open.size);
    }

    if (recordEvents) events.push({ type: "closed", coordinate, frontierSize: open.size });
  }

  const path = found ? reconstructPath(grid, parents, targetIndex) : [];
  return finishSearch({
    algorithm: "astar",
    grid,
    found,
    path,
    knownPathCost: found ? gScores[targetIndex] : undefined,
    discoveredCount,
    expandedCount,
    maxFrontierSize,
    events,
    recordEvents,
    startedAt,
    movement,
  });
}
