import type { Grid, Terrain } from "../core/types";

export function gridFromRows(rows: string[]): Grid {
  if (rows.length === 0 || rows.some((row) => row.length !== rows[0].length)) {
    throw new Error("Fixture rows must form a non-empty rectangle.");
  }

  let start: Grid["start"] | undefined;
  let target: Grid["target"] | undefined;
  const terrain: Terrain[] = [];

  rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, colIndex) => {
      switch (cell) {
        case "S":
          start = { row: rowIndex, col: colIndex };
          terrain.push("normal");
          break;
        case "T":
          target = { row: rowIndex, col: colIndex };
          terrain.push("normal");
          break;
        case "#":
          terrain.push("wall");
          break;
        case "m":
          terrain.push("mud");
          break;
        case "w":
          terrain.push("water");
          break;
        case ".":
          terrain.push("normal");
          break;
        default:
          throw new Error(`Unsupported fixture token: ${cell}`);
      }
    });
  });

  if (!start || !target) throw new Error("Fixture must include S and T.");
  return { rows: rows.length, cols: rows[0].length, terrain, start, target };
}

