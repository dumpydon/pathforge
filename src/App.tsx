"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runAlgorithm, runAllAlgorithms } from "./algorithms";
import type { AlgorithmId, HeuristicName } from "./algorithms/types";
import {
  isHeuristicCompatible,
  resolveHeuristicForMovement,
} from "./algorithms/heuristics";
import { PathForgeLogo } from "./components/Brand/PathForgeLogo";
import { BenchmarkGrid } from "./components/Grid/BenchmarkGrid";
import { GridBoard, type PaintTool } from "./components/Grid/GridBoard";
import { AlgorithmPanel } from "./components/Panels/AlgorithmPanel";
import { ComparisonPanel } from "./components/Panels/ComparisonPanel";
import { MetricsPanel } from "./components/Panels/MetricsPanel";
import { NodeInspector } from "./components/Panels/NodeInspector";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { clearTerrain, moveEndpoint, setTerrain } from "./core/grid";
import { isBenchmarkGrid } from "./core/gridDimensions";
import {
  coordinateKey,
  type Coordinate,
  type Grid,
  type MovementMode,
  type Terrain,
} from "./core/types";
import { ALGORITHM_INFO } from "./data/algorithmInfo";
import { usePlayback } from "./hooks/usePlayback";
import { randomObstacles } from "./mazes/random";
import { PRESETS, openFieldPreset, type PresetId } from "./mazes/presets";
import { recursiveDivision } from "./mazes/recursiveDivision";
import {
  createBoardSession,
  replaceBoard,
  resetBoardSearch,
  resizeBoard,
  type ComparisonResults,
} from "./state/boardSession";

