import { UniversalChart } from '../../../UniversalChart'
import { Point } from '../../../utils/Point'
import { Position } from '../BasePlotHover'
import { Delegate } from '../BasePlotHover'
import { State, StateMachine } from '../StateMachine'

function event2Position(event: { offsetX: number, offsetY: number, clientX: number, clientY: number }): Position {
  return {
    offsetX: event.offsetX,
    offsetY: event.offsetY,
    clientX: event.clientX,
    clientY: event.clientY
  }
}

export type Context = {
  delegate: Delegate,
  toggleClass: (className: string, enabled: boolean) => void
  capturePointer: (pointerId: number) => void
  releasePointer: (pointerId: number) => void
  offsetToChart: (event: { offsetX: number, offsetY: number }) => Point
  chartToPage: (point: Point) => Point
  requestRender: () => void
  chart: () => UniversalChart
}

export class BaseState implements State<Context> {
  protected readonly delegate!: Delegate
  private readonly stateMachine!: StateMachine<Context, State<Context>>
  private readonly ctx!: Context

  get chart() { return this.ctx.chart() }

  constructor() { }

  setup(stateMachine: StateMachine<Context, State<Context>>, context: Context) {
    // @ts-ignore
    this.delegate = context.delegate
    // @ts-ignore
    this.stateMachine = stateMachine
    // @ts-ignore
    this.ctx = context
  }

  created() { }

  activated() { }

  disposed() { }

  protected changeState(state: BaseState) {
    this.stateMachine.changeState(state)
  }

  protected returnToState(state: BaseState) {
    this.stateMachine.returnToState(state)
  }

  toggleClass(className: string, enabled: boolean) {
    this.ctx.toggleClass(className, enabled)
  }

  capturePointer(pointerId: number) {
    this.ctx.capturePointer(pointerId)
  }

  releasePointer(pointerId: number) {
    this.ctx.releasePointer(pointerId)
  }

  offsetToChart(event: { offsetX: number, offsetY: number }): Point {
    return this.ctx.offsetToChart(event)
  }

  chartToPage(point: Point): Point {
    return this.ctx.chartToPage(point)
  }

  event2Position(event: { offsetX: number, offsetY: number, clientX: number, clientY: number }): Position {
    return event2Position(event)
  }

  requestRender() {
    this.ctx.requestRender()
  }

  onTouchMove(event: TouchEvent) { }

  onContextmenu(event: PointerEvent) { }

  onPointerEnter(event: PointerEvent) { }

  onPointerDown(event: PointerEvent) { }

  onPointerMove(event: PointerEvent) { }

  onPointerLeave(event: PointerEvent) { }

  onPointerUp(event: PointerEvent) { }

  onPointerCancel(event: PointerEvent) { }

  onWheel(event: WheelEvent) { }

}