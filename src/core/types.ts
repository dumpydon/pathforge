export type Terrain = "normal" | "mud" | "water" | "wall";

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

export type Movement = "four-way";

export const TERRAIN_COST: Readonly<Record<Exclude<Terrain, "wall">, number>> = {
  normal: 1,
  mud: 3,
  water: 5,
};

export function coordinatesEqual(a: Coordinate, b: Coordinate): boolean {
  return a.row === b.row && a.col === b.col;
}

export function coordinateKey(coordinate: Coordinate): string {
  return `${coordinate.row}:${coordinate.col}`;
}