export default function App() {
  const [session, setSession] = useState(() =>
    createBoardSession(openFieldPreset(), "Random obstacles"),
  );
  const [isInitialGridReady, setIsInitialGridReady] = useState(false);
  const hasGeneratedInitialGrid = useRef(false);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("astar");
  const [heuristic, setHeuristic] = useState<HeuristicName>("manhattan");
  const [movementMode, setMovementMode] = useState<MovementMode>("four-way");
  const [paintTool, setPaintTool] = useState<PaintTool>("wall");

  useEffect(() => {
    if (hasGeneratedInitialGrid.current) return;
    hasGeneratedInitialGrid.current = true;

    const initialGrid = randomObstacles(openFieldPreset());
    setSession(createBoardSession(initialGrid, "Random obstacles"));
    setIsInitialGridReady(true);
  }, []);

  const { grid, activeResult, comparisonResults, selectedCoordinate, scenarioLabel } = session;
  const benchmarkMode = isBenchmarkGrid(grid);
  const playback = usePlayback(activeResult);
  const {
    load: loadPlayback,
    pause: pausePlayback,
    play: playPlayback,
    reset: resetPlayback,
    setSpeed: setPlaybackSpeed,
    step: stepPlayback,
  } = playback;

  const clearSearch = useCallback(() => {
    resetPlayback();
    setSession((current) => ({ ...current, activeResult: null }));
  }, [resetPlayback]);

  const replaceGrid = useCallback(
    (nextGrid: Grid, label: string) => {
      resetPlayback();
      setSession((current) => replaceBoard(current, nextGrid, label));
    },
    [resetPlayback],
  );

  const activateResult = useCallback(
    (result: ReturnType<typeof runAlgorithm>, autoplay: boolean) => {
      setSession((current) => ({ ...current, activeResult: result }));
      if (benchmarkMode) resetPlayback();
      else loadPlayback(result, autoplay);
    },
    [benchmarkMode, loadPlayback, resetPlayback],
  );

  const runSelected = useCallback(() => {
    const result = runAlgorithm(algorithm, grid, {
      heuristic,
      movementMode,
      recordEvents: !benchmarkMode,
    });
    activateResult(result, true);
  }, [activateResult, algorithm, benchmarkMode, grid, heuristic, movementMode]);

  const step = useCallback(() => {
    if (benchmarkMode) return;
    if (activeResult) {
      stepPlayback();
      return;
    }
    const result = runAlgorithm(algorithm, grid, {
      heuristic,
      movementMode,
      recordEvents: true,
    });
    setSession((current) => ({ ...current, activeResult: result }));
    loadPlayback(result, false);
    stepPlayback();
  }, [activeResult, algorithm, benchmarkMode, grid, heuristic, loadPlayback, movementMode, stepPlayback]);

  const runAll = useCallback(() => {
    const results: ComparisonResults = runAllAlgorithms(grid, {
      heuristic,
      movementMode,
      recordEvents: !benchmarkMode,
    });
    const selected = results[algorithm]!;
    setSession((current) => ({ ...current, comparisonResults: results, activeResult: selected }));
    if (benchmarkMode) resetPlayback();
    else loadPlayback(selected, false);
  }, [algorithm, benchmarkMode, grid, heuristic, loadPlayback, movementMode, resetPlayback]);

  const replay = useCallback(
    (id: AlgorithmId) => {
      const result = comparisonResults[id];
      if (!result) return;
      setAlgorithm(id);
      activateResult(result, true);
    },
    [activateResult, comparisonResults],
  );

  const changeAlgorithm = useCallback(
    (nextAlgorithm: AlgorithmId) => {
      setAlgorithm(nextAlgorithm);
      clearSearch();
    },
    [clearSearch],
  );

  const changeHeuristic = useCallback((nextHeuristic: HeuristicName) => {
    if (isHeuristicCompatible(nextHeuristic, movementMode)) setHeuristic(nextHeuristic);
  }, [movementMode]);

  const changeMovementMode = useCallback((nextMovementMode: MovementMode) => {
    if (nextMovementMode === movementMode) return;

    resetPlayback();
    setMovementMode(nextMovementMode);
    setHeuristic((current) => resolveHeuristicForMovement(current, nextMovementMode));
    setSession(resetBoardSearch);
  }, [movementMode, resetPlayback]);

  const paint = useCallback(
    (coordinate: Coordinate) => {
      const terrain: Terrain = paintTool === "erase" ? "normal" : paintTool;
      resetPlayback();
      setSession((current) => ({
        ...current,
        grid: setTerrain(current.grid, coordinate, terrain),
        scenarioLabel: "Custom board",
        comparisonResults: {},
        activeResult: null,
      }));
    },
    [paintTool, resetPlayback],
  );

  const moveGridEndpoint = useCallback(
    (endpoint: "start" | "target", coordinate: Coordinate) => {
      resetPlayback();
      setSession((current) => ({
        ...current,
        grid: moveEndpoint(current.grid, endpoint, coordinate),
        selectedCoordinate: coordinate,
        scenarioLabel: "Custom board",
        comparisonResults: {},
        activeResult: null,
      }));
    },
    [resetPlayback],
  );

  const inspectCoordinate = useCallback((coordinate: Coordinate) => {
    setSession((current) => ({ ...current, selectedCoordinate: coordinate }));
  }, []);

  const resizeGrid = useCallback((rows: number, cols: number) => {
    resetPlayback();
    setSession((current) => resizeBoard(current, rows, cols));
  }, [resetPlayback]);

  const clearBoard = useCallback(() => {
    replaceGrid(clearTerrain(grid), "Open field");
  }, [grid, replaceGrid]);

  const loadPreset = useCallback(
    (id: PresetId) => {
      const preset = PRESETS.find((candidate) => candidate.id === id);
      if (preset) replaceGrid(preset.create(), preset.name);
    },
    [replaceGrid],
  );

  const generateRandom = useCallback(() => {
    replaceGrid(randomObstacles(clearTerrain(grid)), "Random obstacles");
  }, [grid, replaceGrid]);

  const generateDivisionMaze = useCallback(() => {
    replaceGrid(recursiveDivision(clearTerrain(grid)), "Recursive division");
  }, [grid, replaceGrid]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;

      if (event.code === "Space") {
        event.preventDefault();
        if (benchmarkMode) runSelected();
        else if (playback.isPlaying) pausePlayback();
        else if (activeResult) playPlayback();
        else runSelected();
      } else if (event.key.toLowerCase() === "r") {
        clearSearch();
      } else if (event.key.toLowerCase() === "c") {
        clearBoard();
      } else if (event.key.toLowerCase() === "s") {
        step();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [activeResult, benchmarkMode, clearBoard, clearSearch, pausePlayback, playPlayback, playback.isPlaying, runSelected, step]);

  const selectedNode = selectedCoordinate
    ? playback.snapshot.nodes.get(coordinateKey(selectedCoordinate))
    : undefined;
  const hasWeightedTerrain = useMemo(
    () => grid.terrain.some((terrain) => terrain === "mud" || terrain === "water"),
    [grid.terrain],
  );
  const eventProgress = benchmarkMode
    ? "not recorded"
    : activeResult
    ? `${Math.min(playback.cursor, activeResult.events.length)} / ${activeResult.events.length}`
    : "0 / 0";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <PathForgeLogo />
          <div>
            <div className="brand-line">
              <h1 className="pathforge-wordmark">PathForge</h1>
              <span className="version-tag">v1.0</span>
            </div>
            <p>Interactive graph-search laboratory</p>
          </div>
        </div>
        <div className="topbar-context">
          <div className="movement-control" aria-label="Movement">
            <span>Movement</span>
            <div className="movement-toggle">
              {(["four-way", "eight-way"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={movementMode === mode ? "is-active" : ""}
                  aria-pressed={movementMode === mode}
                  onClick={() => changeMovementMode(mode)}
                >
                  {mode === "four-way" ? "4-way" : "8-way"}
                </button>
              ))}
            </div>
          </div>
          <span className="topbar-meta">non-negative weights</span>
          <a href="#comparison">comparison</a>
        </div>
      </header>

      <Toolbar
        algorithm={algorithm}
        heuristic={heuristic}
        movementMode={movementMode}
        paintTool={paintTool}
        isPlaying={playback.isPlaying}
        hasResult={Boolean(activeResult)}
        playbackEnabled={!benchmarkMode}
        editingEnabled={!benchmarkMode}
        rows={grid.rows}
        cols={grid.cols}
        speed={playback.speed}
        onAlgorithmChange={changeAlgorithm}
        onHeuristicChange={changeHeuristic}
        onPaintToolChange={setPaintTool}
        onRun={runSelected}
        onPause={pausePlayback}
        onResume={playPlayback}
        onStep={step}
        onReset={clearSearch}
        onClear={clearBoard}
        onRunAll={runAll}
        onPreset={loadPreset}
        onRandom={generateRandom}
        onRecursiveDivision={generateDivisionMaze}
        onSpeedChange={setPlaybackSpeed}
        onResize={resizeGrid}
      />

      <div className="workspace-meta">
        <div>
          <span className="meta-label">Scenario</span>
          <strong>{scenarioLabel}</strong>
          <span>{grid.rows} × {grid.cols} · {grid.rows * grid.cols} vertices</span>
        </div>
        <div className="playback-progress">
          <span className={`activity-dot ${playback.isPlaying ? "is-running" : ""}`} />
          <span>{benchmarkMode ? "Benchmark" : playback.isPlaying ? "Playing" : playback.isComplete ? "Complete" : "Paused"}</span>
          <code>{eventProgress} events</code>
        </div>
      </div>

      <div className="workspace-layout">
        <section className="grid-workspace" aria-label="Grid workspace">
          {benchmarkMode && (
            <div className="benchmark-notice" role="status">
              <strong>Large grid — benchmark mode enabled.</strong>
              <span>Event playback and cell-level editing are disabled to avoid excessive rendering and event-history overhead.</span>
            </div>
          )}
          <div
            className={`initial-grid-stage${isInitialGridReady ? "" : " is-pending"}`}
            aria-busy={!isInitialGridReady}
          >
            {benchmarkMode ? (
              <BenchmarkGrid
                grid={grid}
                result={activeResult}
                selectedCoordinate={selectedCoordinate}
                onInspect={inspectCoordinate}
              />
            ) : (
              <GridBoard
                grid={grid}
                snapshot={playback.snapshot}
                selectedCoordinate={selectedCoordinate}
                onInspect={inspectCoordinate}
                onPaint={paint}
                onMoveEndpoint={moveGridEndpoint}
              />
            )}
          </div>
          <div className="workspace-note">
            <span>{benchmarkMode
              ? "Canvas overview shows terrain, endpoints, and the final path. Use generators to create large benchmark maps."
              : "Drag S or T to reposition endpoints. Paint terrain with the active edit tool."}</span>
            {hasWeightedTerrain && (algorithm === "bfs" || algorithm === "dfs") && (
              <strong>{ALGORITHM_INFO[algorithm].name} ignores terrain cost when choosing its path.</strong>
            )}
          </div>
        </section>

        <aside className="side-panel" aria-label="Algorithm details and run state">
          <AlgorithmPanel
            algorithm={algorithm}
            heuristic={heuristic}
            movementMode={movementMode}
          />
          <MetricsPanel
            result={activeResult}
            frontierSize={playback.snapshot.frontierSize}
            playbackEnabled={!benchmarkMode}
          />
          <NodeInspector
            algorithm={algorithm}
            grid={grid}
            coordinate={selectedCoordinate}
            node={selectedNode}
            playbackEnabled={!benchmarkMode}
          />
        </aside>
      </div>

      <div id="comparison">
        <ComparisonPanel
          results={comparisonResults}
          activeAlgorithm={algorithm}
          hasWeightedTerrain={hasWeightedTerrain}
          playbackEnabled={!benchmarkMode}
          onReplay={replay}
        />
      </div>

      <footer className="app-footer">
        <p>Execution timing excludes animation and rendering. On small browser workloads, expanded-node counts are usually the more useful comparison.</p>
        <div className="shortcut-list" aria-label="Keyboard shortcuts">
          <span><kbd>Space</kbd> run / pause</span>
          <span><kbd>S</kbd> step</span>
          <span><kbd>R</kbd> reset</span>
          <span><kbd>C</kbd> clear</span>
        </div>
      </footer>
    </main>
  );
}
