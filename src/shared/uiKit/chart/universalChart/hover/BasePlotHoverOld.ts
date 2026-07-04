// import { Overflow, Size, UniversalChart } from '../UniversalChart'
// import { ChartSpace } from '../utils/ChartSpace'
// import { Point } from '../utils/Point'
// import { Classes } from '../utils/utils'
// import { BasePlotRenderer } from '../plot/BasePlotRenderer'

// export type InteractionDirection = 'horizontal' | 'vertical' | 'all' | false

// export type Position = { offsetX: number, offsetY: number, clientX: number, clientY: number }
// export type TouchZoomPoint = { cursor: Position, point: Point }

// function allowDirection(direction: InteractionDirection, dx: number, dy: number): boolean {
//   if (direction === 'all') return true
//   if (direction === 'horizontal') return Math.abs(dx) > Math.abs(dy)
//   if (direction === 'vertical') return Math.abs(dy) > Math.abs(dx)
//   return false
// }

// function event2Position(event: { offsetX: number, offsetY: number, clientX: number, clientY: number }): Position {
//   return {
//     offsetX: event.offsetX,
//     offsetY: event.offsetY,
//     clientX: event.clientX,
//     clientY: event.clientY
//   }
// }

// const HOVER_BEGIN_TIMEOUT = 75
// const HOVER_BEGIN_DISTANCE = 0
// const PAN_BEGIN_TIMEOUT = 200
// const PAN_BEGIN_DISTANCE = 0

// export abstract class BasePlotHover extends BasePlotRenderer {

//   readonly interactiveZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

//   protected lastMousePosition: Position | null = null

//   private interactiveZoneHash = ''
//   private interactiveZoneRect = new DOMRect()
//   protected interactiveZoneOffsets = { x: 0, y: 0 }

//   private listenersAbortController = new AbortController()
//   get listenerAbortSignal() { return this.listenersAbortController.signal }

//   private awaitPanBegin: {
//     dir: InteractionDirection
//     timeoutId: number
//     pointerId: number
//   } | null = null

//   private awaitHoverBegin: {
//     dir: InteractionDirection
//     timeoutId: number
//     pointerId: number
//   } | null = null

//   private hoverActive = false
//   private panActive = false
//   private hoverIsTouch = false
//   private panIsTouch = false
//   private touchZoomActive = false

//   private activeTouchPointers = new Map<number, Position>()
//   private touchZoomPointerIds: [number, number] | null = null
//   private awaitPanAfterZoomPointerId: number | null = null
//   private panPointerId: number | null = null
//   private hoverPointerId: number | null = null


//   constructor(classes: Classes = []) {
//     super(classes)

//     this.root.appendChild(this.interactiveZone)
//     this.interactiveZone.classList.add('interactive-zone')
//   }

//   attach(root: SVGGElement, chart: UniversalChart): void {
//     super.attach(root, chart)

//     this.listenersAbortController.abort()
//     this.listenersAbortController = new AbortController()

//     this.interactiveZone.addEventListener('pointerenter', this.onPointerEnter.bind(this), { signal: this.listenerAbortSignal })
//     this.interactiveZone.addEventListener('pointerdown', this.onPointerDown.bind(this), { signal: this.listenerAbortSignal })
//     this.interactiveZone.addEventListener('pointermove', this.onPointerMove.bind(this), { signal: this.listenerAbortSignal })
//     this.interactiveZone.addEventListener('pointerleave', this.onPointerLeave.bind(this), { signal: this.listenerAbortSignal })
//     this.interactiveZone.addEventListener('pointerup', this.onPointerUp.bind(this), { signal: this.listenerAbortSignal })
//     this.interactiveZone.addEventListener('pointercancel', this.onPointerCancel.bind(this), { signal: this.listenerAbortSignal })

//     this.interactiveZone.addEventListener('contextmenu', this.onContextmenu.bind(this), { signal: this.listenerAbortSignal })
//     this.interactiveZone.addEventListener('touchmove', this.touchMove.bind(this), { signal: this.listenerAbortSignal })
//     this.interactiveZone.addEventListener('wheel', this.onWheel.bind(this), { signal: this.listenerAbortSignal })
//   }

