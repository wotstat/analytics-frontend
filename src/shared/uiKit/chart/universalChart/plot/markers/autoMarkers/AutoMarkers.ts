import { ChartSpace } from '../../../utils/ChartSpace'
import { Bounds, BoundsConstraint } from '../../../utils/Bounds'
import { Point } from '../../../utils/Point'
import { addClasses, Classes } from '../../../utils/utils'
import { BaseMarkers, Marker } from '../BaseMarkers'
import { AutoMarkersInteractionSource } from './AutoMarkersInteractionSource'


const NAMESPACE = 'http://www.w3.org/2000/svg'

type Variant = 'circle' | 'square' | 'diamond'


type DefaultOptions = {
  variant: Variant
  size: number
  maskSize: number
  markerClasses: Classes
}

export type AutoMarkerDatum = Point & Partial<DefaultOptions>
type MarkerRenderData = Point & DefaultOptions

const DEFAULT_OPTIONS: DefaultOptions = {
  variant: 'circle',
  size: 3,
  maskSize: 5,
  markerClasses: []
}

function resolveMarkerData<T extends AutoMarkerDatum>(datum: T, defaults: DefaultOptions): MarkerRenderData {
  return {
    x: datum.x,
    y: datum.y,
    variant: datum.variant ?? defaults.variant,
    size: datum.size ?? defaults.size,
    maskSize: datum.maskSize ?? defaults.maskSize,
    markerClasses: datum.markerClasses ?? defaults.markerClasses,
  }
}

export class AutoMarker<T extends AutoMarkerDatum = AutoMarkerDatum> implements Marker<T> {

  private readonly circle: SVGCircleElement
  private readonly maskCircles: SVGCircleElement[] = []

  constructor(
    readonly root: Element,
    readonly targetMasks: Element[],
    private readonly defaultData: DefaultOptions,
    initialStyle: DefaultOptions) {

    this.circle = document.createElementNS(NAMESPACE, 'circle')
    root.appendChild(this.circle)
    addClasses(this.circle, initialStyle.markerClasses)

    for (const mask of targetMasks) {
      const circle = document.createElementNS(NAMESPACE, 'circle')
      circle.setAttribute('fill', 'black')
      mask.appendChild(circle)
      addClasses(circle, initialStyle.markerClasses)
      this.maskCircles.push(circle)
    }

    this.applyRadius(initialStyle.size, initialStyle.maskSize)
  }

  get target(): SVGCircleElement {
    return this.circle
  }

  render(data: T, space: ChartSpace): void {
    const resolved = resolveMarkerData(data, this.defaultData)
    const point = space.chartToLayout(resolved)

    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      this.applyRadius(0, 0)
      return
    }

    this.applyRadius(resolved.size, resolved.maskSize)
    this.renderLayout(point)
  }

  renderLayout(point: Point): void {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return

    this.circle.setAttribute('cx', point.x.toString())
    this.circle.setAttribute('cy', point.y.toString())
    for (const mask of this.maskCircles) {
      mask.setAttribute('cx', point.x.toString())
      mask.setAttribute('cy', point.y.toString())
    }
  }

  private applyRadius(size: number, maskSize: number): void {
    this.circle.setAttribute('r', size.toString())
    const cutout = maskSize > size ? maskSize : 0
    for (const mask of this.maskCircles) mask.setAttribute('r', cutout.toString())
  }

  dispose(): void {
    this.circle.remove()
    for (const mask of this.maskCircles) mask.remove()
  }
}

export class AutoMarkers<T extends AutoMarkerDatum = AutoMarkerDatum> extends BaseMarkers<T> {

  readonly targetMasks: Element[]
  readonly defaultData: DefaultOptions
  readonly interaction: AutoMarkersInteractionSource<T>

  constructor(protected options: {
    classes?: Classes
    targetMasks?: Element[] | Element
    affectsBounds?: boolean
  } & Partial<DefaultOptions>) {
    super(options.classes ?? [], { affectsBounds: options.affectsBounds ?? false })

    this.defaultData = {
      variant: this.options.variant ?? DEFAULT_OPTIONS.variant,
      size: this.options.size ?? DEFAULT_OPTIONS.size,
      maskSize: this.options.maskSize ?? DEFAULT_OPTIONS.maskSize,
      markerClasses: this.options.markerClasses ?? DEFAULT_OPTIONS.markerClasses
    }

    if (Array.isArray(options.targetMasks)) this.targetMasks = options.targetMasks
    else if (options.targetMasks) this.targetMasks = [options.targetMasks]
    else this.targetMasks = []

    this.interaction = new AutoMarkersInteractionSource<T>({
      markers: () => this.markers,
      renderMeta: index => {
        const datum = this.markers[index]
        return datum ? resolveMarkerData(datum, this.defaultData) : null
      },
      target: index => (this.markerInstances[index] as AutoMarker<T> | undefined)?.target ?? null,
    })
  }

  createMarker(data: T) {
    return new AutoMarker(this.root, this.targetMasks, this.defaultData, resolveMarkerData(data, this.defaultData))
  }

  protected calculateBounds(constraint?: BoundsConstraint): Bounds {
    const { minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity } = constraint ?? {}
    const bounds = new Bounds()

    for (const marker of this.markers) {
      if (marker.x < minX || marker.x > maxX || marker.y < minY || marker.y > maxY) continue
      bounds.addPoint(marker)
    }

    return bounds
  }
}
