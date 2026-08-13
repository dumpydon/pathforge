import { MAX_TERRAIN_COST, MIN_TERRAIN_COST } from "../../core/types";

export function customTerrainColor(cost: number): string {
  const range = MAX_TERRAIN_COST - MIN_TERRAIN_COST;
  const intensity = range === 0 ? 0 : (cost - MIN_TERRAIN_COST) / range;
  return `hsl(278 34% ${20 + intensity * 18}%)`;
}
