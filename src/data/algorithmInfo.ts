import type { AlgorithmId } from "../algorithms/types";

export interface AlgorithmInfo {
  name: string;
  structure: string;
  time: string;
  space: string;
  guaranteeLabel: string;
  guaranteeValue: string;
  summary: string;
}

export const ALGORITHM_ORDER: AlgorithmId[] = ["bfs", "dfs", "dijkstra", "astar"];

export const ALGORITHM_INFO: Record<AlgorithmId, AlgorithmInfo> = {
  bfs: {
    name: "BFS",
    structure: "Queue",
    time: "O(V + E)",
    space: "O(V)",
    guaranteeLabel: "Shortest path",
    guaranteeValue: "Equal-cost edges only",
    summary: "Explores the graph level by level. Complete on this finite grid.",
  },
  dfs: {
    name: "DFS",
    structure: "Explicit stack",
    time: "O(V + E)",
    space: "O(V)",
    guaranteeLabel: "Shortest path",
    guaranteeValue: "Not guaranteed",
    summary: "Follows one branch deeply before backtracking. Neighbor order is deterministic.",
  },
  dijkstra: {
    name: "Dijkstra",
    structure: "Binary min heap",
    time: "O((V + E) log V)",
    space: "O(V + E)",
    guaranteeLabel: "Minimum cost",
    guaranteeValue: "Non-negative weights",
    summary: "Finalizes the unsettled node with the lowest known accumulated cost.",
  },
  astar: {
    name: "A*",
    structure: "Binary min heap",
    time: "Worst case O((V + E) log V)",
    space: "O(V + E)",
    guaranteeLabel: "Minimum cost",
    guaranteeValue: "Admissible heuristic",
    summary: "Orders the frontier by accumulated cost plus an estimate to the target.",
  },
};

