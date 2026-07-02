import { Overflow, Size, UniversalChart } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { Point } from '../utils/Point'
import { Classes } from '../utils/utils'
import { BasePlotRenderer } from '../plot/BasePlotRenderer'

export type InteractionDirection = 'horizontal' | 'vertical' | 'all' | false

export type Position = { offsetX: number, offsetY: number, clientX: number, clientY: number }

export type DataSource = ({ x: number, y: number } | null)[]

export type HoveredDataPoint = {
  dataSource: DataSource,
  sourceIndex: number,
  pointIndex: number,
  xValue: number,
  yValue: number
  distance: number
}

export function isDataPointEqual(a: HoveredDataPoint, b: HoveredDataPoint): boolean {
  return a.dataSource === b.dataSource &&
    a.pointIndex === b.pointIndex &&
    a.xValue === b.xValue &&
    a.yValue === b.yValue
}

export function isDataPointArrayEqual(a: HoveredDataPoint[], b: HoveredDataPoint[]): boolean {
  if (a.length !== b.length) return false
  return a.every((point, i) => isDataPointEqual(point, b[i]))
}

function event2Position(event: { offsetX: number, offsetY: number, clientX: number, clientY: number }): Position {
  return {
    offsetX: event.offsetX,
    offsetY: event.offsetY,
    clientX: event.clientX,
    clientY: event.clientY
  }
}

const HOVER_BEGIN_TIMEOUT = 75
const HOVER_BEGIN_DISTANCE = 0
const PAN_BEGIN_TIMEOUT = 200
const PAN_BEGIN_DISTANCE = 0

export abstract class BasePlotHover extends BasePlotRenderer {

  readonly interactiveZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  protected dataSources: DataSource[] = []

  private interactiveZoneRect = new DOMRect()

  protected lastNearestDataPoints: HoveredDataPoint[] | null = null
  protected lastNearestXDataPoints: HoveredDataPoint[] | null = null
  protected lastNearestYDataPoints: HoveredDataPoint[] | null = null

  protected lastMousePosition: Position | null = null
  protected interactiveZoneOffsets = { x: 0, y: 0 }
  private interactiveZoneHash = ''

  private interactionController = new AbortController()

  private awaitPanBegin: InteractionDirection = false
  private awaitPanBeginTimeoutId = 0

  private awaitHoverBegin: InteractionDirection = false
  private awaitHoverBeginTimeoutId = 0

  private hoverActive = false
  private panActive = false

  get listenerSignal() {
    return this.interactionController.signal
  }

  constructor(classes: Classes = []) {
    super(classes)

    this.root.appendChild(this.interactiveZone)
    this.interactiveZone.classList.add('interactive-zone')
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    super.attach(root, chart)

    this.interactionController.abort()
    this.interactionController = new AbortController()

    this.interactiveZone.addEventListener('pointermove', this.onPointerMove.bind(this), { signal: this.listenerSignal })
    this.interactiveZone.addEventListener('pointerleave', this.onPointerLeave.bind(this), { signal: this.listenerSignal })
    this.interactiveZone.addEventListener('pointerenter', this.onPointerEnter.bind(this), { signal: this.listenerSignal })
    this.interactiveZone.addEventListener('pointerdown', this.onPointerDown.bind(this), { signal: this.listenerSignal })
    this.interactiveZone.addEventListener('pointercancel', this.onPointerCancel.bind(this), { signal: this.listenerSignal })
    this.interactiveZone.addEventListener('contextmenu', this.onContextmenu.bind(this), { signal: this.listenerSignal })
    this.interactiveZone.addEventListener('touchmove', this.touchMove.bind(this), { signal: this.listenerSignal })

    this.interactiveZone.addEventListener('wheel', this.onWheel.bind(this), { signal: this.listenerSignal })
  }

  detach(): void {
    super.detach()
    this.interactionController.abort()
  }

