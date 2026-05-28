import { Overflow, Size } from '../../MultiLine'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'

export abstract class BasePlotHover extends BasePlotRenderer {

  private readonly interactiveZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

  constructor(classes: Classes = []) {
    super(classes)

    this.root.appendChild(this.interactiveZone)
    this.interactiveZone.classList.add('interactive-zone')

    this.interactiveZone.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.interactiveZone.addEventListener('mouseleave', this.onMouseLeave.bind(this))
    this.interactiveZone.addEventListener('mouseenter', this.onMouseEnter.bind(this))
  }

  protected onMouseMove(event: MouseEvent) {
    this.updateMouse(event)
  }

  protected onMouseEnter(event: MouseEvent) {
    this.root.classList.add('hovered')
    if (this.multiLine) this.onEnter(this.getLocalPoint(event), this.multiLine.mainSpace)
    this.updateMouse(event)
  }

  protected onMouseLeave(event: MouseEvent) {
    this.root.classList.remove('hovered')
    if (this.multiLine) this.onLeave(this.getLocalPoint(event), this.multiLine.mainSpace)
  }

  private updateMouse(event: MouseEvent) {
    if (this.multiLine) this.onPositionChange(this.getLocalPoint(event), this.multiLine.mainSpace)
  }

  private getLocalPoint(event: MouseEvent): Point {
    const rect = this.interactiveZone.getBoundingClientRect()
    const x = this.multiLine!.mainSpace.layout.x + event.clientX - rect.left
    const y = this.multiLine!.mainSpace.layout.y + event.clientY - rect.top

    return { x, y }
  }

  abstract onEnter(point: Point, space: ChartSpace): void
  abstract onLeave(point: Point, space: ChartSpace): void
  abstract onPositionChange(point: Point, space: ChartSpace): void

  didLayout(space: ChartSpace, full: Size): void {
    this.interactiveZone.setAttribute('x', space.layout.x.toString())
    this.interactiveZone.setAttribute('y', space.layout.y.toString())
    this.interactiveZone.setAttribute('width', space.layout.width.toString())
    this.interactiveZone.setAttribute('height', space.layout.height.toString())
  }
}