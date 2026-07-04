import { Point } from '../../../../utils/Point'
import { Position } from '../../BasePlotHover'
import { BaseState } from '../BaseState'
import { BaseSingleTouchEvent } from './BaseSingleTouchEvent'
import { TouchZoomState } from './TouchZoomState'

const CLASS_NAME = 'pan-active'

export class TouchPanState extends BaseSingleTouchEvent {

  constructor(activeEvent: PointerEvent) {
    super(activeEvent, CLASS_NAME)
  }

  getZoomEvent(firstEvent: PointerEvent, secondEvent: PointerEvent): BaseState {
    return new TouchZoomState(firstEvent, secondEvent)
  }

  beginEvent(pos: Position, point: Point, space: any): void {
    this.delegate.onPanBegin(pos, point, space, true)
  }

  updateEvent(pos: Position, point: Point, space: any): void {
    this.delegate.onPanUpdate(pos, point, space, true)
  }

  endEvent(pos: Position, point: Point, space: any): void {
    this.delegate.onPanEnd(pos, point, space, true)
  }
}