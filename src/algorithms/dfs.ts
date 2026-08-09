import { assertValidGrid, fromIndex, toIndex } from "../core/grid";
import { getNeighborIndices } from "../core/neighbors";
import { reconstructPath } from "../core/path";
import type { Grid } from "../core/types";
import { finishSearch } from "./shared";
import type { SearchEvent, SearchOptions, SearchResult } from "./types";

export function dfs(grid: Grid, options: SearchOptions = {}): SearchResult {
  assertValidGrid(grid);
  const recordEvents = options.recordEvents ?? true;
  const startedAt = performance.now();
  const startIndex = toIndex(grid, grid.start);
  const targetIndex = toIndex(grid, grid.target);
  const stack = [startIndex];
  const discovered = new Set<number>([startIndex]);
  const parents = new Map<number, number>();
  const events: SearchEvent[] = [];
  let discoveredCount = 1;
  let expandedCount = 0;
  let maxFrontierSize = 1;
  let found = false;

  if (recordEvents) events.push({
    type: "discovered",
    coordinate: grid.start,
    frontierSize: 1,
    values: { parent: null, discoveryOrder: 1 },
  });

  while (stack.length > 0) {
    const current = stack.pop()!;
    const coordinate = fromIndex(grid, current);
    expandedCount += 1;

    if (recordEvents) events.push({
      type: "expanded",
      coordinate,
      frontierSize: stack.length,
      values: {
        parent: parents.has(current) ? fromIndex(grid, parents.get(current)!) : null,
        expansionOrder: expandedCount,
      },
    });

    if (current === targetIndex) {
      found = true;
      if (recordEvents) events.push({ type: "closed", coordinate, frontierSize: stack.length });
      break;
    }

    const neighbors = getNeighborIndices(grid, current);
    // Reverse push order so the first deterministic neighbor is popped first.
    for (let index = neighbors.length - 1; index >= 0; index -= 1) {
      const neighbor = neighbors[index];
      if (discovered.has(neighbor)) continue;

      discovered.add(neighbor);
      parents.set(neighbor, current);
      stack.push(neighbor);
      discoveredCount += 1;
      maxFrontierSize = Math.max(maxFrontierSize, stack.length);

      if (recordEvents) events.push({
        type: "discovered",
        coordinate: fromIndex(grid, neighbor),
        frontierSize: stack.length,
        values: { parent: coordinate, discoveryOrder: discoveredCount },
      });
    }

    if (recordEvents) events.push({ type: "closed", coordinate, frontierSize: stack.length });
  }

  const path = found ? reconstructPath(grid, parents, targetIndex) : [];
  return finishSearch({
    algorithm: "dfs",
    grid,
    found,
    path,
    discoveredCount,
    expandedCount,
    maxFrontierSize,
    events,
    recordEvents,
    startedAt,
  });
}
