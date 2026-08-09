import { toIndex } from "../core/grid";
import type { Grid, Terrain } from "../core/types";
import { seededRandom } from "./random";

type Orientation = "horizontal" | "vertical";

function randomStepped(
  random: () => number,
  minimum: number,
  maximum: number,
  step: number,
): number {
  const optionCount = Math.floor((maximum - minimum) / step) + 1;
  return minimum + Math.floor(random() * optionCount) * step;
}

function chooseOrientation(height: number, width: number, random: () => number): Orientation {
  if (height > width) return "horizontal";
  if (width > height) return "vertical";
  return random() < 0.5 ? "horizontal" : "vertical";
}

export function recursiveDivision(grid: Grid, seed = Date.now()): Grid {
  const random = seededRandom(seed);
  const terrain = Array<Terrain>(grid.rows * grid.cols).fill("normal");
  const endpointIndices = new Set([toIndex(grid, grid.start), toIndex(grid, grid.target)]);

  const addWall = (row: number, col: number): void => {
    const index = row * grid.cols + col;
    if (!endpointIndices.has(index)) terrain[index] = "wall";
  };

  for (let row = 0; row < grid.rows; row += 1) {
    addWall(row, 0);
    addWall(row, grid.cols - 1);
  }
  for (let col = 0; col < grid.cols; col += 1) {
    addWall(0, col);
    addWall(grid.rows - 1, col);
  }

  const divide = (
    top: number,
    bottom: number,
    left: number,
    right: number,
    orientation: Orientation,
  ): void => {
    const height = bottom - top + 1;
    const width = right - left + 1;
    if (height < 3 || width < 3) return;

    if (orientation === "horizontal") {
      const wallRow = randomStepped(random, top + 1, bottom - 1, 2);
      const gapCol = randomStepped(random, left, right, 2);
      for (let col = left; col <= right; col += 1) {
        if (col !== gapCol) addWall(wallRow, col);
      }
      divide(top, wallRow - 1, left, right, chooseOrientation(wallRow - top, width, random));
      divide(
        wallRow + 1,
        bottom,
        left,
        right,
        chooseOrientation(bottom - wallRow, width, random),
      );
    } else {
      const wallCol = randomStepped(random, left + 1, right - 1, 2);
      const gapRow = randomStepped(random, top, bottom, 2);
      for (let row = top; row <= bottom; row += 1) {
        if (row !== gapRow) addWall(row, wallCol);
      }
      divide(top, bottom, left, wallCol - 1, chooseOrientation(height, wallCol - left, random));
      divide(
        top,
        bottom,
        wallCol + 1,
        right,
        chooseOrientation(height, right - wallCol, random),
      );
    }
  };

  divide(1, grid.rows - 2, 1, grid.cols - 2, chooseOrientation(grid.rows, grid.cols, random));
  terrain[toIndex(grid, grid.start)] = "normal";
  terrain[toIndex(grid, grid.target)] = "normal";
  return { ...grid, terrain };
}
