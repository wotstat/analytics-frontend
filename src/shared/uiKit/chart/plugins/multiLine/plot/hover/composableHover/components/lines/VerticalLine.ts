import { ChartSpace } from '../../../../../utils/ChartSpace'
import { Point } from '../../../../../utils/Point'
import { BaseLine } from './BaseLine'

export class VerticalLine extends BaseLine {

  onPositionChange(point: Point, space: ChartSpace): void {
    this.line.setAttribute('x1', point.x.toString())
    this.line.setAttribute('y1', (space.layout.y + this.offset.start).toString())
    this.line.setAttribute('x2', point.x.toString())
    this.line.setAttribute('y2', (space.layout.y + space.layout.height - this.offset.end).toString())
  }

}