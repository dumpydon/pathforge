import type { SearchEvent } from "../algorithms/types";
import { coordinateKey } from "../core/types";
import type { PlaybackNode, PlaybackSnapshot } from "./types";

export function createPlaybackSnapshot(): PlaybackSnapshot {
  return {
    nodes: new Map(),
    currentKey: null,
    frontierSize: 0,
    lastEvent: null,
  };
}

function updateNode(
  nodes: Map<string, PlaybackNode>,
  key: string,
  update: Partial<PlaybackNode>,
): void {
  const previous = nodes.get(key);
  nodes.set(key, {
    state: previous?.state ?? "frontier",
    parent: previous?.parent ?? null,
    ...previous,
    ...update,
  });
}

export function applySearchEvent(
  snapshot: PlaybackSnapshot,
  event: SearchEvent,
): PlaybackSnapshot {
  const nodes = new Map(snapshot.nodes);
  const key = coordinateKey(event.coordinate);
  let currentKey = snapshot.currentKey;

  switch (event.type) {
    case "discovered":
      updateNode(nodes, key, { ...event.values, state: "frontier" });
      break;
    case "expanded":
      if (currentKey && currentKey !== key) {
        updateNode(nodes, currentKey, { state: "closed" });
      }
      updateNode(nodes, key, { ...event.values, state: "current" });
      currentKey = key;
      break;
    case "relaxed":
      updateNode(nodes, key, { ...event.values, state: "frontier" });
      break;
    case "closed":
      updateNode(nodes, key, { state: "closed" });
      if (currentKey === key) currentKey = null;
      break;
    case "path":
      updateNode(nodes, key, { state: "path" });
      if (currentKey === key) currentKey = null;
      break;
  }

  return {
    nodes,
    currentKey,
    frontierSize: event.frontierSize,
    lastEvent: event,
  };
}

export function applySearchEvents(
  snapshot: PlaybackSnapshot,
  events: readonly SearchEvent[],
): PlaybackSnapshot {
  return events.reduce(applySearchEvent, snapshot);
}

export function nextExpansionBoundary(events: readonly SearchEvent[], cursor: number): number {
  let expansionSeen = false;

  for (let index = cursor; index < events.length; index += 1) {
    if (events[index].type === "expanded") expansionSeen = true;
    if (expansionSeen && events[index].type === "closed") return index + 1;
  }

  return events.length;
}

