import { Overflow, Size, UniversalChart } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../../plot/BasePlotRenderer'
import { StartState } from './states/StartState'
import { State, StateMachine } from './StateMachine'
import { BaseState, Context } from './states/BaseState'

export type InteractionDirection = 'horizontal' | 'vertical' | 'all' | false

export type Position = { offsetX: number, offsetY: number, clientX: number, clientY: number }
export type TouchZoomPoint = { cursor: Position, point: Point }

export type Delegate = {
  mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection
  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean
  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean
  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean

  mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection
  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean
  onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean
  onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean

  mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): InteractionDirection
  onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean
  onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean
  onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean

  onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean
}

export abstract class BasePlotHover extends BasePlotRenderer {

  readonly interactiveZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

  private interactiveZoneHash = ''
  private interactiveZoneRect = new DOMRect()
  protected interactiveZoneOffsets = { x: 0, y: 0 }

  private listenersAbortController = new AbortController()
  get listenerAbortSignal() { return this.listenersAbortController.signal }

  protected readonly stateMachine = new StateMachine<Context, BaseState>(new StartState(), {
    delegate: this.createDelegate(),

    toggleClass: this.toggleClass.bind(this),
    capturePointer: (pointerId: number) => this.interactiveZone.setPointerCapture(pointerId),
    releasePointer: (pointerId: number) => this.interactiveZone.releasePointerCapture(pointerId),
    offsetToChart: (event: { offsetX: number, offsetY: number }) => this.offsetToChart(event),
    chartToPage: (point: Point) => this.chartToPage(point),
    requestRender: () => this.requestRender(),
    chart: () => this.chart!
  })

  get currentState() { return this.stateMachine.currentState }

  constructor(classes: Classes = []) {
    super(classes)

    this.root.appendChild(this.interactiveZone)
    this.interactiveZone.classList.add('interactive-zone')
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    super.attach(root, chart)

    this.listenersAbortController.abort()
    this.listenersAbortController = new AbortController()

    this.interactiveZone.addEventListener('pointerenter', this.onPointerEnter.bind(this), { signal: this.listenerAbortSignal })
    this.interactiveZone.addEventListener('pointerdown', this.onPointerDown.bind(this), { signal: this.listenerAbortSignal })
    this.interactiveZone.addEventListener('pointermove', this.onPointerMove.bind(this), { signal: this.listenerAbortSignal })
    this.interactiveZone.addEventListener('pointerleave', this.onPointerLeave.bind(this), { signal: this.listenerAbortSignal })
    this.interactiveZone.addEventListener('pointerup', this.onPointerUp.bind(this), { signal: this.listenerAbortSignal })
    this.interactiveZone.addEventListener('pointercancel', this.onPointerCancel.bind(this), { signal: this.listenerAbortSignal })

    this.interactiveZone.addEventListener('contextmenu', this.onContextmenu.bind(this), { signal: this.listenerAbortSignal })
    this.interactiveZone.addEventListener('touchmove', this.touchMove.bind(this), { signal: this.listenerAbortSignal })
    this.interactiveZone.addEventListener('wheel', this.onWheel.bind(this), { signal: this.listenerAbortSignal })
  }

  detach(): void {
    super.detach()
    this.listenersAbortController.abort()
  }

  protected touchMove(event: TouchEvent) {
    this.currentState.onTouchMove(event)
  }

  protected onContextmenu(event: PointerEvent) {
    this.currentState.onContextmenu(event)
  }

  protected onPointerEnter(event: PointerEvent) {
    this.currentState.onPointerEnter(event)
  }

  protected onPointerDown(event: PointerEvent) {
    this.currentState.onPointerDown(event)
  }

  protected onPointerMove(event: PointerEvent) {
    this.currentState.onPointerMove(event)
  }

  protected onPointerLeave(event: PointerEvent) {
    this.currentState.onPointerLeave(event)
  }

  protected onPointerUp(event: PointerEvent) {
    this.currentState.onPointerUp(event)
  }

  protected onPointerCancel(event: PointerEvent) {
    this.currentState.onPointerCancel(event)
  }

  protected onWheel(event: WheelEvent) {
    this.currentState.onWheel(event)
  }

