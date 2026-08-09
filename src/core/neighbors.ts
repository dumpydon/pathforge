import { fromIndex, isInBounds, terrainAt, toIndex } from "./grid";
import type { Coordinate, Grid } from "./types";

// This order is shared by every algorithm so runs are deterministic.
const FOUR_WAY_OFFSETS: ReadonlyArray<Readonly<Coordinate>> = [
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
];

export function getNeighbors(grid: Grid, coordinate: Coordinate): Coordinate[] {
  const neighbors: Coordinate[] = [];

  for (const offset of FOUR_WAY_OFFSETS) {
    const candidate = {
      row: coordinate.row + offset.row,
      col: coordinate.col + offset.col,
    };
    if (isInBounds(grid, candidate) && terrainAt(grid, candidate) !== "wall") {
      neighbors.push(candidate);
    }
  }

  return neighbors;
}

export function getNeighborIndices(grid: Grid, index: number): number[] {
  return getNeighbors(grid, fromIndex(grid, index)).map((coordinate) => toIndex(grid, coordinate));
}

export function areNeighbors(grid: Grid, a: Coordinate, b: Coordinate): boolean {
  return getNeighbors(grid, a).some(
    (neighbor) => neighbor.row === b.row && neighbor.col === b.col,
  );
}

