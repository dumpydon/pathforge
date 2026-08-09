import { describe, expect, it } from "vitest";
import { dfs } from "../algorithms/dfs";
import { validatePath } from "../core/path";
import { gridFromRows } from "./fixtures";

describe("DFS", () => {
  it("finds a reachable target", () => {
    const grid = gridFromRows(["S...", ".##.", "...T"]);
    const result = dfs(grid);
    expect(result.found).toBe(true);
    expect(validatePath(grid, result.path)).toBe(true);
  });

  it("terminates on a cyclic open grid", () => {
    const grid = gridFromRows(["S..", "...", "..T"]);
    const result = dfs(grid);
    expect(result.found).toBe(true);
    expect(result.expandedCount).toBeLessThanOrEqual(9);
  });

  it("reports an unreachable target", () => {
    const result = dfs(gridFromRows(["S#T", ".#."]));
    expect(result.found).toBe(false);
    expect(result.expandedCount).toBe(2);
  });
});

