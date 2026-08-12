import type { Coordinate } from "../core/types";
import type { MovementMode } from "../core/types";
import { DIAGONAL_COST } from "../core/neighbors";
import type { HeuristicName } from "./types";

export type Heuristic = (from: Coordinate, target: Coordinate) => number;

export const manhattan: Heuristic = (from, target) =>
  Math.abs(from.row - target.row) + Math.abs(from.col - target.col);

export const euclidean: Heuristic = (from, target) =>
  Math.hypot(from.row - target.row, from.col - target.col);

export const octile: Heuristic = (from, target) => {
  const rowDistance = Math.abs(from.row - target.row);
  const colDistance = Math.abs(from.col - target.col);
  const shorterDistance = Math.min(rowDistance, colDistance);
  return Math.max(rowDistance, colDistance) + (DIAGONAL_COST - 1) * shorterDistance;
};

export const zero: Heuristic = () => 0;

const COMPATIBLE_HEURISTICS: Readonly<Record<MovementMode, readonly HeuristicName[]>> = {
  "four-way": ["manhattan", "euclidean", "zero"],
  "eight-way": ["octile", "euclidean", "zero"],
};

export const HEURISTIC_LABELS: Readonly<Record<HeuristicName, string>> = {
  manhattan: "Manhattan",
  euclidean: "Euclidean",
  octile: "Octile",
  zero: "Zero",
};

export function selectableHeuristics(movementMode: MovementMode): readonly HeuristicName[] {
  return COMPATIBLE_HEURISTICS[movementMode].filter((heuristic) => heuristic !== "zero");
}

export function defaultHeuristicForMovement(movementMode: MovementMode): HeuristicName {
  return movementMode === "four-way" ? "manhattan" : "octile";
}

export function isHeuristicCompatible(
  heuristic: HeuristicName,
  movementMode: MovementMode,
): boolean {
  return COMPATIBLE_HEURISTICS[movementMode].includes(heuristic);
}

export function resolveHeuristicForMovement(
  heuristic: HeuristicName,
  movementMode: MovementMode,
): HeuristicName {
  return isHeuristicCompatible(heuristic, movementMode)
    ? heuristic
    : defaultHeuristicForMovement(movementMode);
}

export function getHeuristic(name: HeuristicName): Heuristic {
  switch (name) {
    case "manhattan":
      return manhattan;
    case "euclidean":
      return euclidean;
    case "octile":
      return octile;
    case "zero":
      return zero;
  }
}
