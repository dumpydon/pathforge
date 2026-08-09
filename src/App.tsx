"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { runAlgorithm } from "./algorithms";
import type { AlgorithmId, HeuristicName, SearchResult } from "./algorithms/types";
import { GridBoard, type PaintTool } from "./components/Grid/GridBoard";
import { AlgorithmPanel } from "./components/Panels/AlgorithmPanel";
import { ComparisonPanel } from "./components/Panels/ComparisonPanel";
import { MetricsPanel } from "./components/Panels/MetricsPanel";
import { NodeInspector } from "./components/Panels/NodeInspector";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { clearTerrain, moveEndpoint, setTerrain } from "./core/grid";
import { coordinateKey, type Coordinate, type Grid, type Terrain } from "./core/types";
import { ALGORITHM_INFO, ALGORITHM_ORDER } from "./data/algorithmInfo";
import { usePlayback } from "./hooks/usePlayback";
import { randomObstacles } from "./mazes/random";
import { PRESETS, openFieldPreset, type PresetId } from "./mazes/presets";
import { recursiveDivision } from "./mazes/recursiveDivision";

type ComparisonResults = Partial<Record<AlgorithmId, SearchResult>>;

export default function App() {
  const [grid, setGrid] = useState<Grid>(openFieldPreset);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("astar");
  const [heuristic, setHeuristic] = useState<HeuristicName>("manhattan");
  const [paintTool, setPaintTool] = useState<PaintTool>("wall");
  const [activeResult, setActiveResult] = useState<SearchResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResults>({});
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(grid.start);
  const [scenarioLabel, setScenarioLabel] = useState("Open Field");
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
    setActiveResult(null);
  }, [resetPlayback]);

  const replaceGrid = useCallback(
    (nextGrid: Grid, label: string) => {
      setGrid(nextGrid);
      setScenarioLabel(label);
      setSelectedCoordinate(nextGrid.start);
      setComparisonResults({});
      clearSearch();
    },
    [clearSearch],
  );

  const runSelected = useCallback(() => {
    const result = runAlgorithm(algorithm, grid, { heuristic });
    setActiveResult(result);
    loadPlayback(result, true);
  }, [algorithm, grid, heuristic, loadPlayback]);

  const step = useCallback(() => {
    if (activeResult) {
      stepPlayback();
      return;
    }
    const result = runAlgorithm(algorithm, grid, { heuristic });
    setActiveResult(result);
    loadPlayback(result, false);
    stepPlayback();
  }, [activeResult, algorithm, grid, heuristic, loadPlayback, stepPlayback]);

  const runAll = useCallback(() => {
    const results: ComparisonResults = {};
    for (const id of ALGORITHM_ORDER) {
      results[id] = runAlgorithm(id, grid, { heuristic });
    }
    setComparisonResults(results);
    const selected = results[algorithm]!;
    setActiveResult(selected);
    loadPlayback(selected, false);
  }, [algorithm, grid, heuristic, loadPlayback]);

  const replay = useCallback(
    (id: AlgorithmId) => {
      const result = comparisonResults[id];
      if (!result) return;
      setAlgorithm(id);
      setActiveResult(result);
      loadPlayback(result, true);
    },
    [comparisonResults, loadPlayback],
  );

  const changeAlgorithm = useCallback(
    (nextAlgorithm: AlgorithmId) => {
      setAlgorithm(nextAlgorithm);
      clearSearch();
    },
    [clearSearch],
  );

  const paint = useCallback(
    (coordinate: Coordinate) => {
      const terrain: Terrain = paintTool === "erase" ? "normal" : paintTool;
      setGrid((currentGrid) => setTerrain(currentGrid, coordinate, terrain));
      setScenarioLabel("Custom board");
      setComparisonResults({});
      clearSearch();
    },
    [clearSearch, paintTool],
  );

  const moveGridEndpoint = useCallback(
    (endpoint: "start" | "target", coordinate: Coordinate) => {
      setGrid((currentGrid) => moveEndpoint(currentGrid, endpoint, coordinate));
      setScenarioLabel("Custom board");
      setComparisonResults({});
      clearSearch();
    },
    [clearSearch],
  );

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
        if (playback.isPlaying) pausePlayback();
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
  }, [activeResult, clearBoard, clearSearch, pausePlayback, playPlayback, playback.isPlaying, runSelected, step]);

  const selectedNode = selectedCoordinate
    ? playback.snapshot.nodes.get(coordinateKey(selectedCoordinate))
    : undefined;
  const hasWeightedTerrain = useMemo(
    () => grid.terrain.some((terrain) => terrain === "mud" || terrain === "water"),
    [grid.terrain],
  );
  const eventProgress = activeResult
    ? `${Math.min(playback.cursor, activeResult.events.length)} / ${activeResult.events.length}`
    : "0 / 0";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">PF</span>
          <div>
            <div className="brand-line">
              <h1>PathForge</h1>
              <span className="version-tag">v1.0</span>
            </div>
            <p>Interactive graph-search laboratory</p>
          </div>
        </div>
        <div className="topbar-context">
          <span>4-way movement</span>
          <span>non-negative weights</span>
          <a href="#comparison">comparison</a>
        </div>
      </header>

      <Toolbar
        algorithm={algorithm}
        heuristic={heuristic}
        paintTool={paintTool}
        isPlaying={playback.isPlaying}
        hasResult={Boolean(activeResult)}
        speed={playback.speed}
        onAlgorithmChange={changeAlgorithm}
        onHeuristicChange={setHeuristic}
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
      />

      <div className="workspace-meta">
        <div>
          <span className="meta-label">Scenario</span>
          <strong>{scenarioLabel}</strong>
          <span>{grid.rows} × {grid.cols} · {grid.rows * grid.cols} vertices</span>
        </div>
        <div className="playback-progress">
          <span className={`activity-dot ${playback.isPlaying ? "is-running" : ""}`} />
          <span>{playback.isPlaying ? "Playing" : playback.isComplete ? "Complete" : "Paused"}</span>
          <code>{eventProgress} events</code>
        </div>
      </div>

      <div className="workspace-layout">
        <section className="grid-workspace" aria-label="Grid workspace">
          <GridBoard
            grid={grid}
            snapshot={playback.snapshot}
            selectedCoordinate={selectedCoordinate}
            onInspect={setSelectedCoordinate}
            onPaint={paint}
            onMoveEndpoint={moveGridEndpoint}
          />
          <div className="workspace-note">
            <span>Drag S or T to reposition endpoints. Paint terrain with the active edit tool.</span>
            {hasWeightedTerrain && (algorithm === "bfs" || algorithm === "dfs") && (
              <strong>{ALGORITHM_INFO[algorithm].name} ignores terrain cost when choosing its path.</strong>
            )}
          </div>
        </section>

        <aside className="side-panel" aria-label="Algorithm details and run state">
          <AlgorithmPanel algorithm={algorithm} heuristic={heuristic} />
          <MetricsPanel result={activeResult} frontierSize={playback.snapshot.frontierSize} />
          <NodeInspector
            algorithm={algorithm}
            grid={grid}
            coordinate={selectedCoordinate}
            node={selectedNode}
          />
        </aside>
      </div>

      <div id="comparison">
        <ComparisonPanel
          results={comparisonResults}
          activeAlgorithm={algorithm}
          hasWeightedTerrain={hasWeightedTerrain}
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
