import { InteractionTag } from '../../core/InteractionSource'

export type HighlightSyncState = {
  readonly tags: readonly InteractionTag[]
}

export interface HighlightSyncConnection {
  publish(tags: readonly InteractionTag[]): void
  release(): void
  consume(): HighlightSyncState | null
  subscribeChange(callback: () => void): () => void
  dispose(): void
}

function sameTags(left: readonly InteractionTag[], right: readonly InteractionTag[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every(tag => rightSet.has(tag))
}

function uniqueTags(tags: readonly InteractionTag[]): readonly InteractionTag[] {
  return [...new Set(tags)]
}

export class HighlightSynchronizer {

  private owner: symbol | null = null
  private state: HighlightSyncState | null = null
  private readonly listeners = new Set<() => void>()

  connect(): HighlightSyncConnection {
    const owner = Symbol('HighlightSyncConnection')
    const subscriptions = new Set<() => void>()
    let disposed = false

    const unsubscribe = (stop: () => void) => {
      subscriptions.delete(stop)
      stop()
    }

    return {
      publish: tags => {
        if (!disposed) this.publish(owner, tags)
      },
      release: () => {
        if (!disposed) this.release(owner)
      },
      consume: () => disposed ? null : this.consume(owner),
      subscribeChange: callback => {
        if (disposed) return () => { }

        const stop = this.subscribeChange(callback)
        subscriptions.add(stop)
        return () => unsubscribe(stop)
      },
      dispose: () => {
        if (disposed) return
        disposed = true
        for (const stop of subscriptions) stop()
        subscriptions.clear()
        this.release(owner)
      },
    }
  }

  private publish(owner: symbol, tags: readonly InteractionTag[]): void {
    const nextTags = uniqueTags(tags)
    if (this.owner === owner && this.state && sameTags(this.state.tags, nextTags)) return

    this.owner = owner
    this.state = { tags: nextTags }
    this.notify()
  }

  private release(owner: symbol): void {
    if (this.owner !== owner) return
    this.owner = null
    this.state = null
    this.notify()
  }

  private consume(owner: symbol): HighlightSyncState | null {
    if (this.owner === owner) return null
    return this.state
  }

  private subscribeChange(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
