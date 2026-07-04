import { Point } from '../../../../utils/Point'
import { Position } from '../../BasePlotHover'
import { BaseState } from '../BaseState'
import { BaseSingleTouchEvent } from './BaseSingleTouchEvent'
import { TouchZoomState } from './TouchZoomState'

const CLASS_NAME = 'hover-active'

export class TouchHoverState extends BaseSingleTouchEvent {

  constructor(activeEvent: PointerEvent) {
    super(activeEvent, CLASS_NAME)
  }

  getZoomEvent(firstEvent: PointerEvent, secondEvent: PointerEvent): BaseState {
    return new TouchZoomState(firstEvent, secondEvent)
  }

  beginEvent(pos: Position, point: Point, space: any): void {
    this.delegate.onHoverBegin(pos, point, space, true)
  }

  updateEvent(pos: Position, point: Point, space: any): void {
    this.delegate.onHoverUpdate(pos, point, space, true)
  }

  endEvent(pos: Position, point: Point, space: any): void {
    this.delegate.onHoverEnd(pos, point, space, true)
  }
}