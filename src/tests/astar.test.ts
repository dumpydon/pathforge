import { describe, expect, it } from "vitest";
import { astar } from "../algorithms/astar";
import { dijkstra } from "../algorithms/dijkstra";
import { createGrid } from "../core/grid";
import { calculatePathCost, validatePath } from "../core/path";
import type { Grid, Terrain } from "../core/types";
import { gridFromRows } from "./fixtures";

describe("A*", () => {
  it("matches Dijkstra's optimal cost on an open field", () => {
    const grid = gridFromRows(["S....", ".....", "....T"]);
    const aStarResult = astar(grid, { heuristic: "manhattan" });
    const dijkstraResult = dijkstra(grid);

    expect(aStarResult.pathCost).toBe(dijkstraResult.pathCost);
    expect(validatePath(grid, aStarResult.path)).toBe(true);
  });

  it("matches Dijkstra around obstacles and weights", () => {
    const grid = gridFromRows(["Swww..", ".###m.", ".....T"]);
    const aStarResult = astar(grid, { heuristic: "euclidean" });
    const dijkstraResult = dijkstra(grid);
    expect(aStarResult.pathCost).toBe(dijkstraResult.pathCost);
  });

  it("behaves like Dijkstra when h is zero", () => {
    const grid = gridFromRows(["Smm..", ".##w.", "....T"]);
    expect(astar(grid, { heuristic: "zero" }).pathCost).toBe(dijkstra(grid).pathCost);
  });

  it("reports an unreachable target", () => {
    const result = astar(gridFromRows(["S#T", ".#."]));
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
  });

  it("handles start equal to target", () => {
    const grid = createGrid(1, 1, { row: 0, col: 0 }, { row: 0, col: 0 });
    const result = astar(grid);
    expect(result.path).toEqual([{ row: 0, col: 0 }]);
    expect(result.pathCost).toBe(0);
  });
});

describe("seeded weighted-grid verification", () => {
  function makePrng(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    };
  }

  function randomGrid(seed: number): Grid {
    const random = makePrng(seed);
    const rows = 6;
    const cols = 7;
    const terrain = Array.from({ length: rows * cols }, (): Terrain => {
      const value = random();
      if (value < 0.18) return "wall";
      if (value < 0.36) return "mud";
      if (value < 0.46) return "water";
      return "normal";
    });
    terrain[0] = "normal";
    terrain[terrain.length - 1] = "normal";
    return {
      rows,
      cols,
      terrain,
      start: { row: 0, col: 0 },
      target: { row: rows - 1, col: cols - 1 },
    };
  }

  it("matches Dijkstra and returns valid paths across deterministic random maps", () => {
    let reachableCases = 0;

    for (let seed = 1; seed <= 60; seed += 1) {
      const grid = randomGrid(seed);
      const dijkstraResult = dijkstra(grid);
      const aStarResult = astar(grid, { heuristic: "manhattan" });

      expect(aStarResult.found).toBe(dijkstraResult.found);
      if (!dijkstraResult.found) continue;

      reachableCases += 1;
      expect(aStarResult.pathCost).toBe(dijkstraResult.pathCost);
      expect(validatePath(grid, aStarResult.path)).toBe(true);
      expect(calculatePathCost(grid, aStarResult.path)).toBe(aStarResult.pathCost);
    }

    expect(reachableCases).toBeGreaterThan(20);
  });
});
