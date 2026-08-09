import { describe, expect, it } from "vitest";
import { MinHeap } from "../structures/MinHeap";

describe("MinHeap", () => {
  it("pops numbers in ascending order", () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    [7, 2, 9, 1, 4].forEach((value) => heap.push(value));

    expect(heap.peek()).toBe(1);
    expect([heap.pop(), heap.pop(), heap.pop(), heap.pop(), heap.pop()]).toEqual([
      1, 2, 4, 7, 9,
    ]);
  });

  it("preserves duplicate values", () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    [3, 1, 3, 1].forEach((value) => heap.push(value));
    expect([heap.pop(), heap.pop(), heap.pop(), heap.pop()]).toEqual([1, 1, 3, 3]);
  });

  it("returns undefined when empty", () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    expect(heap.peek()).toBeUndefined();
    expect(heap.pop()).toBeUndefined();
    expect(heap.size).toBe(0);
    expect(heap.isEmpty).toBe(true);
  });

  it("supports a custom comparator", () => {
    const heap = new MinHeap<{ label: string; priority: number }>(
      (a, b) => a.priority - b.priority,
    );
    heap.push({ label: "low", priority: 8 });
    heap.push({ label: "high", priority: 2 });
    expect(heap.pop()?.label).toBe("high");
  });
});

