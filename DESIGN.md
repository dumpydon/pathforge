# PathForge design notes

## Problem statement

PathForge models a weighted rectangular grid as an implicit graph and runs several search strategies under identical conditions. The tool needs to expose internal search behavior without coupling algorithm correctness to rendering or animation timing.

The main comparison is deliberately not “which algorithm is fastest.” It is how each frontier policy changes the returned path and the amount of graph explored.

## Domain model

`Grid` contains:

```ts
interface Grid {
  rows: number;
  cols: number;
  terrain: Terrain[];
  start: Coordinate;
  target: Coordinate;
}
```

The flat terrain array makes coordinate/index conversion constant time and avoids per-cell UI state. Existing terrain remains represented by `normal`, `mud`, `water`, or `wall`; a custom cell uses a small `{ type: "custom", cost }` value validated to an integer from 1–100. This preserves preset compatibility while keeping the custom traversal cost in the domain model. Start and target are grid-level coordinates rather than terrain variants.

The grid is an implicit graph. `getNeighbors` derives traversable steps from one shared movement configuration. Four-way mode uses deterministic `up, right, down, left` order; eight-way mode adds four diagonals. No adjacency list is stored.

The cost of an edge is `movement distance × destination terrain cost`. Orthogonal distance is 1 and diagonal distance is `sqrt(2)`, so existing four-way costs are unchanged. The start contributes zero to a path's accumulated cost. With the default no-cutting policy, a diagonal requires both adjacent orthogonal cells to be traversable.

Rows and columns are constrained to integers from 5 through 300. Default endpoints share the middle row and use a 15% horizontal inset, which preserves the original 21 × 39 placement while remaining valid at the minimum dimensions.

## Architecture

```text
Domain grid
   │
   ├── search(grid, { recordEvents }) ──> SearchResult
   │                                         │
   │                                         ├── metrics/comparison
   │                                         ├── event log → playback reducer
   │                                         └── final path → canvas overview
   └── React editing UI <───────────────────────────────┘
```

The algorithm modules have no React, timers, DOM calls, CSS concepts, or animation delays. Maze generation is a separate concern and returns another valid `Grid`.

Search code uses mutable run-local structures for clarity and performance. The domain grid is read-only during a run. UI edits produce a new terrain array so React receives a stable change boundary.

## Algorithm interface

```ts
type SearchAlgorithm = (grid: Grid, options?: SearchOptions) => SearchResult;

interface SearchResult {
  algorithm: AlgorithmId;
  found: boolean;
  path: Coordinate[];
  pathCost: number | null;
  pathLength: number;
  discoveredCount: number;
  expandedCount: number;
  maxFrontierSize: number;
  executionTimeMs: number;
  eventRecordingEnabled: boolean;
  events: SearchEvent[];
}
```

`pathCost` is `null` when no path exists so failure is not confused with a zero-cost path. `pathLength` counts edges. `executionTimeMs` includes the pure search, path reconstruction, metric calculation, and event construction; it excludes playback and React rendering.

`SearchOptions.recordEvents` defaults to `true`. Each event write is guarded before constructing the event object, and `finishSearch` skips path events when recording is off. The result shape stays stable (`events` is empty and `eventRecordingEnabled` is false), so correctness and metrics do not need separate benchmark implementations.

## SearchEvent model

`SearchEvent` is a discriminated union rather than a generic object with many nullable fields:

- `discovered`: first insertion into the logical frontier
- `expanded`: removal/selection for neighbor processing
- `relaxed`: improved weighted score and parent
- `closed`: neighbor processing is complete
- `path`: final reconstruction overlay

Node values are attached at the operation that establishes them. BFS records levels; Dijkstra records `g` as distance; A* records `g`, `h`, and `f`; all algorithms can record parent and discovery/expansion order.

The event log is descriptive, not executable. Replaying it cannot change a search result.

## Playback mechanism

The reducer folds an event into a `Map<string, PlaybackNode>`. Only the map entry affected by an event changes; the terrain grid is not cloned. The current expansion and logical frontier size are separate snapshot fields.

