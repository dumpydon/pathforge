interface GridLegendProps {
  customTerrainCost: number;
}

export function GridLegend({ customTerrainCost }: GridLegendProps) {
  return (
    <div className="grid-legend" aria-label="Grid legend">
      <span><i className="legend-swatch swatch-start">S</i>Start</span>
      <span><i className="legend-swatch swatch-target">T</i>Target</span>
      <span><i className="legend-swatch swatch-frontier" />Frontier</span>
      <span><i className="legend-swatch swatch-closed" />Closed</span>
      <span><i className="legend-swatch swatch-path" />Path</span>
      <span><i className="legend-swatch swatch-mud" />Mud 3</span>
      <span><i className="legend-swatch swatch-water" />Water 5</span>
      <span><i className="legend-swatch swatch-custom" />Custom {customTerrainCost}</span>
      <span><i className="legend-swatch swatch-wall" />Wall</span>
    </div>
  );
}
