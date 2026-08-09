import { describe, expect, it } from "vitest";
import { bfs } from "../algorithms/bfs";
import { createGrid } from "../core/grid";
import { validatePath } from "../core/path";
import { gridFromRows } from "./fixtures";

describe("BFS", () => {
  it("returns a shortest route on an unweighted grid", () => {
    const grid = gridFromRows(["S...", ".##.", "...T"]);
    const result = bfs(grid);

    expect(result.found).toBe(true);
    expect(result.pathLength).toBe(5);
    expect(result.pathCost).toBe(5);
    expect(validatePath(grid, result.path)).toBe(true);
  });

  it("routes around obstacles", () => {
    const grid = gridFromRows(["S#T", "..."]);
    const result = bfs(grid);
    expect(result.pathLength).toBe(4);
    expect(validatePath(grid, result.path)).toBe(true);
  });

  it("reports an unreachable target", () => {
    const result = bfs(gridFromRows(["S#T", ".#."]));
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.pathCost).toBeNull();
  });

  it("handles start equal to target", () => {
    const grid = createGrid(1, 1, { row: 0, col: 0 }, { row: 0, col: 0 });
    const result = bfs(grid);
    expect(result.found).toBe(true);
    expect(result.pathLength).toBe(0);
    expect(result.pathCost).toBe(0);
  });
});