  protected onWheel(event: WheelEvent) {
    if (!this.chart) return

    const pos = event2Position(event)
    const used = this.onWheelZoom(pos, this.offsetToChart(pos), this.chart.space, event.deltaY, event.deltaX)
    if (used) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  protected touchMove(event: TouchEvent) {
    if (this.panActive || this.hoverActive) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  protected onContextmenu(event: PointerEvent) {

    if (this.hoverActive && event.pointerType === 'touch') {
      event.preventDefault()
      event.stopPropagation()
    }

    if (this.panActive) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  protected onPointerMove(event: PointerEvent) {
    if (!this.chart) return

    const pos = event2Position(event)

    if (this.awaitPanBegin && !this.panActive) {
      const dx = pos.offsetX - this.lastMousePosition!.offsetX
      const dy = pos.offsetY - this.lastMousePosition!.offsetY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > PAN_BEGIN_DISTANCE) {
        clearTimeout(this.awaitPanBeginTimeoutId)

        const allowBegin = this.awaitPanBegin == 'all' ||
          (this.awaitPanBegin == 'horizontal' && Math.abs(dx) > Math.abs(dy)) ||
          (this.awaitPanBegin == 'vertical' && Math.abs(dy) > Math.abs(dx))
        this.awaitPanBegin = false

        if (allowBegin) this.onPanBegin(pos, this.offsetToChart(pos), this.chart.space, event.pointerType === 'touch')
      }
    }

    if (this.awaitHoverBegin && !this.hoverActive) {
      const dx = pos.offsetX - this.lastMousePosition!.offsetX
      const dy = pos.offsetY - this.lastMousePosition!.offsetY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > HOVER_BEGIN_DISTANCE) {
        clearTimeout(this.awaitHoverBeginTimeoutId)

        const allowBegin = this.awaitHoverBegin == 'all' ||
          (this.awaitHoverBegin == 'horizontal' && Math.abs(dx) > Math.abs(dy)) ||
          (this.awaitHoverBegin == 'vertical' && Math.abs(dy) > Math.abs(dx))
        this.awaitHoverBegin = false

        if (allowBegin) this.onHoverBegin(pos, this.offsetToChart(pos), this.chart.space, event.pointerType === 'touch')
      }
    }

    this.lastMousePosition = pos

    if (this.panActive) {
      if (this.onPanMove(pos, this.offsetToChart(pos), this.chart.space, event.pointerType === 'touch'))
        this.requestRender()
    }
    if (this.hoverActive) this.updateHoverPointer(pos, event.pointerType === 'touch')
  }

  protected onPointerEnter(event: PointerEvent) {
    if (!this.chart) return
    this.lastMousePosition = event2Position(event)

    if (event.pointerType == 'mouse' || event.pointerType == 'pen') {
      this.onHoverBegin(this.lastMousePosition, this.offsetToChart(event), this.chart.space, false)
    }
  }

  protected onPointerLeave(event: PointerEvent) {
    if (!this.chart) return

    const positions = event2Position(event)
    if (this.hoverActive) this.onHoverEnd(positions, this.offsetToChart(positions), this.chart.space, false)
    if (this.panActive) this.onPanEnd(positions, this.offsetToChart(positions), this.chart.space, false)
    this.lastMousePosition = null
  }

  protected onPointerDown(event: PointerEvent) {
    if (!this.chart) return
    if ((event.buttons & 1) !== 1) return

    this.lastMousePosition = event2Position(event)
    this.interactiveZone.setPointerCapture(event.pointerId)
    document.addEventListener('pointerup', this.onPointerUp.bind(this), { once: true, signal: this.listenerSignal })

    const isTouch = event.pointerType === 'touch'

    const mayPan = this.mayPan(this.lastMousePosition, this.offsetToChart(this.lastMousePosition), this.chart.space, isTouch)
    if (mayPan) {
      if (event.pointerType === 'touch') {
        this.awaitPanBegin = mayPan
        clearTimeout(this.awaitPanBeginTimeoutId)
        this.awaitPanBeginTimeoutId = setTimeout(this.onPanBeginTimeout.bind(this), PAN_BEGIN_TIMEOUT)
        return
      } else {
        this.onPanBegin(this.lastMousePosition, this.offsetToChart(this.lastMousePosition), this.chart.space, isTouch)
      }
    }

    const mayHover = this.mayHover(this.lastMousePosition, this.offsetToChart(this.lastMousePosition), this.chart.space, isTouch)
    if (mayHover) {
      if (event.pointerType === 'touch') {
        this.awaitHoverBegin = mayHover
        clearTimeout(this.awaitHoverBeginTimeoutId)
        this.awaitHoverBeginTimeoutId = setTimeout(this.onHoverBeginTimeout.bind(this), HOVER_BEGIN_TIMEOUT)
      } else {
        event.preventDefault()
        event.stopPropagation()
        this.onHoverBegin(this.lastMousePosition, this.offsetToChart(this.lastMousePosition), this.chart.space, isTouch)
      }
    }
  }

  protected onPointerUp(event: PointerEvent) {
    this.interactiveZone.releasePointerCapture(event.pointerId)
    this.awaitPanBegin = false
    clearTimeout(this.awaitPanBeginTimeoutId)

    if (!this.chart) return

    const pos = event2Position(event)
    if (this.panActive) this.onPanEnd(pos, this.offsetToChart(pos), this.chart.space, event.pointerType === 'touch')
  }

  protected onPointerCancel(event: PointerEvent) {
    this.interactiveZone.releasePointerCapture(event.pointerId)
    this.awaitPanBegin = false
    clearTimeout(this.awaitPanBeginTimeoutId)
  }

  private onHoverBeginTimeout() {
    if (!this.awaitHoverBegin) return
    this.awaitHoverBegin = false

    if (!this.lastMousePosition || !this.chart) return

    this.onHoverBegin(this.lastMousePosition, this.offsetToChart(this.lastMousePosition), this.chart.space, true)
  }

  private onPanBeginTimeout() {
    if (!this.awaitPanBegin) return
    this.awaitPanBegin = false

    if (!this.lastMousePosition || !this.chart) return

    this.onHoverBegin(this.lastMousePosition, this.offsetToChart(this.lastMousePosition), this.chart.space, true)
  }

  private updateHoverPointer(position: Position, isTouch: boolean = false) {
    if (!this.chart) return

    this.lastNearestDataPoints = null
    this.lastNearestXDataPoints = null
    this.lastNearestYDataPoints = null
    this.interactiveZoneRect = this.interactiveZone.getBoundingClientRect()

    if (this.onHoverMove(position, this.offsetToChart(position), this.chart.space, isTouch)) this.requestRender()
  }

  protected beforeLayoutImpl(space: ChartSpace, full: Size) {
    this.onBeforeLayout(space, full)
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
    this.lastNearestDataPoints = null
    this.lastNearestXDataPoints = null
    this.lastNearestYDataPoints = null

    this.setupInteractiveZone(space)
    this.onRender(space, overflow, full)
  }

  protected onBeforeLayout(space: ChartSpace, full: Size) { }
  protected onRender(space: ChartSpace, overflow: Overflow, full: Size) { }
  protected mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection { return false }
  protected mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection { return false }
  protected onHoverMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }
  protected onPanMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean { return false }
  protected onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean { return false }

