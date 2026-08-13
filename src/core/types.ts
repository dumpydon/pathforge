export const MIN_TERRAIN_COST = 1;
export const MAX_TERRAIN_COST = 100;
export const DEFAULT_CUSTOM_TERRAIN_COST = 10;

export const TERRAIN_COSTS = {
  normal: 1,
  mud: 3,
  water: 5,
} as const;

export type PresetTerrain = keyof typeof TERRAIN_COSTS;
export type TerrainKind = PresetTerrain | "custom" | "wall";

export interface CustomTerrain {
  readonly type: "custom";
  readonly cost: number;
}

export type Terrain = PresetTerrain | CustomTerrain | "wall";

export interface Coordinate {
  row: number;
  col: number;
}

export interface Grid {
  rows: number;
  cols: number;
  terrain: Terrain[];
  start: Coordinate;
  target: Coordinate;
}

export type MovementMode = "four-way" | "eight-way";
export type CornerPolicy = "no-cutting" | "allow-cutting";

export function coordinatesEqual(a: Coordinate, b: Coordinate): boolean {
  return a.row === b.row && a.col === b.col;
}

export function coordinateKey(coordinate: Coordinate): string {
  return `${coordinate.row}:${coordinate.col}`;
}