  protected beforeLayoutImpl(space: ChartSpace, full: Size) {
    this.onBeforeLayout(space, full)
  }

  didLayout(space: ChartSpace, full: Size): void {
    super.didLayout(space, full)
    this.interactiveZoneOffsets = { x: space.layout.x, y: space.layout.y }


    const key = space.getLayoutHash()
    if (this.interactiveZoneHash === key) return
    this.interactiveZoneHash = key
    this.interactiveZone.setAttribute('x', space.layout.x.toString())
    this.interactiveZone.setAttribute('y', space.layout.y.toString())
    this.interactiveZone.setAttribute('width', space.layout.width.toString())
    this.interactiveZone.setAttribute('height', space.layout.height.toString())
  }

  protected afterLayoutImpl(space: ChartSpace, overflow: Overflow, full: Size) {
    this.interactiveZoneRect = this.interactiveZone.getBoundingClientRect()
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
    this.onRender(space, overflow, full)
  }

  protected toggleClass(className: string, enabled: boolean) {
    this.root.classList.toggle(className, enabled)
  }

  protected createDelegate(): Delegate {
    const t = this

    return {
      mayHover: this.mayHover.bind(this),
      onHoverBegin: (cursor, point, space, isTouch) => {
        const used = this.onHoverBegin(cursor, point, space, isTouch)
        if (used) this.requestRender()
        return used
      },
      onHoverUpdate: (cursor, point, space, isTouch) => {
        const used = this.onHoverUpdate(cursor, point, space, isTouch)
        if (used) this.requestRender()
        return used
      },
      onHoverEnd: (cursor, point, space, isTouch) => {
        const used = this.onHoverEnd(cursor, point, space, isTouch)
        if (used) this.requestRender()
        return used
      },

      mayPan: this.mayPan.bind(this),
      onPanBegin: (cursor, point, space, isTouch) => {
        const used = this.onPanBegin(cursor, point, space, isTouch)
        if (used) this.requestRender()
        return used
      },
      onPanUpdate: (cursor, point, space, isTouch) => {
        const used = this.onPanUpdate(cursor, point, space, isTouch)
        if (used) this.requestRender()
        return used
      },
      onPanEnd: (cursor, point, space, isTouch) => {
        const used = this.onPanEnd(cursor, point, space, isTouch)
        if (used) this.requestRender()
        return used
      },

      mayTouchZoom: this.mayTouchZoom.bind(this),
      onTouchZoomBegin: (first, second, space) => {
        const used = this.onTouchZoomBegin(first, second, space)
        if (used) this.requestRender()
        return used
      },
      onTouchZoomUpdate: (first, second, space) => {
        const used = this.onTouchZoomUpdate(first, second, space)
        if (used) this.requestRender()
        return used
      },
      onTouchZoomEnd: (first, second, space) => {
        const used = this.onTouchZoomEnd(first, second, space)
        if (used) this.requestRender()
        return used
      },

      onWheelZoom: (cursor, point, space, deltaY, deltaX) => {
        const used = this.onWheelZoom(cursor, point, space, deltaY, deltaX)
        if (used) this.requestRender()
        return used
      },
    }
  }

  protected onBeforeLayout(space: ChartSpace, full: Size) { }
  protected onRender(space: ChartSpace, overflow: Overflow, full: Size) { }

  protected mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection { return false }
  protected onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }
  protected onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }
  protected onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }

  protected mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection { return false }
  protected onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }
  protected onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }
  protected onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }

  protected mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): InteractionDirection { return false }
  protected onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean { return false }
  protected onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean { return false }
  protected onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean { return false }

  protected onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean { return false }


  offsetToChart(event: { offsetX: number, offsetY: number }): Point {
    const x = this.chart!.space.layout.x + event.offsetX - this.interactiveZoneOffsets.x
    const y = this.chart!.space.layout.y + event.offsetY - this.interactiveZoneOffsets.y

    return { x, y }
  }

  chartToPage(point: Point): Point {
    const x = point.x - this.chart!.space.layout.x + this.interactiveZoneRect.left
    const y = point.y - this.chart!.space.layout.y + this.interactiveZoneRect.top

    return { x, y }
  }

}
