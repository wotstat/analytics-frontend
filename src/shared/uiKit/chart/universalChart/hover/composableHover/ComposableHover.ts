import { Overflow, Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotHover, Position } from '../BasePlotHover'

export interface HoverComponent {
  attach?(root: SVGGElement, composable: ComposableHover): void
  detach?(): void
  onBeforeLayout?(space: ChartSpace, full: Size): void
  render?(space: ChartSpace, overflow: Overflow, full: Size): void
  didLayout?(space: ChartSpace, full: Size): void
  onHoverBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onHoverEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onHoverMove?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  mayPan?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean
  onPanBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onPanEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onPanMove?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
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

  protected onHoverMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onHoverMove(cursor, point, space, isTouch)
    for (const component of this.components) component.onHoverMove?.(cursor, point, space, isTouch, this)
  }

  protected onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onPanBegin(cursor, point, space, isTouch)
    for (const component of this.components) component.onPanBegin?.(cursor, point, space, isTouch, this)
  }

  protected onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onPanEnd(cursor, point, space, isTouch)
    for (const component of this.components) component.onPanEnd?.(cursor, point, space, isTouch, this)
  }

  protected mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    for (const component of this.components) {
      if (component.mayPan?.(cursor, point, space, isTouch, this)) return true
    }
    return false
  }

  protected onPanMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onPanMove(cursor, point, space, isTouch)
    for (const component of this.components) component.onPanMove?.(cursor, point, space, isTouch, this)
  }

  didLayout(space: ChartSpace, full: Size): void {
    super.didLayout(space, full)
    for (const component of this.components) component.didLayout?.(space, full)
  }
}
