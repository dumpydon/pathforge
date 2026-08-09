import type { Coordinate } from "../core/types";
import type { HeuristicName } from "./types";

export type Heuristic = (from: Coordinate, target: Coordinate) => number;

export const manhattan: Heuristic = (from, target) =>
  Math.abs(from.row - target.row) + Math.abs(from.col - target.col);

export const euclidean: Heuristic = (from, target) =>
  Math.hypot(from.row - target.row, from.col - target.col);

export const zero: Heuristic = () => 0;

export function getHeuristic(name: HeuristicName): Heuristic {
  switch (name) {
    case "manhattan":
      return manhattan;
    case "euclidean":
      return euclidean;
    case "zero":
      return zero;
  }
}

