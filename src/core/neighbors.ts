import { isInBounds, terrainAt, terrainCost, toIndex } from "./grid";
import type { Coordinate, CornerPolicy, Grid, MovementMode } from "./types";

export const DIAGONAL_COST = Math.SQRT2;
export const DEFAULT_MOVEMENT_MODE: MovementMode = "four-way";
export const DEFAULT_CORNER_POLICY: CornerPolicy = "no-cutting";

export interface MovementStep {
  rowDelta: number;
  colDelta: number;
  distance: number;
  diagonal: boolean;
}

export interface GridNeighbor {
  coordinate: Coordinate;
  index: number;
  step: MovementStep;
  cost: number;
}

export interface MovementOptions {
  movementMode?: MovementMode;
  cornerPolicy?: CornerPolicy;
}

export interface ResolvedMovementOptions {
  movementMode: MovementMode;
  cornerPolicy: CornerPolicy;
}

// This order is shared by every algorithm so runs are deterministic.
const ORTHOGONAL_STEPS: readonly MovementStep[] = [
  { rowDelta: -1, colDelta: 0, distance: 1, diagonal: false },
  { rowDelta: 0, colDelta: 1, distance: 1, diagonal: false },
  { rowDelta: 1, colDelta: 0, distance: 1, diagonal: false },
  { rowDelta: 0, colDelta: -1, distance: 1, diagonal: false },
];

const DIAGONAL_STEPS: readonly MovementStep[] = [
  { rowDelta: -1, colDelta: 1, distance: DIAGONAL_COST, diagonal: true },
  { rowDelta: 1, colDelta: 1, distance: DIAGONAL_COST, diagonal: true },
  { rowDelta: 1, colDelta: -1, distance: DIAGONAL_COST, diagonal: true },
  { rowDelta: -1, colDelta: -1, distance: DIAGONAL_COST, diagonal: true },
];

const MOVEMENT_STEPS: Readonly<Record<MovementMode, readonly MovementStep[]>> = {
  "four-way": ORTHOGONAL_STEPS,
  "eight-way": [...ORTHOGONAL_STEPS, ...DIAGONAL_STEPS],
};

export function resolveMovementOptions(options: MovementOptions = {}): ResolvedMovementOptions {
  return {
    movementMode: options.movementMode ?? DEFAULT_MOVEMENT_MODE,
    cornerPolicy: options.cornerPolicy ?? DEFAULT_CORNER_POLICY,
  };
}

function isTraversable(grid: Grid, coordinate: Coordinate): boolean {
  return isInBounds(grid, coordinate) && terrainAt(grid, coordinate) !== "wall";
}

function diagonalIsOpen(
  grid: Grid,
  coordinate: Coordinate,
  step: MovementStep,
  cornerPolicy: CornerPolicy,
): boolean {
  if (!step.diagonal || cornerPolicy === "allow-cutting") return true;

  const rowAdjacent = { row: coordinate.row + step.rowDelta, col: coordinate.col };
  const colAdjacent = { row: coordinate.row, col: coordinate.col + step.colDelta };
  return isTraversable(grid, rowAdjacent) && isTraversable(grid, colAdjacent);
}

export function getNeighbors(
  grid: Grid,
  coordinate: Coordinate,
  options: MovementOptions = {},
): GridNeighbor[] {
  const { movementMode, cornerPolicy } = resolveMovementOptions(options);
  const neighbors: GridNeighbor[] = [];

  for (const step of MOVEMENT_STEPS[movementMode]) {
    const candidate = {
      row: coordinate.row + step.rowDelta,
      col: coordinate.col + step.colDelta,
    };
    if (!isTraversable(grid, candidate)) continue;
    if (!diagonalIsOpen(grid, coordinate, step, cornerPolicy)) continue;

    neighbors.push({
      coordinate: candidate,
      index: toIndex(grid, candidate),
      step,
      cost: step.distance * terrainCost(terrainAt(grid, candidate)),
    });
  }

  return neighbors;
}

export function movementCost(
  grid: Grid,
  from: Coordinate,
  to: Coordinate,
  options: MovementOptions = {},
): number | null {
  const neighbor = getNeighbors(grid, from, options).find(
    ({ coordinate }) => coordinate.row === to.row && coordinate.col === to.col,
  );
  return neighbor?.cost ?? null;
}

export function areNeighbors(
  grid: Grid,
  a: Coordinate,
  b: Coordinate,
  options: MovementOptions = {},
): boolean {
  return movementCost(grid, a, b, options) !== null;
}
