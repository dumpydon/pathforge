import { describe, expect, it } from "vitest";
import { astar } from "../algorithms/astar";
import { bfs } from "../algorithms/bfs";
import { dijkstra } from "../algorithms/dijkstra";
import {
  clearTerrain,
  createCustomTerrain,
  createGrid,
  isCustomTerrain,
  setTerrain,
  terrainAt,
  terrainCost,
} from "../core/grid";
import { DIAGONAL_COST, movementCost } from "../core/neighbors";

const highCostCoordinate = { row: 2, col: 2 };

function customDetourGrid() {
  let grid = createGrid(5, 5, { row: 2, col: 0 }, { row: 2, col: 4 });
  for (const col of [1, 2, 3]) {
    grid = setTerrain(grid, { row: 2, col }, createCustomTerrain(10));
  }
  return grid;
}

describe("custom terrain domain", () => {
  it("keeps the preset terrain costs centralized", () => {
    expect(terrainCost("normal")).toBe(1);
    expect(terrainCost("mud")).toBe(3);
    expect(terrainCost("water")).toBe(5);
    expect(terrainCost("wall")).toBe(Number.POSITIVE_INFINITY);
  });

  it("accepts the minimum custom cost", () => {
    expect(createCustomTerrain(1)).toEqual({ type: "custom", cost: 1 });
  });

  it("accepts the maximum custom cost", () => {
    expect(createCustomTerrain(100)).toEqual({ type: "custom", cost: 100 });
  });

  it.each([0, -1, 101, Number.NaN, Number.POSITIVE_INFINITY, 1.5])(
    "rejects invalid custom cost %s",
    (cost) => {
      expect(() => createCustomTerrain(cost)).toThrow(/integer from 1 to 100/);
    },
  );

  it("retains an assigned custom cell cost", () => {
    const custom = createCustomTerrain(17);
    const grid = setTerrain(createGrid(5, 5), highCostCoordinate, custom);
    const terrain = terrainAt(grid, highCostCoordinate);

    expect(isCustomTerrain(terrain)).toBe(true);
    expect(terrainCost(terrain)).toBe(17);
  });

  it("erasing custom terrain restores normal traversal cost", () => {
    const painted = setTerrain(
      createGrid(5, 5),
      highCostCoordinate,
      createCustomTerrain(42),
    );
    const erased = setTerrain(painted, highCostCoordinate, "normal");

    expect(terrainAt(erased, highCostCoordinate)).toBe("normal");
    expect(terrainCost(terrainAt(erased, highCostCoordinate))).toBe(1);
  });

  it("clears custom terrain with the rest of the board", () => {
    const painted = setTerrain(
      createGrid(5, 5),
      highCostCoordinate,
      createCustomTerrain(42),
    );

    expect(terrainAt(clearTerrain(painted), highCostCoordinate)).toBe("normal");
  });
});

describe("custom terrain search behavior", () => {
  it("lets Dijkstra choose a longer route with lower total custom cost", () => {
    const result = dijkstra(customDetourGrid());

    expect(result.pathLength).toBe(6);
    expect(result.pathCost).toBe(6);
  });

  it("keeps BFS focused on fewer edges despite higher custom cost", () => {
    const result = bfs(customDetourGrid());

    expect(result.pathLength).toBe(4);
    expect(result.pathCost).toBe(31);
  });

  it("matches A* and Dijkstra on custom weights in four-way mode", () => {
    const grid = customDetourGrid();
    expect(astar(grid, { heuristic: "manhattan" }).pathCost).toBe(dijkstra(grid).pathCost);
  });

  it("matches A* and Dijkstra on custom weights in eight-way mode", () => {
    let grid = createGrid(5, 5, { row: 0, col: 0 }, { row: 4, col: 4 });
    grid = setTerrain(grid, { row: 1, col: 1 }, createCustomTerrain(20));
    grid = setTerrain(grid, { row: 2, col: 2 }, createCustomTerrain(12));
    const options = { movementMode: "eight-way", heuristic: "octile" } as const;

    expect(astar(grid, options).pathCost).toBeCloseTo(dijkstra(grid, options).pathCost!);
  });

  it("multiplies custom destination cost by diagonal distance", () => {
    let grid = createGrid(5, 5, { row: 1, col: 1 }, { row: 4, col: 4 });
    grid = setTerrain(grid, { row: 2, col: 2 }, createCustomTerrain(10));

    expect(movementCost(grid, { row: 2, col: 1 }, { row: 2, col: 2 })).toBe(10);
    expect(movementCost(
      grid,
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { movementMode: "eight-way" },
    )).toBeCloseTo(10 * DIAGONAL_COST);
  });
});
