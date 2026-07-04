import { Overflow, Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BaseDataSourcedPlotHover } from '../BaseDataSourcedPlotHover'
import { InteractionDirection, Position, TouchZoomPoint } from '../basePlotHover/BasePlotHover'

export interface HoverComponent {
  attach?(root: SVGGElement, composable: ComposableHover): void
  detach?(): void
  onBeforeLayout?(space: ChartSpace, full: Size): void
  render?(space: ChartSpace, overflow: Overflow, full: Size): void
  didLayout?(space: ChartSpace, full: Size): void

  mayHover?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection
  onHoverBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean
  onHoverUpdate?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean
  onHoverEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean

  mayPan?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection
  onPanBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean
  onPanUpdate?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean
  onPanEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean

  mayTouchZoom?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): InteractionDirection
  onTouchZoomBegin?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean
  onTouchZoomUpdate?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean
  onTouchZoomEnd?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean

  onWheelZoom?(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number, composable: ComposableHover): boolean
}

function processInteractionDirection(components: HoverComponent[], getter: (c: HoverComponent) => InteractionDirection | undefined): InteractionDirection {
  let vertical = false
  let horizontal = false

  for (const component of components) {
    const dir = getter(component)
    if (!dir) continue
    if (dir === 'all') return 'all'
    if (dir === 'horizontal') horizontal = true
    if (dir === 'vertical') vertical = true
    if (horizontal && vertical) return 'all'
  }

  return horizontal ? (vertical ? 'all' : 'horizontal') : (vertical ? 'vertical' : false)
}

function processInteractionBoolean(components: HoverComponent[], getter: (c: HoverComponent) => boolean | undefined): boolean {
  let shouldRender = false
  for (const component of components) {
    const result = getter(component)
    shouldRender ||= result ?? false
  }

  return shouldRender
}

export class ComposableHover extends BaseDataSourcedPlotHover {

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

  didLayout(space: ChartSpace, full: Size): void {
    super.didLayout(space, full)
    for (const component of this.components) component.didLayout?.(space, full)
  }

  //#region Hover

  protected mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection {
    return processInteractionDirection(this.components, c => c.mayHover?.(cursor, point, space, isTouch, this))
  }

  protected onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onHoverBegin(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, c => c.onHoverBegin?.(cursor, point, space, isTouch, this))
  }

  protected onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onHoverUpdate(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, c => c.onHoverUpdate?.(cursor, point, space, isTouch, this))
  }

  protected onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onHoverEnd(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, c => c.onHoverEnd?.(cursor, point, space, isTouch, this))
  }

  //#endregion 

  //#region Pan

  protected mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection {
    return processInteractionDirection(this.components, component => component.mayPan?.(cursor, point, space, isTouch, this) ?? false)
  }

  protected onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onPanBegin(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, component => component.onPanBegin?.(cursor, point, space, isTouch, this))
  }

  protected onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onPanUpdate(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, component => component.onPanUpdate?.(cursor, point, space, isTouch, this))
  }

  protected onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onPanEnd(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, component => component.onPanEnd?.(cursor, point, space, isTouch, this))
  }

  //#endregion

  //#region Touch Zoom

  protected mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): InteractionDirection {
    return processInteractionDirection(this.components, component => component.mayTouchZoom?.(first, second, space, this) ?? false)
  }

  protected onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    super.onTouchZoomBegin(first, second, space)
    return processInteractionBoolean(this.components, component => component.onTouchZoomBegin?.(first, second, space, this))
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

  protected onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    super.onTouchZoomEnd(first, second, space)
    return processInteractionBoolean(this.components, component => component.onTouchZoomEnd?.(first, second, space, this))
  }

  //#endregion

  //#region Wheel Zoom

  protected onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean {
    super.onWheelZoom(cursor, point, space, deltaY, deltaX)
    return processInteractionBoolean(this.components, component => component.onWheelZoom?.(cursor, point, space, deltaY, deltaX, this))
  }

  //#endregion

}
