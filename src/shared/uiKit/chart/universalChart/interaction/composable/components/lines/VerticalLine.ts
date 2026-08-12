import { ChartSpace } from '../../../../utils/ChartSpace'
import { InteractionGeometry } from '../../../core/InteractionGeometry'
import { BaseLine } from './BaseLine'

export class VerticalLine extends BaseLine {

  protected coordinate(geometry: InteractionGeometry): number {
    return geometry.anchor.x
  }

  protected place(line: SVGLineElement, x: number, space: ChartSpace): void {
    line.setAttribute('x1', x.toString())
    line.setAttribute('y1', (space.layout.y + this.offset.start).toString())
    line.setAttribute('x2', x.toString())
    line.setAttribute('y2', (space.layout.y + space.layout.height - this.offset.end).toString())
  }
}
