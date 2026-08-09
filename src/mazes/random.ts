import { toIndex } from "../core/grid";
import type { Grid, Terrain } from "../core/types";

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

export function randomObstacles(grid: Grid, density = 0.27, seed = Date.now()): Grid {
  const random = seededRandom(seed);
  const startIndex = toIndex(grid, grid.start);
  const targetIndex = toIndex(grid, grid.target);
  const terrain = Array.from({ length: grid.rows * grid.cols }, (_, index): Terrain => {
    if (index === startIndex || index === targetIndex) return "normal";
    return random() < density ? "wall" : "normal";
  });

  return { ...grid, terrain };
}
