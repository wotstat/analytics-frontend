import { ChartSpace } from '../../../../utils/ChartSpace'
import { InteractionGeometry } from '../../../core/InteractionGeometry'
import { BaseLine } from './BaseLine'

export class HorizontalLine extends BaseLine {

  protected coordinate(geometry: InteractionGeometry): number {
    return geometry.anchor.y
  }

  protected place(line: SVGLineElement, y: number, space: ChartSpace): void {
    line.setAttribute('x1', (space.layout.x + this.offset.start).toString())
    line.setAttribute('y1', y.toString())
    line.setAttribute('x2', (space.layout.x + space.layout.width - this.offset.end).toString())
    line.setAttribute('y2', y.toString())
  }
}