//   detach(): void {
//     super.detach()
//     this.listenersAbortController.abort()
//     this.activeTouchPointers.clear()
//     this.touchZoomPointerIds = null
//     this.awaitPanAfterZoomPointerId = null
//     this.panPointerId = null
//     this.touchZoomActive = false
//     this.hoverActive = false
//     this.panActive = false
//     this.awaitPanBegin = false
//     this.awaitHoverBegin = false
//   }

//   //#region Events default preventing

//   protected touchMove(event: TouchEvent) {
//     if (this.panActive || this.hoverActive || this.touchZoomActive) {
//       event.preventDefault()
//       event.stopPropagation()
//     }
//   }

//   protected onContextmenu(event: PointerEvent) {

//     if (this.hoverActive && event.pointerType === 'touch') {
//       event.preventDefault()
//       event.stopPropagation()
//     }

//     if (this.panActive) {
//       event.preventDefault()
//       event.stopPropagation()
//     }
//   }

//   //#endregion

//   // ================================
//   // ======= On Pointer Enter =======
//   // ================================
//   protected onPointerEnter(event: PointerEvent) {
//     if (!this.chart) return
//     if (event.pointerType === 'touch') return

//     this.lastMousePosition = event2Position(event)
//     this.beginHover(this.lastMousePosition, this.offsetToChart(this.lastMousePosition), this.chart.space, false, event.pointerId)
//   }

//   // ===============================
//   // ======= On Pointer Down =======
//   // ===============================
//   protected onPointerDown(event: PointerEvent) {
//     if (!this.chart) return
//     if ((event.buttons & 1) !== 1) return

//     const pos = event2Position(event)
//     const point = this.offsetToChart(pos)
//     this.lastMousePosition = pos

//     const isTouch = event.pointerType === 'touch'
//     const mayPan = this.mayPan(pos, point, this.chart.space, isTouch)

//     if (isTouch) {
//       const mayHover = this.mayHover(pos, point, this.chart.space, true)
//       this.onPointerDownTouch(event, point, mayPan, mayHover)
//     } else {
//       if (mayPan && !this.panActive) this.beginPan(pos, point, this.chart.space, false, event.pointerId)
//     }
//   }

//   private onPointerDownTouch(event: PointerEvent, point: Point, mayPan: InteractionDirection, mayHover: InteractionDirection) {
//     if (!this.chart) return

//     this.captureEvent(event)

//     if (this.touchZoomActive) return

//     if (this.activeTouchPointers.size >= 2) {
//       const points = this.getTouchZoomPoints()
//       if (!points) return

//       if (this.hoverActive) this.onHoverEnd(points[0].cursor, points[0].point, this.chart.space, true)
//       if (this.panActive) this.onPanEnd(points[0].cursor, points[0].point, this.chart.space, true)

//       this.cancelAwaitHover()
//       this.cancelAwaitPan()

//       this.onTouchZoomBegin(points[0], points[1], this.chart.space)
//       return
//     }

//     if (mayHover) {
//       this.awaitHover(mayHover, event.pointerId, mayPan ? PAN_BEGIN_TIMEOUT : HOVER_BEGIN_TIMEOUT)
//     }
//   }

//   private getTouchZoomPoints(): [TouchZoomPoint, TouchZoomPoint] | null {
//     if (!this.chart) return null

//     if (!this.touchZoomPointerIds) {
//       const ids = [...this.activeTouchPointers.keys()]
//       if (ids.length < 2) return null
//       this.touchZoomPointerIds = [ids[0], ids[1]]
//     }

//     const firstCursor = this.activeTouchPointers.get(this.touchZoomPointerIds[0])
//     const secondCursor = this.activeTouchPointers.get(this.touchZoomPointerIds[1])
//     if (!firstCursor || !secondCursor) return null

//     return [
//       { cursor: firstCursor, point: this.offsetToChart(firstCursor) },
//       { cursor: secondCursor, point: this.offsetToChart(secondCursor) },
//     ]
//   }

//   private awaitHover(dir: InteractionDirection, pointerId: number, timeout: number = HOVER_BEGIN_TIMEOUT) {
//     if (this.awaitHoverBegin) clearTimeout(this.awaitHoverBegin.timeoutId)
//     this.awaitHoverBegin = {
//       dir,
//       pointerId,
//       timeoutId: setTimeout(this.onHoverBeginTimeout.bind(this), timeout)
//     }
//   }

