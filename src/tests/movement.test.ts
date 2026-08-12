import { describe, expect, it } from "vitest";
import { runAllAlgorithms } from "../algorithms";
import { bfs } from "../algorithms/bfs";
import {
  defaultHeuristicForMovement,
  isHeuristicCompatible,
  resolveHeuristicForMovement,
} from "../algorithms/heuristics";
import { createGrid, setTerrain } from "../core/grid";
import {
  DIAGONAL_COST,
  getNeighbors,
  movementCost,
} from "../core/neighbors";
import { createBoardSession, resetBoardSearch } from "../state/boardSession";
import { gridFromRows } from "./fixtures";

describe("grid movement", () => {
  it("returns only orthogonal neighbors in four-way mode", () => {
    const grid = createGrid(5, 5, { row: 2, col: 2 }, { row: 4, col: 4 });
    const neighbors = getNeighbors(grid, grid.start, { movementMode: "four-way" });

    expect(neighbors.map(({ coordinate }) => coordinate)).toEqual([
      { row: 1, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 2 },
      { row: 2, col: 1 },
    ]);
    expect(neighbors.every(({ step }) => !step.diagonal && step.distance === 1)).toBe(true);
  });

  it("adds deterministic diagonal neighbors in eight-way mode", () => {
    const grid = createGrid(5, 5, { row: 2, col: 2 }, { row: 4, col: 4 });
    const neighbors = getNeighbors(grid, grid.start, { movementMode: "eight-way" });

    expect(neighbors).toHaveLength(8);
    expect(neighbors.slice(4).map(({ coordinate }) => coordinate)).toEqual([
      { row: 1, col: 3 },
      { row: 3, col: 3 },
      { row: 3, col: 1 },
      { row: 1, col: 1 },
    ]);
    expect(neighbors.slice(4).every(({ step }) => step.distance === DIAGONAL_COST)).toBe(true);
  });

  it("respects bounds and walls", () => {
    let grid = createGrid(5, 5, { row: 0, col: 0 }, { row: 4, col: 4 });
    grid = setTerrain(grid, { row: 0, col: 1 }, "wall");

    expect(getNeighbors(grid, grid.start, { movementMode: "eight-way" })).toEqual([
      expect.objectContaining({ coordinate: { row: 1, col: 0 } }),
    ]);
  });

  it("blocks a diagonal unless both adjacent orthogonal cells are open", () => {
    const blocked = gridFromRows(["S#", "#T"]);
    const open = gridFromRows(["S.", ".T"]);

    expect(getNeighbors(blocked, blocked.start, { movementMode: "eight-way" })).toEqual([]);
    expect(
      getNeighbors(open, open.start, { movementMode: "eight-way" })
        .some(({ coordinate }) => coordinate.row === 1 && coordinate.col === 1),
    ).toBe(true);
  });

  it("keeps the corner policy extensible", () => {
    const grid = gridFromRows(["S#", "#T"]);
    expect(movementCost(grid, grid.start, grid.target, {
      movementMode: "eight-way",
      cornerPolicy: "allow-cutting",
    })).toBe(DIAGONAL_COST);
  });

  it("multiplies destination terrain cost by movement distance", () => {
    let grid = createGrid(5, 5, { row: 1, col: 1 }, { row: 4, col: 4 });
    grid = setTerrain(grid, { row: 2, col: 2 }, "mud");

    expect(movementCost(grid, { row: 1, col: 1 }, { row: 1, col: 2 }, {
      movementMode: "eight-way",
    })).toBe(1);
    expect(movementCost(grid, { row: 1, col: 1 }, { row: 2, col: 2 }, {
      movementMode: "eight-way",
    })).toBeCloseTo(3 * DIAGONAL_COST);
  });
});

describe("movement integration", () => {
  it("keeps BFS edge-based in eight-way mode", () => {
    const grid = gridFromRows(["S..", ".m.", "..T"]);
    const result = bfs(grid, { movementMode: "eight-way" });

    expect(result.pathLength).toBe(2);
    expect(result.pathCost).toBeCloseTo(4 * DIAGONAL_COST);
  });

  it("runs every comparison algorithm with the same movement mode", () => {
    const results = runAllAlgorithms(gridFromRows(["S..", "...", "..T"]), {
      movementMode: "eight-way",
      heuristic: "octile",
      recordEvents: false,
    });

    expect(Object.values(results).every((result) => result.movementMode === "eight-way")).toBe(true);
    expect(Object.values(results).every((result) => result.cornerPolicy === "no-cutting")).toBe(true);
  });

  it("resets search state without changing the board", () => {
    const grid = gridFromRows(["S..", "...", "..T"]);
    const result = bfs(grid);
    const session = {
      ...createBoardSession(grid, "Test"),
      activeResult: result,
      comparisonResults: { bfs: result },
    };

    const reset = resetBoardSearch(session);
    expect(reset.grid).toBe(grid);
    expect(reset.activeResult).toBeNull();
    expect(reset.comparisonResults).toEqual({});
  });

  it("defines movement-aware heuristic compatibility", () => {
    expect(defaultHeuristicForMovement("four-way")).toBe("manhattan");
    expect(defaultHeuristicForMovement("eight-way")).toBe("octile");
    expect(isHeuristicCompatible("manhattan", "eight-way")).toBe(false);
    expect(isHeuristicCompatible("euclidean", "eight-way")).toBe(true);
    expect(resolveHeuristicForMovement("manhattan", "eight-way")).toBe("octile");
    expect(resolveHeuristicForMovement("octile", "four-way")).toBe("manhattan");
  });
});
