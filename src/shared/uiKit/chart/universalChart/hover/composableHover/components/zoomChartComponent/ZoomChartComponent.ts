import { UniversalChart } from '../../../../UniversalChart'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type Options = {
  chart: UniversalChart
  zoomBy?: 'x' | 'y' | 'both'
}

export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart

  constructor(private readonly options: Options) {
    this.chart = options.chart
  }

  attach(root: SVGGElement, composable: ComposableHover): void {
    composable.interactiveZone.addEventListener('wheel', this.onWheelEvent.bind(this))
    composable.interactiveZone.addEventListener('mousedown', this.onMouseDownEvent.bind(this))
    composable.interactiveZone.addEventListener('mousemove', this.onMouseMoveEvent.bind(this))
  }

  private onMouseDownEvent(event: MouseEvent) {
    document.addEventListener('mouseup', this.onMouseUpEvent.bind(this), { once: true })
  }

  private onMouseUpEvent(event: MouseEvent) {
  }

  private onMouseMoveEvent(event: MouseEvent) {
  }


  private onWheelEvent(event: WheelEvent) {
    event.preventDefault()
    event.stopPropagation()

    const { deltaY, deltaX } = event

    const zoomFactor = 1 - deltaY * -0.001

    const bounds = this.chart.space.bounds
    this.chart.setRenderBounds({
      ...bounds,
      minX: bounds.minX + (bounds.maxX - bounds.minX) * (1 - zoomFactor) / 2,
      maxX: bounds.maxX - (bounds.maxX - bounds.minX) * (1 - zoomFactor) / 2,
    })
  }
}