import { describe, expect, it } from "vitest";
import { bfs } from "../algorithms/bfs";
import { terrainAt } from "../core/grid";
import { PRESETS, openFieldPreset } from "../mazes/presets";
import { randomObstacles } from "../mazes/random";
import { recursiveDivision } from "../mazes/recursiveDivision";

describe("board generators", () => {
  it("creates deterministic presets with traversable endpoints", () => {
    for (const preset of PRESETS) {
      const first = preset.create();
      const second = preset.create();
      expect(first).toEqual(second);
      expect(terrainAt(first, first.start)).not.toBe("wall");
      expect(terrainAt(first, first.target)).not.toBe("wall");
    }
  });

  it("uses the random seed deterministically", () => {
    const grid = openFieldPreset();
    expect(randomObstacles(grid, 0.25, 1234)).toEqual(randomObstacles(grid, 0.25, 1234));
  });

  it("recursive division keeps a connected route between endpoints", () => {
    const maze = recursiveDivision(openFieldPreset(), 42);
    expect(bfs(maze).found).toBe(true);
  });
});

