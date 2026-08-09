"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import type { SearchResult } from "../../algorithms/types";
import { coordinatesEqual, type Coordinate, type Grid, type Terrain } from "../../core/types";
import { GridLegend } from "./GridLegend";

interface BenchmarkGridProps {
  grid: Grid;
  result: SearchResult | null;
  selectedCoordinate: Coordinate | null;
  onInspect: (coordinate: Coordinate) => void;
}

const TERRAIN_COLORS: Record<Terrain, string> = {
  normal: "#121820",
  mud: "#6f5838",
  water: "#244c68",
  wall: "#343b45",
};

function drawEndpoint(
  context: CanvasRenderingContext2D,
  coordinate: Coordinate,
  label: string,
  color: string,
  cellWidth: number,
  cellHeight: number,
): void {
  const x = coordinate.col * cellWidth;
  const y = coordinate.row * cellHeight;
  context.fillStyle = color;
  context.fillRect(x, y, Math.max(1, cellWidth), Math.max(1, cellHeight));

  if (cellWidth >= 9 && cellHeight >= 9) {
    context.fillStyle = "#ffffff";
    context.font = `700 ${Math.min(11, cellHeight * 0.65)}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, x + cellWidth / 2, y + cellHeight / 2);
  }
}

export function BenchmarkGrid({ grid, result, selectedCoordinate, onInspect }: BenchmarkGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    const draw = () => {
      const width = frame.clientWidth;
      if (width === 0) return;

      const height = Math.min(640, Math.max(180, width * (grid.rows / grid.cols)));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.height = `${height}px`;
      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));

      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(pixelRatio, pixelRatio);

      const cellWidth = width / grid.cols;
      const cellHeight = height / grid.rows;
      context.fillStyle = TERRAIN_COLORS.normal;
      context.fillRect(0, 0, width, height);

      for (let index = 0; index < grid.terrain.length; index += 1) {
        const terrain = grid.terrain[index];
        if (terrain === "normal") continue;
        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;
        context.fillStyle = TERRAIN_COLORS[terrain];
        context.fillRect(col * cellWidth, row * cellHeight, Math.max(1, cellWidth), Math.max(1, cellHeight));
      }

      if (Math.min(cellWidth, cellHeight) >= 5) {
        context.beginPath();
        context.strokeStyle = "#1e2732";
        context.lineWidth = 1;
        for (let col = 1; col < grid.cols; col += 1) {
          const x = col * cellWidth;
          context.moveTo(x, 0);
          context.lineTo(x, height);
        }
        for (let row = 1; row < grid.rows; row += 1) {
          const y = row * cellHeight;
          context.moveTo(0, y);
          context.lineTo(width, y);
        }
        context.stroke();
      }

      if (result?.found && result.path.length > 0) {
        context.beginPath();
        result.path.forEach((coordinate, index) => {
          const x = (coordinate.col + 0.5) * cellWidth;
          const y = (coordinate.row + 0.5) * cellHeight;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.strokeStyle = "#3fb950";
        context.lineWidth = Math.max(1.5, Math.min(cellWidth, cellHeight) * 0.7);
        context.lineCap = "square";
        context.lineJoin = "miter";
        context.stroke();
      }

      drawEndpoint(context, grid.start, coordinatesEqual(grid.start, grid.target) ? "ST" : "S", "#216e39", cellWidth, cellHeight);
      if (!coordinatesEqual(grid.start, grid.target)) {
        drawEndpoint(context, grid.target, "T", "#9e3f3f", cellWidth, cellHeight);
      }

      if (selectedCoordinate) {
        context.strokeStyle = "#f0f6fc";
        context.lineWidth = 1;
        context.strokeRect(
          selectedCoordinate.col * cellWidth + 0.5,
          selectedCoordinate.row * cellHeight + 0.5,
          Math.max(1, cellWidth - 1),
          Math.max(1, cellHeight - 1),
        );
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [grid, result, selectedCoordinate]);

  const inspect = (event: MouseEvent<HTMLCanvasElement>): void => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const col = Math.min(grid.cols - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * grid.cols));
    const row = Math.min(grid.rows - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * grid.rows));
    onInspect({ row, col });
  };

  return (
    <div className="grid-frame benchmark-grid-frame">
      <div ref={frameRef} className="benchmark-canvas-frame">
        <canvas
          ref={canvasRef}
          className="benchmark-canvas"
          aria-label={`${grid.rows} by ${grid.cols} benchmark grid overview`}
          onClick={inspect}
        />
      </div>
      <GridLegend />
    </div>
  );
}

