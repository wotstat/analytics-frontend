import { Overflow, Size } from '../../UniversalChart'
import { BasePlotRenderer } from '../../plot/BasePlotRenderer'
import { ChartSpace } from '../../utils/ChartSpace'
import { Classes, joinClasses } from '../../utils/utils'


export type Axis = 'vertical' | 'horizontal'

export class ChartAxis extends BasePlotRenderer {

  private line = document.createElementNS('http://www.w3.org/2000/svg', 'line')

  constructor(private axis: Axis, private value: number, classes: Classes = [], options: { affectsBounds?: boolean } = {}) {
    super(joinClasses('chart-axis', classes), options)
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
    const vertical = this.axis === 'vertical'

    const p = vertical ? space.chartToLayoutY(this.value) : space.chartToLayoutX(this.value)
    const min = vertical ? space.layout.y : space.layout.x
    const max = min + (vertical ? space.layout.height : space.layout.width)

    if (!(p >= min && p <= max)) {
      this.line.remove()
      return
    }

    if (vertical) {
      this.setLine(space.layout.x, p, space.layout.x + space.layout.width, p)
    } else {
      this.setLine(p, space.layout.y, p, space.layout.y + space.layout.height)
    }

    if (!this.line.parentNode) this.root.appendChild(this.line)
  }

  private setLine(x1: number, y1: number, x2: number, y2: number) {
    this.line.setAttribute('x1', x1.toString())
    this.line.setAttribute('y1', y1.toString())
    this.line.setAttribute('x2', x2.toString())
    this.line.setAttribute('y2', y2.toString())
  }
}
