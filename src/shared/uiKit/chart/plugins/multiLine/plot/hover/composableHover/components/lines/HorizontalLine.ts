import { ChartSpace } from '../../../../../utils/ChartSpace'
import { Point } from '../../../../../utils/Point'
import { HoveredDataPoint } from '../../../BasePlotHover'
import { BaseLine } from './BaseLine'

export class HorizontalLine extends BaseLine {

  setLinePosition(point: Point, space: ChartSpace): void {
    this.line.setAttribute('x1', (space.layout.x + this.offset.start).toString())
    this.line.setAttribute('y1', point.y.toString())
    this.line.setAttribute('x2', (space.layout.x + space.layout.width - this.offset.end).toString())
    this.line.setAttribute('y2', point.y.toString())
  }

}