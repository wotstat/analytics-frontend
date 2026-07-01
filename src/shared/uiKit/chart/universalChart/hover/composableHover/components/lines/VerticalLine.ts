import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { Position, InteractionDirection } from '../../../BasePlotHover'
import { ComposableHover } from '../../ComposableHover'
import { BaseLine } from './BaseLine'

export class VerticalLine extends BaseLine {

  setLinePosition(point: Point, space: ChartSpace): void {
    this.line.setAttribute('x1', point.x.toString())
    this.line.setAttribute('y1', (space.layout.y + this.offset.start).toString())
    this.line.setAttribute('x2', point.x.toString())
    this.line.setAttribute('y2', (space.layout.y + space.layout.height - this.offset.end).toString())
  }

  mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection {
    return 'horizontal'
  }
}