import {
  TERRAIN_COST,
  type Coordinate,
  type Grid,
  type Terrain,
} from "./types";

const DEFAULT_ROWS = 21;
const DEFAULT_COLS = 39;

export function createGrid(
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  start: Coordinate = { row: Math.floor(rows / 2), col: 5 },
  target: Coordinate = { row: Math.floor(rows / 2), col: cols - 6 },
): Grid {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) {
    throw new Error("Grid dimensions must be positive integers.");
  }

  const grid: Grid = {
    rows,
    cols,
    terrain: Array<Terrain>(rows * cols).fill("normal"),
    start,
    target,
  };

  assertValidGrid(grid);
  return grid;
}

export function assertValidGrid(grid: Grid): void {
  if (grid.terrain.length !== grid.rows * grid.cols) {
    throw new Error("Terrain length does not match the grid dimensions.");
  }

  if (!isInBounds(grid, grid.start) || !isInBounds(grid, grid.target)) {
    throw new Error("Start and target must be inside the grid.");
  }

  if (terrainAt(grid, grid.start) === "wall" || terrainAt(grid, grid.target) === "wall") {
    throw new Error("Start and target cannot be walls.");
  }

  for (const terrain of grid.terrain) {
    if (terrain !== "normal" && terrain !== "mud" && terrain !== "water" && terrain !== "wall") {
      throw new Error(`Unsupported terrain value: ${String(terrain)}`);
    }
  }
}

export function isInBounds(grid: Pick<Grid, "rows" | "cols">, coordinate: Coordinate): boolean {
  return (
    coordinate.row >= 0 &&
    coordinate.row < grid.rows &&
    coordinate.col >= 0 &&
    coordinate.col < grid.cols
  );
}

export function toIndex(grid: Pick<Grid, "cols">, coordinate: Coordinate): number {
  return coordinate.row * grid.cols + coordinate.col;
}

export function fromIndex(grid: Pick<Grid, "cols">, index: number): Coordinate {
  return { row: Math.floor(index / grid.cols), col: index % grid.cols };
}

export function terrainAt(grid: Grid, coordinate: Coordinate): Terrain {
  if (!isInBounds(grid, coordinate)) {
    throw new Error(`Coordinate (${coordinate.row}, ${coordinate.col}) is outside the grid.`);
  }
  return grid.terrain[toIndex(grid, coordinate)];
}

export function terrainCost(terrain: Terrain): number {
  if (terrain === "wall") {
    return Number.POSITIVE_INFINITY;
  }

  const cost = TERRAIN_COST[terrain];
  if (cost < 0) {
    throw new Error("Negative terrain costs are unsupported.");
  }
  return cost;
}

export function traversalCost(grid: Grid, destination: Coordinate): number {
  return terrainCost(terrainAt(grid, destination));
}

export function setTerrain(grid: Grid, coordinate: Coordinate, terrain: Terrain): Grid {
  if (!isInBounds(grid, coordinate)) return grid;
  if (
    (coordinate.row === grid.start.row && coordinate.col === grid.start.col) ||
    (coordinate.row === grid.target.row && coordinate.col === grid.target.col)
  ) {
    return grid;
  }

  const index = toIndex(grid, coordinate);
  if (grid.terrain[index] === terrain) return grid;

  const nextTerrain = grid.terrain.slice();
  nextTerrain[index] = terrain;
  return { ...grid, terrain: nextTerrain };
}

export function moveEndpoint(grid: Grid, endpoint: "start" | "target", coordinate: Coordinate): Grid {
  if (!isInBounds(grid, coordinate)) return grid;

  const terrain = grid.terrain.slice();
  terrain[toIndex(grid, coordinate)] = "normal";
  return { ...grid, terrain, [endpoint]: coordinate };
}

export function clearTerrain(grid: Grid): Grid {
  return { ...grid, terrain: Array<Terrain>(grid.rows * grid.cols).fill("normal") };
}

