import { describe, expect, it } from "vitest";
import { dijkstra } from "../algorithms/dijkstra";
import { validatePath } from "../core/path";
import type { Grid } from "../core/types";
import { gridFromRows } from "./fixtures";

describe("Dijkstra", () => {
  it("chooses a longer geometric route with lower cost", () => {
    const grid = gridFromRows(["SwwwT", "....."]);
    const result = dijkstra(grid);

    expect(result.found).toBe(true);
    expect(result.pathLength).toBe(6);
    expect(result.pathCost).toBe(6);
    expect(validatePath(grid, result.path)).toBe(true);
  });

  it("reports an unreachable target", () => {
    const result = dijkstra(gridFromRows(["S#T", ".#."]));
    expect(result.found).toBe(false);
    expect(result.pathCost).toBeNull();
  });

  it("rejects invalid terrain instead of accepting an unknown cost", () => {
    const grid = gridFromRows(["ST"]);
    const invalid = { ...grid, terrain: ["normal", "lava"] } as unknown as Grid;
    expect(() => dijkstra(invalid)).toThrow(/Unsupported terrain/);
  });
});

