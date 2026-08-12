import { ChartSpace } from '../../../../utils/ChartSpace'
import { addClasses, Classes, removeClasses } from '../../../../utils/utils'
import { InteractionFrame } from '../../../core/InteractionFrame'
import { InteractionGeometry } from '../../../core/InteractionGeometry'
import { InteractionHit } from '../../../core/InteractionHit'
import { InteractionResolver } from '../../../core/InteractionResolver'
import { InteractionComponent, InteractionController } from '../../InteractionController'

type GeometryScopeOf<THit extends InteractionHit> = Parameters<THit['geometryFor']>[0]

function geometryForScope<THit extends InteractionHit>(hit: THit, scope: GeometryScopeOf<THit> | undefined): InteractionGeometry | null {
  if (scope === undefined) return hit.geometry
  return hit.geometryFor(scope)
}

export type AreaOptions<THit extends InteractionHit = InteractionHit> = {
  selection: InteractionResolver<THit>
  geometry?: GeometryScopeOf<THit>
  classes?: Classes
}

export abstract class BaseArea<THit extends InteractionHit = InteractionHit> implements InteractionComponent {

  protected readonly root = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  private options: AreaOptions<THit>
  private rects: SVGRectElement[] = []
  private ranges: (readonly [number, number])[] = []
  private controller: InteractionController | null = null

  constructor(options: AreaOptions<THit>) {
    this.options = options
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

  updateOptions(options: AreaOptions<THit>) {
    for (const rect of this.rects) removeClasses(rect, 'hover-area', this.options.classes)

    this.options = options

    for (const rect of this.rects) addClasses(rect, 'hover-area', options.classes)

    this.controller?.scheduleRender()
  }

  prepareInteraction(frame: InteractionFrame): void {
    const ranges: (readonly [number, number])[] = []
    const seen = new Map<number, Set<number>>()

    for (const hit of frame.resolve(this.options.selection)) {
      const geometry = geometryForScope(hit, this.options.geometry)
      if (!geometry) continue

      const range = this.range(geometry)
      let ends = seen.get(range[0])
      if (!ends) { ends = new Set(); seen.set(range[0], ends) }
      if (ends.has(range[1])) continue
      ends.add(range[1])

      ranges.push(range)
    }

    this.ranges = ranges
  }

  renderInteraction(frame: InteractionFrame): void {
    if (!this.controller) return

    while (this.rects.length > this.ranges.length) this.rects.pop()!.remove()
    while (this.rects.length < this.ranges.length) this.rects.push(this.createRect())

    for (let i = 0; i < this.ranges.length; i++) this.place(this.rects[i], this.ranges[i], frame.space)
  }

  private createRect() {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    addClasses(rect, 'hover-area', this.options.classes)
    this.root.appendChild(rect)
    return rect
  }

  private clear() {
    for (const rect of this.rects) rect.remove()
    this.rects = []
    this.ranges = []
  }

  protected abstract range(geometry: InteractionGeometry): readonly [number, number]
  protected abstract place(rect: SVGRectElement, range: readonly [number, number], space: ChartSpace): void
}
