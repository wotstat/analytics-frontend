
type ReusableEntry = {
  ctor: () => unknown,
  limit: number,
  free: unknown[]
}

export class ReusableStorage {

  private readonly storage = new Map<symbol, ReusableEntry>()

  constructor() { }

  registerElement(key: symbol, ctor: () => unknown, limit: number = 10) {
    this.storage.set(key, { ctor, free: [], limit })
  }

  getElement<T>(key: symbol): T {
    const entry = this.storage.get(key)
    if (!entry) throw new Error(`Element not found for key: ${key.toString()}`)
    if (entry.free.length > 0) return entry.free.pop() as T
    return entry.ctor() as T
  }

  releaseElement<T>(key: symbol, element: T) {
    const entry = this.storage.get(key)
    if (!entry) throw new Error(`Element not found for key: ${key.toString()}`)
    if (entry.free.length < entry.limit) {
      entry.free.push(element)
    }
  }
}
