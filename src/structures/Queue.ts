export class Queue<T> {
  private items: T[] = [];
  private head = 0;

  get size(): number {
    return this.items.length - this.head;
  }

  get isEmpty(): boolean {
    return this.size === 0;
  }

  enqueue(value: T): void {
    this.items.push(value);
  }

  dequeue(): T | undefined {
    if (this.isEmpty) return undefined;
    const value = this.items[this.head];
    this.head += 1;

    // Compact occasionally without paying O(n) for every dequeue.
    if (this.head > 1024 && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }

    return value;
  }
}

