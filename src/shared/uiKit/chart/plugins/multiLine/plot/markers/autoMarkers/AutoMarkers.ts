import { ChartSpace } from '../../../utils/ChartSpace'
import { addClasses, Classes } from '../../../utils/utils'
import { BaseMarkers, Marker } from '../BaseMarkers'


type Variant = 'circle' | 'square' | 'diamond'


type DefaultOptions = {
  variant: Variant
  size: number
  maskSize: number
  markerClasses: Classes
}

type MarkerData = {
  x: number
  y: number
} & DefaultOptions

type OptionalMarkerData = { x: number, y: number } & Partial<DefaultOptions>

const DEFAULT_OPTIONS: DefaultOptions = {
  variant: 'circle',
  size: 3,
  maskSize: 5,
  markerClasses: []
}

export class AutoMarker implements Marker<MarkerData> {

  private elements: SVGCircleElement[] = []

  constructor(
    readonly root: Element,
    readonly targetMasks: Element[],
    readonly data: DefaultOptions) {

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('r', data.size.toString())
    root.appendChild(circle)
    addClasses(circle, data.markerClasses)
    this.elements.push(circle)

    if (data.maskSize > data.size) {
      for (const mask of this.targetMasks) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('r', data.maskSize.toString())
        circle.setAttribute('fill', 'black')
        mask.appendChild(circle)
        addClasses(circle, data.markerClasses)
        this.elements.push(circle)
      }
    }
  }

  render(data: { x: number, y: number }, space: ChartSpace): void {
    const { x, y } = data
    const layoutX = space.chartToLayoutX(x)
    const layoutY = space.chartToLayoutY(y)

    for (const element of this.elements) {
      element.setAttribute('cx', layoutX.toString())
      element.setAttribute('cy', layoutY.toString())
    }
  }

  dispose(): void {
    for (const element of this.elements) {
      element.remove()
    }
  }
}

export class AutoMarkers extends BaseMarkers<MarkerData> {

  readonly targetMasks: Element[]
  readonly defaultData: DefaultOptions

  constructor(protected options: {
    classes?: Classes
    targetMasks?: Element[] | Element
  } & Partial<DefaultOptions>) {
    super(options.classes ?? [])

    this.defaultData = {
      variant: this.options.variant ?? DEFAULT_OPTIONS.variant,
      size: this.options.size ?? DEFAULT_OPTIONS.size,
      maskSize: this.options.maskSize ?? DEFAULT_OPTIONS.maskSize,
      markerClasses: this.options.markerClasses ?? DEFAULT_OPTIONS.markerClasses
    }

    if (Array.isArray(options.targetMasks)) this.targetMasks = options.targetMasks
    else if (options.targetMasks) this.targetMasks = [options.targetMasks]
    else this.targetMasks = []
  }

  setMarkers(markers: OptionalMarkerData[]) {
    const fullData = markers.map(marker => ({ ...this.defaultData, ...marker }))
    super.setMarkers(fullData)

    return this
  }

  createMarker(data: MarkerData) {
    return new AutoMarker(this.root, this.targetMasks, data)
  }
}