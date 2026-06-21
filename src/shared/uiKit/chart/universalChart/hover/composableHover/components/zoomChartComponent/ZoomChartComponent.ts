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
    composable.interactiveZone.addEventListener('wheel', this.onWheelEvent.bind(this), { passive: false })
  }

  private onWheelEvent(event: WheelEvent) {
    event.preventDefault()
    event.stopPropagation()

    const { deltaY, deltaX } = event

    const zoomFactor = 1 - deltaY * 0.001

    const bounds = this.chart.space.bounds
    this.chart.setRenderBounds({ ...bounds, maxX: bounds.minX + (bounds.maxX - bounds.minX) * zoomFactor })
  }
}