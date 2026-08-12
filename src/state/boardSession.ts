import type { AlgorithmId, SearchResult } from "../algorithms/types";
import { createGrid } from "../core/grid";
import type { Coordinate, Grid } from "../core/types";

export type ComparisonResults = Partial<Record<AlgorithmId, SearchResult>>;

export interface BoardSession {
  grid: Grid;
  activeResult: SearchResult | null;
  comparisonResults: ComparisonResults;
  selectedCoordinate: Coordinate | null;
  scenarioLabel: string;
}

export function createBoardSession(grid: Grid, scenarioLabel: string): BoardSession {
  return {
    grid,
    activeResult: null,
    comparisonResults: {},
    selectedCoordinate: grid.start,
    scenarioLabel,
  };
}

export function replaceBoard(
  session: BoardSession,
  nextGrid: Grid,
  scenarioLabel: string,
): BoardSession {
  return {
    ...session,
    grid: nextGrid,
    activeResult: null,
    comparisonResults: {},
    selectedCoordinate: nextGrid.start,
    scenarioLabel,
  };
}

export function resetBoardSearch(session: BoardSession): BoardSession {
  return {
    ...session,
    activeResult: null,
    comparisonResults: {},
  };
}

export function resizeBoard(session: BoardSession, rows: number, cols: number): BoardSession {
  return replaceBoard(session, createGrid(rows, cols), `Custom · ${rows} × ${cols}`);
}
