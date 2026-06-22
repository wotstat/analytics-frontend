import { Size, UniversalChart } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type Options = {
  chart: UniversalChart
  zoomBy?: 'x' | 'y' | 'both'
}

export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart
  protected interactiveZone: SVGRectElement | null = null

  constructor(private readonly options: Options) {
    this.chart = options.chart
  }

  attach(root: SVGGElement, composable: ComposableHover): void {
    this.interactiveZone = composable.interactiveZone
    this.interactiveZone.addEventListener('wheel', this.onWheelEvent.bind(this))
    this.interactiveZone.addEventListener('mousedown', this.onMouseDownEvent.bind(this))
    this.interactiveZone.addEventListener('mousemove', this.onMouseMoveEvent.bind(this))
  }

  private onMouseDownEvent(event: MouseEvent) {
    document.addEventListener('mouseup', this.onMouseUpEvent.bind(this), { once: true })
  }

  private onMouseUpEvent(event: MouseEvent) {
  }

  private onMouseMoveEvent(event: MouseEvent) {
  }

  private onWheelEvent(event: WheelEvent) {
    if (!this.interactiveZone) return

    event.preventDefault()
    event.stopPropagation()

    const { deltaY, deltaX } = event

    const zoomFactor = 1 - deltaY * -0.001

    const bounds = this.chart.space.bounds

    const interactiveZoneRect = this.interactiveZone.getBoundingClientRect()

    const dX = event.clientX - interactiveZoneRect.left
    const dY = event.clientY - interactiveZoneRect.top

    this.chart.setRenderBounds({
      ...bounds,
      minX: bounds.minX + (dX / interactiveZoneRect.width) * (1 - zoomFactor) * (bounds.maxX - bounds.minX),
      maxX: bounds.maxX - (1 - dX / interactiveZoneRect.width) * (1 - zoomFactor) * (bounds.maxX - bounds.minX),
      minY: undefined
      // minY: bounds.minY + (dY / interactiveZoneRect.height) * (1 - zoomFactor) * (bounds.maxY - bounds.minY),
      // maxY: bounds.maxY - (1 - dY / interactiveZoneRect.height) * (1 - zoomFactor) * (bounds.maxY - bounds.minY),
    })
  }
}