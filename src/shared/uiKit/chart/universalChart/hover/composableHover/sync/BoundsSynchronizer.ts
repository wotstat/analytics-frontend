export type SyncAxis = 'x' | 'y'
// Which axes are synchronized, named like panDirection elsewhere for consistency.
export type BoundsSyncDirection = 'horizontal' | 'vertical' | 'all'
export type AxisWindow = { min: number, max: number }
export type BoundsSyncWindow = { x?: AxisWindow, y?: AxisWindow }
export type BoundsSyncPhase = 'active' | 'end'
export type BoundsSyncState = { window: BoundsSyncWindow, phase: BoundsSyncPhase }

// Identity-only token: each ZoomChartComponent passes `this`.
export type BoundsSyncSource = object


// Shared driven-axis window for a group of linked charts. Mirrors HoverSynchronizer, but the
// participants are ZoomChartComponents rather than hover components: the chart the user last
// gestured on is the source and publishes its driven-axis window (in chart-space) every frame;
// the others consume it, reproject it into their own pixels and ease their non-synced axis to
// its own data — so linked charts sharing an X frame but plotting different Y data stay
// individually auto-fitted on Y. Bounds-sync is independent of hover-sync.
//
// Only the leading axis is synchronized — configure which via the direction (e.g. 'horizontal').
// Unlike hover there is no "local hovered" flag to settle priority and self-echo, so the source
// is tracked explicitly by an identity token.
export class BoundsSynchronizer {

  readonly axes: readonly SyncAxis[]

  private source: BoundsSyncSource | null = null
  private state: BoundsSyncState | null = null
  private listeners = new Set<() => void>()

  constructor(direction: BoundsSyncDirection = 'all') {
    this.axes = direction === 'all' ? ['x', 'y'] : direction === 'horizontal' ? ['x'] : ['y']
  }

  // The gesturing chart becomes the source; a fresh gesture voids the previous synced window.
  claim(source: BoundsSyncSource): void {
    if (this.source === source) return
    this.source = source
    this.state = null
    this.notify()
  }

  // Only the current source publishes. `end` marks the drive settled and demotes the source, but
  // the window persists so a follower still mid-animation (or relayouting later) lands on it.
  publish(source: BoundsSyncSource, window: BoundsSyncWindow, phase: BoundsSyncPhase): void {
    if (this.source !== source) return
    this.state = { window, phase }
    if (phase === 'end') this.source = null
    this.notify()
  }

  // A participant leaving (unmount) gives up the source role.
  resign(source: BoundsSyncSource): void {
    if (this.source !== source) return
    this.source = null
    this.state = null
    this.notify()
  }

  isSource(source: BoundsSyncSource): boolean {
    return this.source === source
  }

  // The window to follow, or null when we are the source (self-echo) or nothing is published.
  consume(source: BoundsSyncSource): BoundsSyncState | null {
    if (this.source === source) return null
    return this.state
  }

  subscribeChange(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  unsubscribeChange(callback: () => void): void {
    this.listeners.delete(callback)
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }

}
