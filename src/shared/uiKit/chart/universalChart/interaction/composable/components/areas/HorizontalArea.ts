import { ChartSpace } from '../../../../utils/ChartSpace'
import { InteractionGeometry } from '../../../core/InteractionGeometry'
import { InteractionHit } from '../../../core/InteractionHit'
import { BaseArea } from './BaseArea'

export class HorizontalArea<THit extends InteractionHit = InteractionHit> extends BaseArea<THit> {

  protected range(geometry: InteractionGeometry): readonly [number, number] {
    return geometry.yRange
  }

  protected place(rect: SVGRectElement, range: readonly [number, number], space: ChartSpace): void {
    rect.setAttribute('x', space.layout.x.toString())
    rect.setAttribute('y', range[0].toString())
    rect.setAttribute('width', space.layout.width.toString())
    rect.setAttribute('height', (range[1] - range[0]).toString())
  }
}
