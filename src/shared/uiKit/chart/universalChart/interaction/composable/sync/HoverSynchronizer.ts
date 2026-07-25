import { Size } from '../../../UniversalChart'
import { ChartSpace } from '../../../utils/ChartSpace'
import { Point } from '../../../utils/Point'
import { InteractionDirection, Position } from '../../baseInteractionController/BaseInteractionController'
import { InteractionController, InteractionComponent } from '../InteractionController'

export interface HoverResolver {
  resolve(space: ChartSpace): Point | null
  readonly isTouch: boolean
  subscribeChange(callback: () => void): () => void
  unsubscribeChange(callback: () => void): void
}

// `point` is the source's raw cursor pixel; `coord` is it projected into the shared chart frame.
// We keep the pixel + the source's space so we can re-project every frame (see onBeforeLayout).
type Current = { point: Point, coord: Point, isTouch: boolean, space: ChartSpace }


export class HoverSynchronizer implements InteractionComponent, HoverResolver {

  private current: Current | null = null
  private source: InteractionController | null = null
  private listeners = new Set<() => void>()

  detach(controller: InteractionController): void {
    if (this.source === controller) this.set(null, controller)
  }

  mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): InteractionDirection {
    return false
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.set({ point, coord: space.layoutToChart(point), isTouch, space }, controller)
    return false
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.set({ point, coord: space.layoutToChart(point), isTouch, space }, controller)
    return false
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.set(null, controller)
    return false
  }

  // The source captures the hover on a pointer event — before that frame's deferred pan/zoom is
  // applied — so `coord = layoutToChart(pixel)` lags the bounds by a frame. The source's own hover
  // hides this by re-deriving from the raw pixel with fresh bounds each frame; followers only get
  // `coord`, so a stale coord made their marker/tooltip jitter against the moving content. This runs
  // on every linked chart's layout, but only the source's own space matches; hoverSync is added last,
  // so by now the source's ZoomChartComponent has applied this frame's bounds — re-project the pixel
  // and, if it moved, notify followers.
  onBeforeLayout(space: ChartSpace, full: Size): void {
    const current = this.current
    if (!current || space !== current.space) return

    const coord = space.layoutToChart(current.point)
    if (coord.x === current.coord.x && coord.y === current.coord.y) return

    current.coord = coord
    for (const listener of this.listeners) listener()
  }

  private set(current: Current | null, source: InteractionController): void {
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
