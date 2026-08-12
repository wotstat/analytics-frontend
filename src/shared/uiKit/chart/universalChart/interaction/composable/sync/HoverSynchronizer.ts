import { Size } from '../../../UniversalChart'
import { ChartSpace } from '../../../utils/ChartSpace'
import { Point } from '../../../utils/Point'
import { InteractionDirection, Position } from '../../baseInteractionController/BaseInteractionController'
import { HoverResolver } from '../../core/InteractionInput'
import { InteractionController, InteractionComponent } from '../InteractionController'

type Payload = { dataAxisValue: number, freeAxisFraction: number }
type Current = Payload & { point: Point, isTouch: boolean, space: ChartSpace }

export class HoverSynchronizer implements InteractionComponent, HoverResolver {

  private current: Current | null = null
  private source: InteractionController | null = null
  private readonly controllers = new Set<InteractionController>()

  attach(root: SVGGElement, controller: InteractionController): void {
    this.controllers.add(controller)
  }

  detach(controller: InteractionController): void {
    if (this.source === controller) this.set(null, controller)
    this.controllers.delete(controller)
  }

  mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): InteractionDirection {
    return false
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.set({ point, ...this.project(point, space), isTouch, space }, controller)
    return false
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.set({ point, ...this.project(point, space), isTouch, space }, controller)
    return false
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.set(null, controller)
    return false
  }

  onBeforeLayout(space: ChartSpace, full: Size): void {
    const current = this.current
    if (!current || space !== current.space) return

    const projected = this.project(current.point, space)
    if (projected.dataAxisValue === current.dataAxisValue && projected.freeAxisFraction === current.freeAxisFraction) return

    current.dataAxisValue = projected.dataAxisValue
    current.freeAxisFraction = projected.freeAxisFraction
    this.notifyFollowers()
  }

  private project(point: Point, space: ChartSpace): Payload {
    return { dataAxisValue: space.layoutToChartX(point.x), freeAxisFraction: space.layoutToFractionY(point.y) }
  }

  private unproject(payload: Payload, space: ChartSpace): Point {
    return { x: space.chartToLayoutX(payload.dataAxisValue), y: space.fractionToLayoutY(payload.freeAxisFraction) }
  }

  private set(current: Current | null, source: InteractionController): void {
    this.current = current
    this.source = current ? source : null
    this.notifyFollowers()
  }

  private notifyFollowers(): void {
    for (const controller of this.controllers) {
      if (controller !== this.source) controller.scheduleRender()
    }
  }

  get isTouch(): boolean {
    return this.current?.isTouch ?? false
  }

  resolve(space: ChartSpace): Point | null {
    if (!this.current) return null
    return this.unproject(this.current, space)
  }

}
