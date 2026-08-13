"use client";

import { useState } from "react";
import type { AlgorithmId, HeuristicName } from "../../algorithms/types";
import { HEURISTIC_LABELS, selectableHeuristics } from "../../algorithms/heuristics";
import { isValidTerrainCost } from "../../core/grid";
import {
  MAX_TERRAIN_COST,
  MIN_TERRAIN_COST,
  type MovementMode,
} from "../../core/types";
import { ALGORITHM_INFO, ALGORITHM_ORDER } from "../../data/algorithmInfo";
import type { PresetId } from "../../mazes/presets";
import type { PaintTool } from "../Grid/GridBoard";
import { GridSizeControls } from "./GridSizeControls";

interface ToolbarProps {
  algorithm: AlgorithmId;
  heuristic: HeuristicName;
  movementMode: MovementMode;
  paintTool: PaintTool;
  customTerrainCost: number;
  isPlaying: boolean;
  hasResult: boolean;
  playbackEnabled: boolean;
  editingEnabled: boolean;
  rows: number;
  cols: number;
  speed: number;
  onAlgorithmChange: (algorithm: AlgorithmId) => void;
  onHeuristicChange: (heuristic: HeuristicName) => void;
  onPaintToolChange: (tool: PaintTool) => void;
  onCustomTerrainCostChange: (cost: number) => void;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
  onRunAll: () => void;
  onPreset: (preset: PresetId) => void;
  onRandom: () => void;
  onRecursiveDivision: () => void;
  onSpeedChange: (speed: number) => void;
  onResize: (rows: number, cols: number) => void;
}

const BASE_TOOLS: Array<{ id: PaintTool; label: string; swatch: string }> = [
  { id: "wall", label: "Wall", swatch: "■" },
  { id: "mud", label: "Mud · 3", swatch: "▧" },
  { id: "water", label: "Water · 5", swatch: "▨" },
];

export function Toolbar(props: ToolbarProps) {
  const [customCostDraft, setCustomCostDraft] = useState(String(props.customTerrainCost));
  const customCostIsValid = /^\d+$/.test(customCostDraft) &&
    isValidTerrainCost(Number(customCostDraft));

  const tools: Array<{ id: PaintTool; label: string; swatch: string }> = [
    ...BASE_TOOLS,
    { id: "custom", label: `Custom · ${props.customTerrainCost}`, swatch: "◆" },
    { id: "erase", label: "Erase", swatch: "□" },
  ];

  const updateCustomCost = (draft: string): void => {
    setCustomCostDraft(draft);
    if (/^\d+$/.test(draft)) {
      const cost = Number(draft);
      if (isValidTerrainCost(cost)) props.onCustomTerrainCostChange(cost);
    }
  };

  return (
    <section className="toolbar" aria-label="Pathfinding controls">
      <div className="toolbar-row toolbar-primary">
        <div className="control-group algorithm-switcher" aria-label="Algorithm">
          <div className="segmented-control">
            {ALGORITHM_ORDER.map((algorithm) => (
              <button
                key={algorithm}
                type="button"
                className={props.algorithm === algorithm ? "is-active" : ""}
                aria-pressed={props.algorithm === algorithm}
                onClick={() => props.onAlgorithmChange(algorithm)}
              >
                {ALGORITHM_INFO[algorithm].name}
              </button>
            ))}
          </div>
        </div>

        {props.algorithm === "astar" && (
          <label className="select-control compact-select">
            <span className="control-label">Heuristic</span>
            <select
              value={props.heuristic}
              onChange={(event) => props.onHeuristicChange(event.target.value as HeuristicName)}
            >
              {selectableHeuristics(props.movementMode).map((heuristic) => (
                <option key={heuristic} value={heuristic}>{HEURISTIC_LABELS[heuristic]}</option>
              ))}
            </select>
          </label>
        )}

        <div className="playback-actions">
          <button type="button" className="button button-primary" onClick={props.onRun}>
            <span aria-hidden="true">▶</span> Run
          </button>
          <button
            type="button"
            className="button"
            onClick={props.isPlaying ? props.onPause : props.onResume}
            disabled={!props.playbackEnabled || (!props.hasResult && !props.isPlaying)}
          >
            {props.isPlaying ? "Pause" : "Resume"}
          </button>
          <button type="button" className="button" onClick={props.onStep} disabled={!props.playbackEnabled}>
            Step
          </button>
          <button type="button" className="button" onClick={props.onReset}>
            Reset search
          </button>
          <button type="button" className="button" onClick={props.onClear}>
            Clear board
          </button>
        </div>

        <label className="speed-control">
          <span className="control-label">Speed</span>
          <input
            type="range"
            min="1"
            max="100"
            value={props.speed}
            onChange={(event) => props.onSpeedChange(Number(event.target.value))}
            aria-label="Playback speed"
            disabled={!props.playbackEnabled}
          />
        </label>
      </div>

      <div className="toolbar-row toolbar-secondary">
        <div className="control-group">
          <div className="tool-buttons">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={props.paintTool === tool.id ? "is-active" : ""}
                aria-pressed={props.paintTool === tool.id}
                disabled={!props.editingEnabled}
                onClick={() => props.onPaintToolChange(tool.id)}
              >
                <span aria-hidden="true">{tool.swatch}</span>{tool.label}
              </button>
            ))}
          </div>
        </div>

        {props.paintTool === "custom" && (
          <label className="custom-cost-control">
            <span className="control-label">Cost</span>
            <input
              type="number"
              min={MIN_TERRAIN_COST}
              max={MAX_TERRAIN_COST}
              step="1"
              value={customCostDraft}
              aria-label="Custom terrain cost"
              aria-invalid={!customCostIsValid}
              disabled={!props.editingEnabled}
              onChange={(event) => updateCustomCost(event.target.value)}
              onBlur={() => setCustomCostDraft(String(props.customTerrainCost))}
            />
          </label>
        )}

        <label className="select-control preset-select">
          <span className="control-label">Scenario</span>
          <select defaultValue="" onChange={(event) => {
            if (event.target.value) props.onPreset(event.target.value as PresetId);
            event.target.value = "";
          }}>
            <option value="" disabled>Load preset…</option>
            <option value="open">Open Field</option>
            <option value="weighted">Weighted Detour</option>
            <option value="maze">Narrow Maze</option>
            <option value="dense">Dense Obstacles</option>
            <option value="no-path">No Path</option>
          </select>
        </label>

        <GridSizeControls
          key={`${props.rows}:${props.cols}`}
          rows={props.rows}
          cols={props.cols}
          onResize={props.onResize}
        />

        <div className="maze-actions">
          <button
            type="button"
            className="text-button random-obstacles-button"
            onClick={props.onRandom}
          >
            Random obstacles
          </button>
          <button type="button" className="text-button" onClick={props.onRecursiveDivision}>Recursive division</button>
        </div>

        <div className="toolbar-spacer" />
        <button type="button" className="button" onClick={props.onRunAll}>Run all</button>
      </div>
    </section>
  );
}
