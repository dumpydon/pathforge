import { fromIndex, terrainAt } from "./grid";
import { areNeighbors, movementCost, type MovementOptions } from "./neighbors";
import { coordinatesEqual, type Coordinate, type Grid } from "./types";

export function reconstructPath(
  grid: Grid,
  parents: ReadonlyMap<number, number>,
  targetIndex: number,
): Coordinate[] {
  const path: Coordinate[] = [];
  let current: number | undefined = targetIndex;

  while (current !== undefined) {
    path.push(fromIndex(grid, current));
    current = parents.get(current);
  }

  return path.reverse();
}

export function calculatePathCost(
  grid: Grid,
  path: readonly Coordinate[],
  movement: MovementOptions = {},
): number {
  let cost = 0;
  for (let index = 1; index < path.length; index += 1) {
    const stepCost = movementCost(grid, path[index - 1], path[index], movement);
    if (stepCost === null) return Number.POSITIVE_INFINITY;
    cost += stepCost;
  }
  return cost;
}

export function validatePath(
  grid: Grid,
  path: readonly Coordinate[],
  movement: MovementOptions = {},
): boolean {
  if (path.length === 0) return false;
  if (!coordinatesEqual(path[0], grid.start)) return false;
  if (!coordinatesEqual(path[path.length - 1], grid.target)) return false;

  for (let index = 0; index < path.length; index += 1) {
    if (terrainAt(grid, path[index]) === "wall") return false;
    if (index > 0 && !areNeighbors(grid, path[index - 1], path[index], movement)) return false;
  }

  return true;
}
