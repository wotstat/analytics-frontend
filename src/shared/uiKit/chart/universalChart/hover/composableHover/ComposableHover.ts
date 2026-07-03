import { Overflow, Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotHover, InteractionDirection, Position, TouchZoomPoint } from '../BasePlotHover'

export interface HoverComponent {
  attach?(root: SVGGElement, composable: ComposableHover): void
  detach?(): void
  onBeforeLayout?(space: ChartSpace, full: Size): void
  render?(space: ChartSpace, overflow: Overflow, full: Size): void
  didLayout?(space: ChartSpace, full: Size): void
  onHoverBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onHoverEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onHoverMove?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean
  mayPan?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection
  mayHover?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection
  onPanBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onPanEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onPanMove?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean
  onWheelZoom?(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number, composable: ComposableHover): boolean
  onTouchZoomBegin?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean
  onTouchZoomUpdate?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean
  onTouchZoomEnd?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): void
}

export class ComposableHover extends BasePlotHover {

  private readonly componentsRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  private components: HoverComponent[] = []

  constructor(classes: Classes = []) {
    super(classes)

    this.componentsRoot.classList.add('hover-components')
    this.root.appendChild(this.componentsRoot)
  }

  detach(): void {
    super.detach()
    for (const component of this.components) component.detach?.()
    this.components = []
  }

  addComponent(component: HoverComponent) {
    this.components.push(component)
    component.attach?.(this.componentsRoot, this)

    return this
  }

  removeComponent(component: HoverComponent) {
    this.components = this.components.filter(c => c !== component)
    component.detach?.()
    return this
  }

  protected onBeforeLayout(space: ChartSpace, full: Size): void {
    super.onBeforeLayout(space, full)
    for (const component of this.components) component.onBeforeLayout?.(space, full)
  }

  protected onRender(space: ChartSpace, overflow: Overflow, full: Size): void {
    super.onRender(space, overflow, full)
    for (const component of this.components) component.render?.(space, overflow, full)
  }

  protected onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onHoverBegin(cursor, point, space, isTouch)
    for (const component of this.components) component.onHoverBegin?.(cursor, point, space, isTouch, this)
  }

  protected onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onHoverEnd(cursor, point, space, isTouch)
    for (const component of this.components) component.onHoverEnd?.(cursor, point, space, isTouch, this)
  }

  protected onHoverMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onHoverMove(cursor, point, space, isTouch)
    let shouldRender = false
    for (const component of this.components) {
      const componentShouldRender = component.onHoverMove?.(cursor, point, space, isTouch, this)
      shouldRender ||= componentShouldRender ?? false
    }
    return shouldRender
  }

  protected onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onPanBegin(cursor, point, space, isTouch)
    for (const component of this.components) component.onPanBegin?.(cursor, point, space, isTouch, this)
  }

  protected onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onPanEnd(cursor, point, space, isTouch)
    for (const component of this.components) component.onPanEnd?.(cursor, point, space, isTouch, this)
  }

  protected mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection {
    let vertical = false
    let horizontal = false

    for (const component of this.components) {
      const dir = component.mayPan?.(cursor, point, space, isTouch, this)

      if (!dir) continue
      if (dir === 'all') return 'all'
      if (dir === 'horizontal') horizontal = true
      if (dir === 'vertical') vertical = true
      if (horizontal && vertical) return 'all'
    }

    return horizontal ? (vertical ? 'all' : 'horizontal') : (vertical ? 'vertical' : false)
  }

  protected mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection {
    let vertical = false
    let horizontal = false

    for (const component of this.components) {
      const dir = component.mayHover?.(cursor, point, space, isTouch, this)

      if (!dir) continue
      if (dir === 'all') return 'all'
      if (dir === 'horizontal') horizontal = true
      if (dir === 'vertical') vertical = true
      if (horizontal && vertical) return 'all'
    }

    return horizontal ? (vertical ? 'all' : 'horizontal') : (vertical ? 'vertical' : false)
  }

  protected onPanMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onPanMove(cursor, point, space, isTouch)
    let shouldRender = false
    for (const component of this.components) {
      const componentShouldRender = component.onPanMove?.(cursor, point, space, isTouch, this)
      shouldRender ||= componentShouldRender ?? false
    }
    return shouldRender
  }

  protected onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean {
    super.onWheelZoom(cursor, point, space, deltaY, deltaX)
    let used = false
    for (const component of this.components) {
      const componentUsed = component.onWheelZoom?.(cursor, point, space, deltaY, deltaX, this)
      used ||= componentUsed ?? false
    }
    return used
  }

  protected onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    super.onTouchZoomBegin(first, second, space)
    let used = false
    for (const component of this.components) {
      const componentUsed = component.onTouchZoomBegin?.(first, second, space, this)
      used ||= componentUsed ?? false
    }
    return used
  }

  protected onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    super.onTouchZoomUpdate(first, second, space)
    let shouldRender = false
    for (const component of this.components) {
      const componentShouldRender = component.onTouchZoomUpdate?.(first, second, space, this)
      shouldRender ||= componentShouldRender ?? false
    }
    return shouldRender
  }

  protected onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): void {
    super.onTouchZoomEnd(first, second, space)
    for (const component of this.components) component.onTouchZoomEnd?.(first, second, space, this)
  }

  didLayout(space: ChartSpace, full: Size): void {
    super.didLayout(space, full)
    for (const component of this.components) component.didLayout?.(space, full)
  }
}
