import { ChartSpace } from '../../../utils/ChartSpace'
import { Point } from '../../../utils/Point'
import { Classes } from '../../../utils/utils'
import { BasePlotHover } from '../BasePlotHover'

export interface HoverComponent {
  attach?(root: SVGGElement, composable: ComposableHover): void
  onEnter?(point: Point, space: ChartSpace, composable: ComposableHover): void
  onLeave?(point: Point, space: ChartSpace, composable: ComposableHover): void
  onPositionChange?(point: Point, space: ChartSpace, composable: ComposableHover): void
}

export class ComposableHover extends BasePlotHover {

  private readonly componentsRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  private components: HoverComponent[] = []

  constructor(classes: Classes = []) {
    super(classes)

    this.componentsRoot.classList.add('hover-components')
    this.root.appendChild(this.componentsRoot)
  }

  addComponent(component: HoverComponent) {
    this.components.push(component)
    component.attach?.(this.componentsRoot, this)

    return this
  }

  protected onEnter(point: Point, space: ChartSpace): void {
    super.onEnter(point, space)
    for (const component of this.components) component.onEnter?.(point, space, this)
  }

  protected onLeave(point: Point, space: ChartSpace): void {
    super.onLeave(point, space)
    for (const component of this.components) component.onLeave?.(point, space, this)
  }

  protected onPositionChange(point: Point, space: ChartSpace): void {
    super.onPositionChange(point, space)
    for (const component of this.components) component.onPositionChange?.(point, space, this)
  }
}