//   private cancelAwaitHover() {
//     if (!this.awaitHoverBegin) return
//     clearTimeout(this.awaitHoverBegin.timeoutId)
//     this.awaitHoverBegin = null
//   }

//   private beginTouchZoom_OLD() {
//     if (!this.chart) return

//     this.awaitPanAfterZoomPointerId = null
//     this.panPointerId = null
//     this.cancelAwaitPan()
//     this.cancelAwaitHover()

//     const points = this.getTouchZoomPoints()
//     if (!points) return

//     if (this.hoverActive && this.hoverIsTouch) this.onHoverEnd(points[0].cursor, points[0].point, this.chart.space, true)
//     if (this.panActive && this.panIsTouch) this.onPanEnd(points[0].cursor, points[0].point, this.chart.space, true)

//     // if (!this.onTouchZoomBegin(points[0], points[1], this.chart.space)) {
//     //   this.touchZoomPointerIds = null
//     //   return
//     // }

//     this.touchZoomActive = true
//     this.root.classList.toggle('touch-zoom-active', true)
//     this.requestRender()
//   }

//   private onHoverBeginTimeout() {
//     if (!this.awaitHoverBegin) return
//     const { pointerId } = this.awaitHoverBegin
//     this.awaitHoverBegin = null

//     const pos = this.activeTouchPointers.get(pointerId)
//     if (!pos || !this.chart) return

//     this.beginHover(pos, this.offsetToChart(pos), this.chart.space, true, pointerId)
//   }

//   private onPanBeginTimeout() {
//     if (!this.awaitPanBegin) return
//     const { pointerId } = this.awaitPanBegin
//     this.awaitPanBegin = null

//     const pos = this.activeTouchPointers.get(pointerId)

//     if (!pos || !this.chart) return
//     this.beginPan(pos, this.offsetToChart(pos), this.chart.space, true, pointerId)
//   }

//   // ===============================
//   // ======= On Pointer Move =======
//   // ===============================
//   protected onPointerMove(event: PointerEvent) {
//     if (!this.chart) return
//     if (!this.activeTouchPointers.has(event.pointerId)) return

//     this.interactiveZoneRect = this.interactiveZone.getBoundingClientRect()

//     const pos = event2Position(event)
//     const lastPos = this.activeTouchPointers.get(event.pointerId)!
//     this.activeTouchPointers.set(event.pointerId, pos)
//     this.lastMousePosition = pos

//     const isTouch = event.pointerType === 'touch'

//     if (isTouch && this.processTouchMove(event, pos, lastPos)) return

//     const point = this.offsetToChart(pos)
//     if (this.panActive && this.panPointerId === event.pointerId && this.onPanUpdate(pos, this.offsetToChart(pos), this.chart.space, isTouch)) this.requestRender()
//     if (this.hoverActive && this.hoverPointerId === event.pointerId && this.onHoverUpdate(pos, point, this.chart.space, isTouch)) this.requestRender()
//   }

//   protected processTouchMove(event: PointerEvent, pos: Position, lastPos: Position) {
//     if (!this.chart) return true

//     if (this.touchZoomActive) {
//       if (!this.touchZoomPointerIds?.includes(event.pointerId)) return true

//       const points = this.getTouchZoomPoints()
//       if (points && this.onTouchZoomUpdate(points[0], points[1], this.chart.space)) this.requestRender()
//       return true
//     }

//     const dx = pos.offsetX - lastPos.offsetX
//     const dy = pos.offsetY - lastPos.offsetY
//     const distance = Math.sqrt(dx * dx + dy * dy)

//     if (this.awaitPanBegin && !this.panActive && distance > PAN_BEGIN_DISTANCE) {
//       const allowBegin = allowDirection(this.awaitPanBegin, dx, dy)
//       this.awaitPanBegin = false
//       clearTimeout(this.awaitPanBeginTimeoutId)
//       if (allowBegin) this.beginPan(pos, this.offsetToChart(pos), this.chart.space, true, event.pointerId)
//     }

