import { ChartSpace } from '../../../utils/ChartSpace'
import { Point } from '../../../utils/Point'
import { InteractionDirection, Position } from '../../basePlotHover/BasePlotHover'
import { ComposableHover, HoverComponent } from '../ComposableHover'

export interface HoverResolver {
  resolve(space: ChartSpace): Point | null
  readonly isTouch: boolean
  subscribeChange(callback: () => void): () => void
  unsubscribeChange(callback: () => void): void
}

type Current = { coord: Point, isTouch: boolean }


export class HoverSynchronizer implements HoverComponent, HoverResolver {

  private current: Current | null = null
  private source: ComposableHover | null = null
  private listeners = new Set<() => void>()

  detach(composable: ComposableHover): void {
    if (this.source === composable) this.set(null, composable)
  }

  mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection {
    return false
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    this.set({ coord: space.layoutToChart(point), isTouch }, composable)
    return false
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    this.set({ coord: space.layoutToChart(point), isTouch }, composable)
    return false
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    this.set(null, composable)
    return false
  }

  private set(current: Current | null, source: ComposableHover): void {
    this.current = current
    this.source = current ? source : null
    for (const listener of this.listeners) listener()
  }

  get isTouch(): boolean {
    return this.current?.isTouch ?? false
  }

  subscribeChange(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  unsubscribeChange(callback: () => void): void {
    this.listeners.delete(callback)
  }

  resolve(space: ChartSpace): Point | null {
    if (!this.current) return null
    return space.chartToLayout(this.current.coord)
  }

}
