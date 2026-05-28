import { ChartSpace } from '../../../../../utils/ChartSpace'
import { Point } from '../../../../../utils/Point'
import { addClasses, Classes } from '../../../../../utils/utils'
import { HoverComponent } from '../../ComposableHover'

type Options = {
  classes?: Classes
  offset?: number | { start?: number, end?: number } | [start: number, end: number]
}

export abstract class BaseLine implements HoverComponent {

  protected line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  protected offset: { start: number, end: number }

  constructor(options: Options = {}) {
    addClasses(this.line, 'hover-line', 'vertical', options.classes)

    if (typeof options.offset === 'number') {
      this.offset = { start: options.offset, end: options.offset }
    } else if (Array.isArray(options.offset)) {
      this.offset = { start: options.offset[0], end: options.offset[1] }
    } else if (options.offset) {
      this.offset = { start: options.offset.start ?? 0, end: options.offset.end ?? 0 }
    } else {
      this.offset = { start: 0, end: 0 }
    }
  }

  attach(root: SVGGElement): void {
    root.appendChild(this.line)
  }

  onEnter(point: Point, space: ChartSpace): void {
    this.line.classList.add('visible')
  }

  onLeave(point: Point, space: ChartSpace): void {
    this.line.classList.remove('visible')
  }

  abstract onPositionChange(point: Point, space: ChartSpace): void

}