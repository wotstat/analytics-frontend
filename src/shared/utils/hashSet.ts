

export class HashSet<T> {

  private readonly map = new Map<string, T>()

  constructor(private readonly hashFunction: (item: T) => string, initialItems: T[] = []) {
    for (const item of initialItems) this.add(item)
  }


  add(item: T): void {
    const key = this.hashFunction(item)
    this.map.set(key, item)
  }

  delete(item: T): void {
    const key = this.hashFunction(item)
    this.map.delete(key)
  }

  has(item: T): boolean {
    const key = this.hashFunction(item)
    return this.map.has(key)
  }

  clear(): void {
    this.map.clear()
  }

  get size(): number {
    return this.map.size
  }

  values(): IterableIterator<T> {
    return this.map.values()
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values()
  }
}