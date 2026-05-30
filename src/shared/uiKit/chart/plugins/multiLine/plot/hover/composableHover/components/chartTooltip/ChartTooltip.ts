import { ChartSpace } from '../../../../../utils/ChartSpace'
import { Point } from '../../../../../utils/Point'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type Options = {
  position?: 'data-point-x' | 'data-point-y' | 'data-point'
  tooltipOrigin?: 'avg' | 'nearest' | 'cursor'
}

export class ChartTooltip implements HoverComponent {

  constructor(protected options: Options = {}) {
  }

  onLeave(point: Point, space: ChartSpace, composable: ComposableHover): void {

  }

  onPositionChange(point: Point, space: ChartSpace, composable: ComposableHover): void {

  }
}