export type Comparator<T> = (a: T, b: T) => number;

export class MinHeap<T> {
  private readonly values: T[] = [];

  constructor(private readonly compare: Comparator<T>) {}

  get size(): number {
    return this.values.length;
  }

  get isEmpty(): boolean {
    return this.values.length === 0;
  }

  peek(): T | undefined {
    return this.values[0];
  }

  push(value: T): void {
    this.values.push(value);
    this.siftUp(this.values.length - 1);
  }

  pop(): T | undefined {
    if (this.values.length === 0) return undefined;

    const minimum = this.values[0];
    const last = this.values.pop();
    if (this.values.length > 0 && last !== undefined) {
      this.values[0] = last;
      this.siftDown(0);
    }
    return minimum;
  }

  private siftUp(startIndex: number): void {
    let index = startIndex;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.values[index], this.values[parentIndex]) >= 0) break;
      [this.values[index], this.values[parentIndex]] = [
        this.values[parentIndex],
        this.values[index],
      ];
      index = parentIndex;
    }
  }

  private siftDown(startIndex: number): void {
    let index = startIndex;

    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      let smallestIndex = index;

      if (
        leftIndex < this.values.length &&
        this.compare(this.values[leftIndex], this.values[smallestIndex]) < 0
      ) {
        smallestIndex = leftIndex;
      }

      if (
        rightIndex < this.values.length &&
        this.compare(this.values[rightIndex], this.values[smallestIndex]) < 0
      ) {
        smallestIndex = rightIndex;
      }

      if (smallestIndex === index) break;
      [this.values[index], this.values[smallestIndex]] = [
        this.values[smallestIndex],
        this.values[index],
      ];
      index = smallestIndex;
    }
  }
}