//     if (this.awaitHoverBegin && !this.hoverActive && distance > HOVER_BEGIN_DISTANCE) {
//       const allowBegin = allowDirection(this.awaitHoverBegin, dx, dy)
//       this.awaitHoverBegin = false
//       clearTimeout(this.awaitHoverBeginTimeoutId)
//       if (allowBegin) this.beginHover(pos, this.offsetToChart(pos), this.chart.space, true, event.pointerId)
//     }

//     return false
//   }

//   private beginPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, pointerId: number) {
//     this.panPointerId = pointerId
//     this.onPanBegin(cursor, point, space, isTouch)
//   }

//   private beginHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, pointerId: number) {
//     this.hoverPointerId = pointerId
//     this.onHoverBegin(cursor, point, space, isTouch)
//   }

//   // ================================
//   // ======= On Pointer Leave =======
//   // ================================
//   protected onPointerLeave(event: PointerEvent) {
//     if (!this.chart) return
//     if (event.pointerType === 'touch') return

//     const positions = event2Position(event)
//     const point = this.offsetToChart(positions)
//     if (this.hoverActive) this.onHoverEnd(positions, point, this.chart.space, false)
//     this.lastMousePosition = null
//   }



//   // =============================
//   // ======= On Pointer Up =======
//   // =============================
//   protected onPointerUp(event: PointerEvent, cancelled: boolean = false) {
//     if (!this.activeTouchPointers.has(event.pointerId)) return

//     this.cancelAwaitPan()
//     this.cancelAwaitHover()

//     if (event.pointerType === 'touch') this.onPointerUpTouch(event, cancelled)
//     else this.onPointerUpMouse(event, cancelled)
//   }

//   private onPointerUpTouch(event: PointerEvent, cancelled: boolean) {
//     if (!this.chart) return

//     const pos = event2Position(event)

//     this.activeTouchPointers.set(event.pointerId, pos)
//     const touchZoomEnded = this.endTouchZoomIfNeeded(event.pointerId)
//     this.releaseEvent(event)

//     if (this.awaitPanAfterZoomPointerId == event.pointerId) this.awaitPanAfterZoomPointerId = null

//     if (this.activeTouchPointers.size == 1 && touchZoomEnded) {
//       this.awaitPanAfterZoomPointerId = [...this.activeTouchPointers.keys()][0]
//       this.interactiveZone.setPointerCapture(this.awaitPanAfterZoomPointerId)
//     }

//     if (this.hoverActive && this.hoverIsTouch && this.hoverPointerId === event.pointerId) {
//       const ended = this.endTouchHover(pos)
//       this.hoverPointerId = null
//       if (ended) this.requestRender()
//     }

//     if (this.panActive && this.panIsTouch && this.panPointerId === event.pointerId) {
//       this.onPanEnd(pos, this.offsetToChart(pos), this.chart.space, true)
//       this.panPointerId = null
//       this.requestRender()
//     }
//   }

//   private onPointerUpMouse(event: PointerEvent, cancelled: boolean) {
//     if (!this.chart) return

//     this.activeTouchPointers.delete(event.pointerId)
//     this.interactiveZone.releasePointerCapture(event.pointerId)

//     if (this.panActive) {
//       const pos = event2Position(event)
//       this.onPanEnd(pos, this.offsetToChart(pos), this.chart.space, false)
//       this.panPointerId = null
//       this.requestRender()
//     }
//   }

//   protected onPointerCancel(event: PointerEvent) {
//     this.onPointerUp(event, true)
//   }


//   // ================================
//   // ======= On Pointer Wheel =======
//   protected onWheel(event: WheelEvent) {
//     if (!this.chart) return

//     const pos = event2Position(event)
//     const used = this.onWheelZoom(pos, this.offsetToChart(pos), this.chart.space, event.deltaY, event.deltaX)
//     if (used) {
//       event.stopPropagation()
//       event.preventDefault()
//       this.requestRender()
//     }
//   }

//   //#endregion

//   protected beforeLayoutImpl(space: ChartSpace, full: Size) {
//     this.onBeforeLayout(space, full)
//   }


//   protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
//     this.setupInteractiveZone(space)
//     this.onRender(space, overflow, full)
//   }

