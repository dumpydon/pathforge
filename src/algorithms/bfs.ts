import { assertValidGrid, fromIndex, toIndex } from "../core/grid";
import { getNeighbors, resolveMovementOptions } from "../core/neighbors";
import { reconstructPath } from "../core/path";
import type { Grid } from "../core/types";
import { Queue } from "../structures/Queue";
import { finishSearch } from "./shared";
import type { SearchEvent, SearchOptions, SearchResult } from "./types";

export function bfs(grid: Grid, options: SearchOptions = {}): SearchResult {
  assertValidGrid(grid);
  const recordEvents = options.recordEvents ?? true;
  const movement = resolveMovementOptions(options);
  const startedAt = performance.now();
  const startIndex = toIndex(grid, grid.start);
  const targetIndex = toIndex(grid, grid.target);
  const queue = new Queue<number>();
  const discovered = new Set<number>([startIndex]);
  const parents = new Map<number, number>();
  const levels = new Map<number, number>([[startIndex, 0]]);
  const events: SearchEvent[] = [];
  let discoveredCount = 1;
  let expandedCount = 0;
  let maxFrontierSize = 1;
  let found = false;

  queue.enqueue(startIndex);
  if (recordEvents) events.push({
    type: "discovered",
    coordinate: grid.start,
    frontierSize: 1,
    values: { parent: null, level: 0, discoveryOrder: 1 },
  });

  while (!queue.isEmpty) {
    const current = queue.dequeue();
    if (current === undefined) break;
    const coordinate = fromIndex(grid, current);
    const level = levels.get(current) ?? 0;
    expandedCount += 1;

    if (recordEvents) events.push({
      type: "expanded",
      coordinate,
      frontierSize: queue.size,
      values: {
        parent: parents.has(current) ? fromIndex(grid, parents.get(current)!) : null,
        level,
        expansionOrder: expandedCount,
      },
    });

    if (current === targetIndex) {
      found = true;
      if (recordEvents) events.push({ type: "closed", coordinate, frontierSize: queue.size });
      break;
    }

    for (const neighbor of getNeighbors(grid, coordinate, movement)) {
      if (discovered.has(neighbor.index)) continue;

      discovered.add(neighbor.index);
      parents.set(neighbor.index, current);
      levels.set(neighbor.index, level + 1);
      queue.enqueue(neighbor.index);
      discoveredCount += 1;
      maxFrontierSize = Math.max(maxFrontierSize, queue.size);

      if (recordEvents) events.push({
        type: "discovered",
        coordinate: neighbor.coordinate,
        frontierSize: queue.size,
        values: {
          parent: coordinate,
          level: level + 1,
          discoveryOrder: discoveredCount,
        },
      });
    }

    if (recordEvents) events.push({ type: "closed", coordinate, frontierSize: queue.size });
  }

  const path = found ? reconstructPath(grid, parents, targetIndex) : [];
  return finishSearch({
    algorithm: "bfs",
    grid,
    found,
    path,
    discoveredCount,
    expandedCount,
    maxFrontierSize,
    events,
    recordEvents,
    startedAt,
    movement,
  });
}
