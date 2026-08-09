import type { NodeSearchValues, SearchEvent } from "../algorithms/types";

export type PlaybackNodeState = "frontier" | "current" | "closed" | "path";

export interface PlaybackNode extends NodeSearchValues {
  state: PlaybackNodeState;
}

export interface PlaybackSnapshot {
  nodes: Map<string, PlaybackNode>;
  currentKey: string | null;
  frontierSize: number;
  lastEvent: SearchEvent | null;
}