  onZoomTouchBegin() { }

  protected onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
    this.hoverActive = true
    this.root.classList.toggle('hover-active', true)
    queueMicrotask(() => this.updateHoverPointer(cursor, isTouch))
  }

  protected onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
    this.hoverActive = false
    this.root.classList.toggle('hover-active', false)
  }

  protected onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
    this.panActive = true
    this.root.classList.toggle('pan-active', true)
  }

  protected onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean) {
    this.panActive = false
    this.root.classList.toggle('pan-active', false)
  }

  protected setupInteractiveZone(space: ChartSpace) {
    const key = space.getLayoutHash()
    if (this.interactiveZoneHash === key) return
    this.interactiveZoneHash = key
    this.interactiveZone.setAttribute('x', space.layout.x.toString())
    this.interactiveZone.setAttribute('y', space.layout.y.toString())
    this.interactiveZone.setAttribute('width', space.layout.width.toString())
    this.interactiveZone.setAttribute('height', space.layout.height.toString())
  }

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

  findNearestInDataSource(point: Point, space: ChartSpace, dataSource: DataSource) {
    let nearestPointIndex = -1
    let nearestDistance = Infinity

    const chartPoint = space.layoutToChart(point)
    const chartScale = space.chartToLocalScale()

    for (let i = 0; i < dataSource.length; i++) {
      const dataPoint = dataSource[i]
      if (!dataPoint || !space.bounds.contains(dataPoint)) continue

      const dist = Math.pow((dataPoint.x - chartPoint.x) * chartScale.scaleX, 2) + Math.pow((dataPoint.y - chartPoint.y) * chartScale.scaleY, 2)
      if (dist < nearestDistance) {
        nearestDistance = dist
        nearestPointIndex = i
      }
    }

    if (nearestPointIndex === -1) return null

    const nearestDataPoint = dataSource[nearestPointIndex]
    const distance = Math.sqrt(nearestDistance)
    return {
      index: nearestPointIndex,
      xValue: nearestDataPoint!.x,
      yValue: nearestDataPoint!.y,
      distance
    }
  }

  findNearestInDataSourceByAxis(point: Point, space: ChartSpace, dataSource: DataSource, axis: 'x' | 'y') {
    let nearestPointIndex = -1
    let nearestDistance = Infinity

    const chartPoint = space.layoutToChart(point)
    const chartScale = space.chartToLocalScale()

    for (let i = 0; i < dataSource.length; i++) {
      const dataPoint = dataSource[i]
      if (!dataPoint || !space.bounds.contains(dataPoint)) continue

      const dist = axis === 'x' ? Math.abs(dataPoint.x - chartPoint.x) : Math.abs(dataPoint.y - chartPoint.y)
      if (dist < nearestDistance) {
        nearestDistance = dist
        nearestPointIndex = i
      }
    }

    if (nearestPointIndex === -1) return null

    const nearestDataPoint = dataSource[nearestPointIndex]
    return {
      index: nearestPointIndex,
      xValue: nearestDataPoint!.x,
      yValue: nearestDataPoint!.y,
      distance: nearestDistance * chartScale[axis === 'x' ? 'scaleX' : 'scaleY']
    }
  }

  findNearest(point: Point, space: ChartSpace, sorted: boolean = false): HoveredDataPoint[] {
    const result = this.lastNearestDataPoints ?? this.dataSources
      .map((ds, i) => {
        const nearest = this.findNearestInDataSource(point, space, ds)
        if (!nearest) return null
        return {
          dataSource: ds,
          sourceIndex: i,
          pointIndex: nearest.index,
          xValue: nearest.xValue,
          yValue: nearest.yValue,
          distance: nearest.distance
        }
      })
      .filter(p => p !== null)

    this.lastNearestDataPoints = result

    if (!sorted) return result

    return result
      .sort((a, b) => a.distance - b.distance)
  }

  findNearestByAxis(point: Point, space: ChartSpace, axis: 'x' | 'y', sorted: boolean = false): HoveredDataPoint[] {
    const lastNearest = axis === 'x' ? this.lastNearestXDataPoints : this.lastNearestYDataPoints

    const result = lastNearest ?? this.dataSources
      .map((ds, i) => {
        const nearest = this.findNearestInDataSourceByAxis(point, space, ds, axis)
        if (!nearest) return null
        return {
          dataSource: ds,
          sourceIndex: i,
          pointIndex: nearest.index,
          xValue: nearest.xValue,
          yValue: nearest.yValue,
          distance: nearest.distance
        }
      })
      .filter(p => p !== null)

    if (axis === 'x') this.lastNearestXDataPoints = result
    else if (axis === 'y') this.lastNearestYDataPoints = result

    if (!sorted) return result

    return result
      .sort((a, b) => a.distance - b.distance)
  }

  didLayout(space: ChartSpace, full: Size): void {
    this.interactiveZoneOffsets = { x: space.layout.x, y: space.layout.y }
  }

  setDataSources(...sources: DataSource[]) {
    this.dataSources = sources
    return this
  }

  addDataSource(...sources: DataSource[]) {
    this.dataSources.push(...sources)

    return this
  }
}