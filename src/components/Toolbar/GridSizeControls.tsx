"use client";

import { useState, type KeyboardEvent } from "react";
import {
  GRID_SIZE_PRESETS,
  MAX_GRID_DIMENSION,
  MIN_GRID_DIMENSION,
  gridDimensionError,
} from "../../core/gridDimensions";

interface GridSizeControlsProps {
  rows: number;
  cols: number;
  onResize: (rows: number, cols: number) => void;
}

export function GridSizeControls({ rows, cols, onResize }: GridSizeControlsProps) {
  const [rowDraft, setRowDraft] = useState(String(rows));
  const [colDraft, setColDraft] = useState(String(cols));
  const [error, setError] = useState<string | null>(null);

  const apply = (): void => {
    const nextRows = Number(rowDraft);
    const nextCols = Number(colDraft);
    const validationError = gridDimensionError(nextRows, nextCols);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    if (nextRows !== rows || nextCols !== cols) onResize(nextRows, nextCols);
  };

  const applyOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") apply();
  };

  return (
    <div className="grid-size-control">
      <span className="control-label">Grid</span>
      <label>
        <span>Rows</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_GRID_DIMENSION}
          max={MAX_GRID_DIMENSION}
          step="1"
          value={rowDraft}
          aria-invalid={Boolean(error)}
          onChange={(event) => setRowDraft(event.target.value)}
          onKeyDown={applyOnEnter}
        />
      </label>
      <span className="dimension-separator" aria-hidden="true">×</span>
      <label>
        <span>Columns</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_GRID_DIMENSION}
          max={MAX_GRID_DIMENSION}
          step="1"
          value={colDraft}
          aria-invalid={Boolean(error)}
          onChange={(event) => setColDraft(event.target.value)}
          onKeyDown={applyOnEnter}
        />
      </label>
      <button type="button" className="dimension-apply" onClick={apply}>Apply</button>
      <select
        className="dimension-presets"
        aria-label="Grid size preset"
        defaultValue=""
        onChange={(event) => {
          const preset = GRID_SIZE_PRESETS.find((candidate) => candidate.id === event.target.value);
          if (preset) onResize(preset.rows, preset.cols);
          event.target.value = "";
        }}
      >
        <option value="" disabled>Sizes…</option>
        {GRID_SIZE_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label} · {preset.rows} × {preset.cols}
          </option>
        ))}
      </select>
      {error && <span className="dimension-error" role="status">{error}</span>}
    </div>
  );
}