//   protected setupInteractiveZone(space: ChartSpace) {
//     const key = space.getLayoutHash()
//     if (this.interactiveZoneHash === key) return
//     this.interactiveZoneHash = key
//     this.interactiveZone.setAttribute('x', space.layout.x.toString())
//     this.interactiveZone.setAttribute('y', space.layout.y.toString())
//     this.interactiveZone.setAttribute('width', space.layout.width.toString())
//     this.interactiveZone.setAttribute('height', space.layout.height.toString())
//   }

//   //#region Overridable API

//   protected onBeforeLayout(space: ChartSpace, full: Size) { }
//   protected onRender(space: ChartSpace, overflow: Overflow, full: Size) { }

//   //#region Hover

//   protected mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection { return false }

//   protected onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
//     this.hoverActive = true
//     this.hoverIsTouch = isTouch
//     this.root.classList.toggle('hover-active', true)
//     queueMicrotask(() => this.updateHoverPointer(cursor, isTouch))
//   }

//   protected onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }

//   protected onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
//     this.hoverActive = false
//     this.hoverIsTouch = false
//     this.root.classList.toggle('hover-active', false)
//   }

//   //#endregion

//   //#region Pan

//   protected mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection { return false }

//   protected onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
//     this.panActive = true
//     this.panIsTouch = isTouch
//     this.root.classList.toggle('pan-active', true)
//   }

//   protected onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }

//   protected onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
//     this.panActive = false
//     this.panIsTouch = false
//     this.root.classList.toggle('pan-active', false)
//   }

//   //#endregion

//   //#region Touch Zoom

//   protected mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): InteractionDirection { return false }

//   protected onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): void {
//     this.touchZoomActive = true
//     this.root.classList.toggle('touch-zoom-active', true)
//   }

//   protected onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean { return false }

//   protected onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): void {
//     this.touchZoomActive = false
//     this.root.classList.toggle('touch-zoom-active', false)
//   }

//   //#endregion

//   //#region Wheel Zoom

//   protected onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean { return false }

//   //#endregion

//   //#endregion




//   private endTouchZoomIfNeeded(pointerId: number): boolean {
//     if (!this.chart || !this.touchZoomActive || !this.touchZoomPointerIds?.includes(pointerId)) return false

//     const points = this.getTouchZoomPoints()
//     if (points) {
//       this.onTouchZoomEnd(points[0], points[1], this.chart.space)
//       this.requestRender()
//     }

//     this.touchZoomActive = false
//     this.touchZoomPointerIds = null
//     this.root.classList.toggle('touch-zoom-active', false)

//     return true
//   }

//   private beginPanFromTouch(pointerId: number, cursor: Position) {
//     if (!this.chart) return

//     this.awaitPanAfterZoomPointerId = null
//     this.panPointerId = pointerId
//     this.lastMousePosition = cursor
//     const point = this.offsetToChart(cursor)
//     if (!this.mayPan(cursor, point, this.chart.space, true)) {
//       this.panPointerId = null
//       return
//     }

//     this.onPanBegin(cursor, point, this.chart.space, true)
//   }

//   private endTouchHover(cursor: Position): boolean {
//     if (!this.chart || !this.hoverActive || !this.hoverIsTouch) return false

//     this.onHoverEnd(cursor, this.offsetToChart(cursor), this.chart.space, true)
//     return true
//   }

//   private captureEvent(event: PointerEvent) {
//     this.interactiveZone.setPointerCapture(event.pointerId)
//     this.activeTouchPointers.set(event.pointerId, event2Position(event))
//   }

//   private releaseEvent(event: PointerEvent) {
//     this.interactiveZone.releasePointerCapture(event.pointerId)
//     this.activeTouchPointers.delete(event.pointerId)
//   }

//   offsetToChart(event: { offsetX: number, offsetY: number }): Point {
//     const x = this.chart!.space.layout.x + event.offsetX - this.interactiveZoneOffsets.x
//     const y = this.chart!.space.layout.y + event.offsetY - this.interactiveZoneOffsets.y

//     return { x, y }
//   }

//   chartToPage(point: Point): Point {
//     const x = point.x - this.chart!.space.layout.x + this.interactiveZoneRect.left
//     const y = point.y - this.chart!.space.layout.y + this.interactiveZoneRect.top

//     return { x, y }
//   }

// }
