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

The flat terrain array makes coordinate/index conversion constant time and avoids a per-cell object containing UI state. Terrain is one of `normal`, `mud`, `water`, or `wall`; start and target are grid-level coordinates rather than terrain variants.

The grid is an implicit graph. `getNeighbors` derives traversable adjacent coordinates in deterministic `up, right, down, left` order. No adjacency list is stored.

The cost of an edge is the terrain cost of the destination cell. The start therefore contributes zero to a path's accumulated cost.

## Architecture

```text
Domain grid
   │
   ├── search(grid, options) ──> SearchResult + event log
   │                                  │
   │                                  ├── metrics/comparison
   │                                  └── playback reducer
   │                                           │
   └── React editing UI <──────────────────────┘
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
  events: SearchEvent[];
}
```

`pathCost` is `null` when no path exists so failure is not confused with a zero-cost path. `pathLength` counts edges. `executionTimeMs` includes the pure search, path reconstruction, metric calculation, and event construction; it excludes playback and React rendering.

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

## Comparison mechanism

`Run all` calls each pure algorithm synchronously against the same `Grid` reference before playback begins. The four `SearchResult` objects populate the table and retain their event logs. Replaying a row only selects its existing result.

The comparison table states each objective:

- BFS: fewest edges
- DFS: reachability
- Dijkstra/A*: minimum accumulated terrain cost

Actual terrain cost is reported for every returned path, but weighted boards show an explicit BFS/DFS warning.

## Data structures and complexity

| Component | Choice | Relevant cost |
| --- | --- | --- |
| BFS frontier | Array with head-index queue | amortized `O(1)` enqueue/dequeue |
| DFS frontier | Array stack | amortized `O(1)` push/pop |
| Weighted frontier | Generic binary min heap | `O(log n)` push/pop, `O(1)` peek |
| Scores/state | Flat arrays, maps, and sets | expected `O(1)` access |
| Neighbor lookup | Implicit four-way offsets | `O(1)` per vertex on this grid |

Dijkstra and A* insert a new heap entry when a priority improves. An entry is stale if its stored score no longer matches the current score array; stale entries are discarded on pop. This keeps `MinHeap<T>` reusable and avoids a position-map/decrease-key contract.

Maximum frontier size uses the logical open-set size rather than raw heap size, because the latter includes stale duplicates.

## Correctness assumptions

- The grid is finite.
- Walls are impassable.
- Terrain costs are non-negative and, for current terrain, at least 1.
- BFS returns a minimum-edge path because every grid transition counts as one edge for its objective.
- DFS is deterministic but not optimal.
- Dijkstra finalizes a node only after popping its current minimum distance.
- A* updates a node whenever a smaller `g` is found and can reopen a closed node. The shipped heuristics are consistent, so reopening is normally unnecessary but keeps the implementation safe for admissible inconsistent heuristics.
- Parent reconstruction begins at the target and terminates when no parent exists; a found path is validated separately in tests.

`start === target` is a valid case and returns a one-coordinate path with length and cost zero.

## Heuristic choices

Movement is four-directional with straight step distance 1. Manhattan and Euclidean distance are both admissible because the minimum cost of entering a cell is 1. Manhattan is more informed for this movement model; Euclidean remains a useful comparison and is still consistent.

Tests expose a zero heuristic internally. With `h(n) = 0`, A* must produce the same optimal cost as Dijkstra. Seeded weighted-grid tests also compare Manhattan A* and Dijkstra across many deterministic maps.

Diagonal movement was left out because adding it correctly requires a diagonal multiplier, octile distance, and an explicit corner-cutting rule. Those are related design decisions, not an isolated toggle.

## Engineering tradeoffs

- Event recording uses memory proportional to search operations. The benefit is deterministic replay and strict separation from animation.
- A pure metrics-only runner could omit events, but one result shape is easier to reason about at this project size.
- Comparison stores four event logs so any row can be replayed without rerunning. This is acceptable for the current grid sizes.
- Search events store coordinates rather than internal numeric indices. That costs some allocation but keeps the engine boundary readable and serializable.
- Browser timings are displayed because they are useful for rough observation, but the UI and documentation emphasize structural metrics.

