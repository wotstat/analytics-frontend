import { Point } from '../../../../utils/Point'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Position } from '../../BaseInteractionController'
import { BaseState } from '../BaseState'
import { ClickCandidate } from '../ClickCandidate'
import { BaseSingleTouchEvent } from './BaseSingleTouchEvent'
import { TouchZoomState } from './TouchZoomState'

const CLASS_NAME = 'pan-active'

export class TouchPanState extends BaseSingleTouchEvent {

  constructor(activeEvent: PointerEvent, click?: ClickCandidate) {
    super(activeEvent, CLASS_NAME, click)
  }

  getZoomEvent(firstEvent: PointerEvent, secondEvent: PointerEvent): BaseState {
    return new TouchZoomState(firstEvent, secondEvent)
  }

  beginEvent(pos: Position, point: Point, space: ChartSpace): void {
    this.delegate.onPanBegin(pos, point, space, true)
  }

  updateEvent(pos: Position, point: Point, space: ChartSpace): void {
    this.delegate.onPanUpdate(pos, point, space, true)
  }

  endEvent(pos: Position, point: Point, space: ChartSpace): void {
    this.delegate.onPanEnd(pos, point, space, true)
  }
}
