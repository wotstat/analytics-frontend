import { Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotHover } from '../BasePlotHover'

export interface HoverComponent {
  attach?(root: SVGGElement, composable: ComposableHover): void
  detach?(): void
  beforeLayoutChange?(interactiveZoneRect: DOMRect): void
  didLayout?(space: ChartSpace, full: Size): void
  onEnter?(cursor: Point, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onLeave?(cursor: Point, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
  onPositionChange?(cursor: Point, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void
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

  protected beforeLayoutChange(interactiveZoneRect: DOMRect): void {
    super.beforeLayoutChange(interactiveZoneRect)
    for (const component of this.components) component.beforeLayoutChange?.(interactiveZoneRect)
  }

  protected onEnter(cursor: Point, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onEnter(cursor, point, space, isTouch)
    for (const component of this.components) component.onEnter?.(cursor, point, space, isTouch, this)
  }

  protected onLeave(cursor: Point, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onLeave(cursor, point, space, isTouch)
    for (const component of this.components) component.onLeave?.(cursor, point, space, isTouch, this)
  }

  protected onPositionChange(cursor: Point, point: Point, space: ChartSpace, isTouch: boolean): void {
    super.onPositionChange(cursor, point, space, isTouch)
    for (const component of this.components) component.onPositionChange?.(cursor, point, space, isTouch, this)
  }

  didLayout(space: ChartSpace, full: Size): void {
    super.didLayout(space, full)
    for (const component of this.components) component.didLayout?.(space, full)
  }
}