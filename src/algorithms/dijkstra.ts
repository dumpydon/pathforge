import { assertValidGrid, fromIndex, toIndex } from "../core/grid";
import { getNeighbors, resolveMovementOptions } from "../core/neighbors";
import { reconstructPath } from "../core/path";
import type { Grid } from "../core/types";
import { MinHeap } from "../structures/MinHeap";
import { finishSearch } from "./shared";
import type { SearchEvent, SearchOptions, SearchResult } from "./types";

interface HeapEntry {
  index: number;
  distance: number;
  sequence: number;
}

export function dijkstra(grid: Grid, options: SearchOptions = {}): SearchResult {
  assertValidGrid(grid);
  const recordEvents = options.recordEvents ?? true;
  const movement = resolveMovementOptions(options);
  const startedAt = performance.now();
  const startIndex = toIndex(grid, grid.start);
  const targetIndex = toIndex(grid, grid.target);
  const distances = Array<number>(grid.terrain.length).fill(Number.POSITIVE_INFINITY);
  const parents = new Map<number, number>();
  const closed = new Set<number>();
  const open = new Set<number>([startIndex]);
  const events: SearchEvent[] = [];
  let sequence = 0;
  const frontier = new MinHeap<HeapEntry>((a, b) =>
    a.distance === b.distance ? a.sequence - b.sequence : a.distance - b.distance,
  );
  let discoveredCount = 1;
  let expandedCount = 0;
  let maxFrontierSize = 1;
  let found = false;

  distances[startIndex] = 0;
  frontier.push({ index: startIndex, distance: 0, sequence: sequence++ });
  if (recordEvents) events.push({
    type: "discovered",
    coordinate: grid.start,
    frontierSize: 1,
    values: { parent: null, g: 0, discoveryOrder: 1 },
  });

  while (!frontier.isEmpty) {
    const entry = frontier.pop();
    if (!entry) break;

    // Duplicate insertions avoid a decrease-key API; stale entries are discarded here.
    if (entry.distance !== distances[entry.index] || closed.has(entry.index)) continue;

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
        g: distances[current],
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
      if (closed.has(neighbor.index)) continue;

      const candidateDistance = distances[current] + neighbor.cost;
      if (candidateDistance >= distances[neighbor.index]) continue;

      const previousDistance = Number.isFinite(distances[neighbor.index])
        ? distances[neighbor.index]
        : null;
      const firstDiscovery = previousDistance === null;
      distances[neighbor.index] = candidateDistance;
      parents.set(neighbor.index, current);
      frontier.push({ index: neighbor.index, distance: candidateDistance, sequence: sequence++ });
      open.add(neighbor.index);

      if (firstDiscovery) {
        discoveredCount += 1;
        if (recordEvents) events.push({
          type: "discovered",
          coordinate: neighbor.coordinate,
          frontierSize: open.size,
          values: {
            parent: coordinate,
            g: candidateDistance,
            discoveryOrder: discoveredCount,
          },
        });
      }

      if (recordEvents) events.push({
        type: "relaxed",
        coordinate: neighbor.coordinate,
        from: coordinate,
        previousCost: previousDistance,
        frontierSize: open.size,
        values: { parent: coordinate, g: candidateDistance },
      });
      maxFrontierSize = Math.max(maxFrontierSize, open.size);
    }

    if (recordEvents) events.push({ type: "closed", coordinate, frontierSize: open.size });
  }

  const path = found ? reconstructPath(grid, parents, targetIndex) : [];
  return finishSearch({
    algorithm: "dijkstra",
    grid,
    found,
    path,
    knownPathCost: found ? distances[targetIndex] : undefined,
    discoveredCount,
    expandedCount,
    maxFrontierSize,
    events,
    recordEvents,
    startedAt,
    movement,
  });
}
