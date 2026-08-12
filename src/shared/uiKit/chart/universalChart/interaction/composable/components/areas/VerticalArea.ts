import { ChartSpace } from '../../../../utils/ChartSpace'
import { InteractionGeometry } from '../../../core/InteractionGeometry'
import { InteractionHit } from '../../../core/InteractionHit'
import { BaseArea } from './BaseArea'

export class VerticalArea<THit extends InteractionHit = InteractionHit> extends BaseArea<THit> {

  protected range(geometry: InteractionGeometry): readonly [number, number] {
    return geometry.xRange
  }

  protected place(rect: SVGRectElement, range: readonly [number, number], space: ChartSpace): void {
    rect.setAttribute('x', range[0].toString())
    rect.setAttribute('y', space.layout.y.toString())
    rect.setAttribute('width', (range[1] - range[0]).toString())
    rect.setAttribute('height', space.layout.height.toString())
  }
}
