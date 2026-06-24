import { UniversalChart } from '../../../../UniversalChart'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type Options = {
  chart: UniversalChart
  zoomBy?: 'x' | 'y' | 'both'
}

export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart
  protected interactiveZone: SVGRectElement | null = null
  private panState: {
    startClientX: number,
    startClientY: number,
    startBounds: { minX: number, maxX: number, minY: number, maxY: number },
    layoutWidth: number,
    layoutHeight: number
  } | null = null

  private readonly wheelHandler = (event: WheelEvent) => this.onWheelEvent(event)
  private readonly mouseDownHandler = (event: MouseEvent) => this.onMouseDownEvent(event)
  private readonly mouseMoveHandler = (event: MouseEvent) => this.onMouseMoveEvent(event)
  private readonly mouseUpHandler = (event: MouseEvent) => this.onMouseUpEvent(event)

  constructor(private readonly options: Options) {
    this.chart = options.chart
  }

  attach(_root: SVGGElement, composable: ComposableHover): void {
    this.interactiveZone = composable.interactiveZone
    this.interactiveZone.addEventListener('wheel', this.wheelHandler, { passive: false })
    this.interactiveZone.addEventListener('mousedown', this.mouseDownHandler)
  }

  private onMouseDownEvent(event: MouseEvent) {
    if (event.button !== 0) return

    const { bounds, layout } = this.chart.space

    this.panState = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBounds: {
        minX: bounds.minX,
        maxX: bounds.maxX,
        minY: bounds.minY,
        maxY: bounds.maxY,
      },
      layoutWidth: layout.width,
      layoutHeight: layout.height,
    }

    event.preventDefault()
    event.stopPropagation()

    document.addEventListener('mousemove', this.mouseMoveHandler)
    document.addEventListener('mouseup', this.mouseUpHandler)
  }

  private onMouseUpEvent(event: MouseEvent) {
    if (this.panState) {
      event.preventDefault()
      event.stopPropagation()
    }

    this.stopPan()
  }

  private onMouseMoveEvent(event: MouseEvent) {
    if (!this.panState) return

    const { startClientX, startClientY, startBounds, layoutWidth, layoutHeight } = this.panState
    const nextBounds: { minX?: number, maxX?: number, minY?: number, maxY?: number } = {}

    if (this.isXAxisEnabled() && layoutWidth > 0) {
      const rangeX = startBounds.maxX - startBounds.minX
      const shiftX = -(event.clientX - startClientX) / layoutWidth * rangeX
      nextBounds.minX = startBounds.minX + shiftX
      nextBounds.maxX = startBounds.maxX + shiftX
    }

    if (this.isYAxisEnabled() && layoutHeight > 0) {
      const rangeY = startBounds.maxY - startBounds.minY
      const shiftY = (event.clientY - startClientY) / layoutHeight * rangeY
      nextBounds.minY = startBounds.minY + shiftY
      nextBounds.maxY = startBounds.maxY + shiftY
    }

    if (Object.keys(nextBounds).length === 0) return

    this.chart.setRenderBounds(nextBounds)

    event.preventDefault()
    event.stopPropagation()
  }

  private onWheelEvent(event: WheelEvent) {
    if (!this.interactiveZone) return

    event.preventDefault()
    event.stopPropagation()

    const { deltaY } = event

    const zoomFactor = 1 - deltaY * -0.001

    const bounds = this.chart.space.bounds

    const interactiveZoneRect = this.interactiveZone.getBoundingClientRect()

    const dX = event.clientX - interactiveZoneRect.left
    const dY = event.clientY - interactiveZoneRect.top

    this.chart.setRenderBounds({
      ...(this.isXAxisEnabled() ? {
        minX: bounds.minX + (dX / interactiveZoneRect.width) * (1 - zoomFactor) * (bounds.maxX - bounds.minX),
        maxX: bounds.maxX - (1 - dX / interactiveZoneRect.width) * (1 - zoomFactor) * (bounds.maxX - bounds.minX),
      } : {}),
      ...(this.isYAxisEnabled() ? {
        minY: bounds.minY + (dY / interactiveZoneRect.height) * (1 - zoomFactor) * (bounds.maxY - bounds.minY),
        maxY: bounds.maxY - (1 - dY / interactiveZoneRect.height) * (1 - zoomFactor) * (bounds.maxY - bounds.minY),
      } : {}),
    })
  }

  detach(): void {
    this.interactiveZone?.removeEventListener('wheel', this.wheelHandler)
    this.interactiveZone?.removeEventListener('mousedown', this.mouseDownHandler)
    this.stopPan()
    this.interactiveZone = null
  }

  private stopPan() {
    this.panState = null
    document.removeEventListener('mousemove', this.mouseMoveHandler)
    document.removeEventListener('mouseup', this.mouseUpHandler)
  }

  private isXAxisEnabled() {
    return this.options.zoomBy !== 'y'
  }

  private isYAxisEnabled() {
    return this.options.zoomBy === 'y' || this.options.zoomBy === 'both'
  }
}