Automatic playback batches events according to the speed setting. Pause stops cursor advancement. Manual step scans forward to the `closed` event following the next `expanded` event and applies that group. If no expansion remains, it applies the remaining path events.

Previous-step support is not included. A future implementation can store checkpoints every N expansion groups and replay from the nearest checkpoint, avoiding a full snapshot per event.

Playback is enabled only through 10,000 vertices. The current interactive grid renders one accessible button per cell, so continuing that representation to 90,000 cells would make DOM work expensive even without animation. Larger grids use a single canvas for terrain, endpoints, and the final path; node clicks still map to coordinates, but painting and event inspection are disabled.

## Comparison mechanism

`Run all` calls each pure algorithm synchronously against the same `Grid` reference and movement options before playback begins. Interactive runs retain four event logs for replay. Benchmark runs pass `recordEvents: false`; selecting a table row changes the result shown on the canvas without replaying events.

The comparison table states each objective:

- BFS: fewest edges
- DFS: reachability
- Dijkstra/A*: minimum accumulated movement cost

Actual movement cost is reported for every returned path, but weighted boards show an explicit BFS/DFS warning.

## Data structures and complexity

| Component | Choice | Relevant cost |
| --- | --- | --- |
| BFS frontier | Array with head-index queue | amortized `O(1)` enqueue/dequeue |
| DFS frontier | Array stack | amortized `O(1)` push/pop |
| Weighted frontier | Generic binary min heap | `O(log n)` push/pop, `O(1)` peek |
| Scores/state | Flat arrays, maps, and sets | expected `O(1)` access |
| Neighbor lookup | Shared four/eight-way movement steps | `O(1)` per vertex on this grid |

Dijkstra and A* insert a new heap entry when a priority improves. An entry is stale if its stored score no longer matches the current score array; stale entries are discarded on pop. This keeps `MinHeap<T>` reusable and avoids a position-map/decrease-key contract.

Maximum frontier size uses the logical open-set size rather than raw heap size, because the latter includes stale duplicates.

## Correctness assumptions

- The grid is finite.
- Walls are impassable.
- Traversable terrain costs are integers from 1–100 in the Grid Lab editor; walls are impassable.
- BFS returns a minimum-edge path because every grid transition counts as one edge for its objective.
- DFS is deterministic but not optimal.
- Dijkstra finalizes a node only after popping its current minimum distance.
- A* updates a node whenever a smaller `g` is found and can reopen a closed node. The shipped heuristics are consistent, so reopening is normally unnecessary but keeps the implementation safe for admissible inconsistent heuristics.
- Parent reconstruction begins at the target and terminates when no parent exists; a found path is validated separately in tests.

`start === target` is a valid case and returns a one-coordinate path with length and cost zero.

## Heuristic choices

Four-way movement uses Manhattan by default. Eight-way movement uses Octile by default, matching diagonal distance `sqrt(2)`. Euclidean remains admissible and consistent in either topology because the minimum terrain multiplier is 1. Manhattan is rejected in eight-way mode because it can overestimate when diagonal travel is allowed.

Tests expose a zero heuristic internally. With `h(n) = 0`, A* must produce the same optimal cost as Dijkstra. Tests compare Manhattan A* with Dijkstra in four-way mode and Octile A* with Dijkstra in eight-way mode.

## Engineering tradeoffs

- Event recording uses memory proportional to search operations. The benefit is deterministic replay and strict separation from animation; benchmark mode pays none of that per-operation allocation cost.
- A stable result shape is used in both modes. An empty event array is simpler than a second algorithm/result hierarchy and costs one allocation per run rather than one per operation.
- Comparison stores four event logs only when the board is interactive. Benchmark comparison stores the same metrics and paths with empty logs.
- Search events store coordinates rather than internal numeric indices. That costs some allocation but keeps the engine boundary readable and serializable.
- Browser timings are displayed because they are useful for rough observation, but the UI and documentation emphasize structural metrics.
- The visualization threshold is implementation-specific rather than an algorithm limit. If the interactive renderer moves to canvas or virtualization later, the threshold can change without touching search correctness.
- Resize replaces board, result, comparison, and selection state in one pure transition. Algorithm, heuristic, paint tool, and speed live outside that session and therefore survive a resize.
