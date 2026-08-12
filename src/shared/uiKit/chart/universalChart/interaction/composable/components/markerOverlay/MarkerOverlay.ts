import { AutoMarker } from '../../../../plot/markers/autoMarkers/AutoMarkers'
import { Point } from '../../../../utils/Point'
import { addClasses, Classes, classNames, removeClasses } from '../../../../utils/utils'
import { InteractionFrame } from '../../../core/InteractionFrame'
import { InteractionHit } from '../../../core/InteractionHit'
import { InteractionResolver } from '../../../core/InteractionResolver'
import { InteractionComponent, InteractionController } from '../../InteractionController'

export type MarkerOverlayOptions<THit extends InteractionHit = InteractionHit> = {
  selection: InteractionResolver<THit>
  classes?: Classes
  markerClasses?: Classes
  classesForHit?: (hit: THit) => Classes
  targetMasks?: Element[] | Element
  size?: number
  maskSize?: number
}

type PlannedMarker = { anchor: Point, classes: string }
type PlacedMarker = { marker: AutoMarker, classes: string }

const DEFAULT_SIZE = 4
const DEFAULT_MASK_SIZE = 8

export class MarkerOverlay<THit extends InteractionHit = InteractionHit> implements InteractionComponent {

  private readonly root = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  private options: MarkerOverlayOptions<THit>
  private targetMasks: Element[] = []
  private markers: PlacedMarker[] = []
  private planned: PlannedMarker[] = []
  private controller: InteractionController | null = null

  constructor(options: MarkerOverlayOptions<THit>) {
    this.options = options
    this.applyOptions()
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    root.appendChild(this.root)
    this.controller = controller
  }

  detach(): void {
    this.clear()
    this.root.remove()
    this.controller = null
  }

  updateOptions(options: MarkerOverlayOptions<THit>) {
    removeClasses(this.root, 'hover-markers', this.options.classes)
    this.options = options
    this.applyOptions()
    this.clear()
    this.controller?.scheduleRender()
  }

  prepareInteraction(frame: InteractionFrame): void {
    const planned: PlannedMarker[] = []

    for (const hit of frame.resolve(this.options.selection)) {
      const anchor = hit.geometry.anchor
      if (planned.some(p => p.anchor.x === anchor.x && p.anchor.y === anchor.y)) continue
      planned.push({ anchor, classes: classNames('hover-marker', this.options.markerClasses, this.options.classesForHit?.(hit)).join(' ') })
    }

    this.planned = planned
  }

  renderInteraction(): void {
    if (!this.controller) return

    while (this.markers.length > this.planned.length) this.markers.pop()!.marker.dispose()

    for (let i = 0; i < this.planned.length; i++) {
      const plan = this.planned[i]
      const placed = this.markers[i]

      if (!placed || placed.classes !== plan.classes) {
        placed?.marker.dispose()
        this.markers[i] = { marker: this.createMarker(plan.classes), classes: plan.classes }
      }

      this.markers[i].marker.renderLayout(plan.anchor)
    }
  }

  private applyOptions() {
    const { targetMasks } = this.options

    if (Array.isArray(targetMasks)) this.targetMasks = targetMasks
    else if (targetMasks) this.targetMasks = [targetMasks]
    else this.targetMasks = []

    addClasses(this.root, 'hover-markers', this.options.classes)
  }

  private createMarker(classes: string) {
    const style = {
      variant: 'circle' as const,
      size: this.options.size ?? DEFAULT_SIZE,
      maskSize: this.options.maskSize ?? DEFAULT_MASK_SIZE,
      markerClasses: classes
    }
    return new AutoMarker(this.root, this.targetMasks, style, style)
  }

  private clear() {
    for (const placed of this.markers) placed.marker.dispose()
    this.markers = []
    this.planned = []
  }
}
