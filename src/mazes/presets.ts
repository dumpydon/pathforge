import { createGrid, toIndex } from "../core/grid";
import type { Grid, Terrain } from "../core/types";
import { seededRandom } from "./random";

export type PresetId = "open" | "weighted" | "maze" | "dense" | "no-path";

export interface Preset {
  id: PresetId;
  name: string;
  description: string;
  create: () => Grid;
}

function withTerrain(grid: Grid, edits: Array<[number, number, Terrain]>): Grid {
  const terrain = grid.terrain.slice();
  for (const [row, col, value] of edits) {
    const coordinate = { row, col };
    if (
      (row === grid.start.row && col === grid.start.col) ||
      (row === grid.target.row && col === grid.target.col)
    ) {
      continue;
    }
    terrain[toIndex(grid, coordinate)] = value;
  }
  return { ...grid, terrain };
}

export function openFieldPreset(): Grid {
  return createGrid();
}

export function weightedDetourPreset(): Grid {
  const grid = createGrid();
  const edits: Array<[number, number, Terrain]> = [];
  for (let col = grid.start.col + 2; col < grid.target.col; col += 1) {
    edits.push([grid.start.row, col, col % 3 === 0 ? "water" : "mud"]);
  }
  for (let col = 11; col <= 27; col += 1) {
    if (col !== 19) edits.push([grid.start.row - 3, col, "wall"]);
  }
  return withTerrain(grid, edits);
}

export function narrowMazePreset(): Grid {
  const grid = createGrid(21, 39, { row: 1, col: 1 }, { row: 19, col: 37 });
  const edits: Array<[number, number, Terrain]> = [];
  for (let row = 0; row < grid.rows; row += 2) {
    const gap = row % 4 === 0 ? grid.cols - 3 : 2;
    for (let col = 0; col < grid.cols; col += 1) {
      if (Math.abs(col - gap) > 0) edits.push([row, col, "wall"]);
    }
  }
  return withTerrain(grid, edits);
}

export function denseObstaclesPreset(): Grid {
  const grid = createGrid(21, 39, { row: 1, col: 1 }, { row: 19, col: 37 });
  const random = seededRandom(0x50415448);
  const terrain = Array.from({ length: grid.rows * grid.cols }, (): Terrain =>
    random() < 0.31 ? "wall" : "normal",
  );

  // Keep one deterministic route so this preset measures search behavior, not luck.
  for (let col = 1; col <= 37; col += 1) terrain[1 * grid.cols + col] = "normal";
  for (let row = 1; row <= 19; row += 1) terrain[row * grid.cols + 37] = "normal";
  terrain[toIndex(grid, grid.start)] = "normal";
  terrain[toIndex(grid, grid.target)] = "normal";
  return { ...grid, terrain };
}

export function noPathPreset(): Grid {
  const grid = createGrid();
  const barrierCol = Math.floor(grid.cols / 2);
  const edits: Array<[number, number, Terrain]> = [];
  for (let row = 0; row < grid.rows; row += 1) edits.push([row, barrierCol, "wall"]);
  return withTerrain(grid, edits);
}

export const PRESETS: Preset[] = [
  { id: "open", name: "Open Field", description: "Heuristic guidance without obstacles", create: openFieldPreset },
  { id: "weighted", name: "Weighted Detour", description: "Fewest steps differs from lowest cost", create: weightedDetourPreset },
  { id: "maze", name: "Narrow Maze", description: "Deterministic corridor exploration", create: narrowMazePreset },
  { id: "dense", name: "Dense Obstacles", description: "Constrained search-space behavior", create: denseObstaclesPreset },
  { id: "no-path", name: "No Path", description: "Exhaustion and failure handling", create: noPathPreset },
];
