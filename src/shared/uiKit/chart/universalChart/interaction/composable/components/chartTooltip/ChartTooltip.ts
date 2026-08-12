import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { Position } from '../../../baseInteractionController/BaseInteractionController'
import { InteractionFrame } from '../../../core/InteractionFrame'
import { InteractionHit, isSameIdentity } from '../../../core/InteractionHit'
import { InteractionResolver } from '../../../core/InteractionResolver'
import { InteractionComponent, InteractionController } from '../../InteractionController'
import { Highlight, HighlightRef, HighlightSnapshot } from '../highlight/Highlight'

export type TooltipBox = {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export type TooltipCtx<THit extends InteractionHit = InteractionHit> = {
  readonly hits: readonly THit[]
  readonly highlights: readonly HighlightSnapshot[]
  isHighlighted(hit: InteractionHit, highlight: HighlightRef): boolean

  readonly pivot: Point
  readonly absolutePivot: Point
  readonly cursor: Position
  readonly absoluteCursor: Point
  readonly chartBox: TooltipBox
  readonly absoluteChartBox: TooltipBox
  readonly isTouch: boolean
}

export type ChartTooltipOptions<THit extends InteractionHit = InteractionHit> = {
  selection: InteractionResolver<THit>
  exposeHighlights?: readonly Highlight[]
  tooltipPivot?: 'cursor' | 'nearest' | 'avg'
  onShow?: (ctx: TooltipCtx<THit>) => void
  onPositionChange?: (ctx: TooltipCtx<THit>) => void
  onHide?: () => void
}

type TooltipPointer = {
  readonly point: Point
  readonly cursor: Position
  readonly isTouch: boolean
}

export class ChartTooltip<THit extends InteractionHit = InteractionHit> implements InteractionComponent {

  private options: ChartTooltipOptions<THit>
  private controller: InteractionController | null = null

  private hits: readonly THit[] = []
  private active = false
  private windowScroll = { x: 0, y: 0 }

  constructor(options: ChartTooltipOptions<THit>) {
    this.options = options
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    if (this.controller && this.controller !== controller) throw new Error('ChartTooltip is already attached to another controller')
    this.controller = controller
  }

  detach(): void {
    this.hide()
    this.controller = null
  }

  updateOptions(options: ChartTooltipOptions<THit>) {
    this.hide()
    this.options = options
    this.controller?.scheduleRender()
  }

  onBeforeLayout(): void {
    this.windowScroll = { x: window.scrollX, y: window.scrollY }
  }

  prepareInteraction(frame: InteractionFrame): void {
    this.hits = frame.resolve(this.options.selection)
  }

  renderInteraction(frame: InteractionFrame): void {
    const controller = this.controller
    const hits = this.hits

    if (!controller || hits.length === 0) {
      this.hide()
      return
    }

    const pointer = this.pointerFor(controller, frame, hits)
    const ctx = this.buildContext(controller, frame.space, pointer, hits)

    const wasActive = this.active
    this.active = true

    if (!wasActive) this.options.onShow?.(ctx)
    this.options.onPositionChange?.(ctx)
  }

  private hide() {
    this.hits = []
    if (!this.active) return

    this.active = false
    this.options.onHide?.()
  }

  private pointerFor(controller: InteractionController, frame: InteractionFrame, hits: readonly THit[]): TooltipPointer {
    const local = frame.input.pointer
    if (local && local.cursor) return { point: local.point, cursor: local.cursor, isTouch: local.isTouch }

    const effective = frame.effectiveInputFor(this.options.selection)?.pointer
    if (effective) return this.toPointer(controller, effective.point, effective.isTouch)

    return this.toPointer(controller, this.nearestAnchor(hits), false)
  }

  private toPointer(controller: InteractionController, point: Point, isTouch: boolean): TooltipPointer {
    const page = controller.chartToPage(point)
    return {
      point,
      isTouch,
      cursor: { offsetX: point.x, offsetY: point.y, clientX: page.x, clientY: page.y }
    }
  }

  private nearestAnchor(hits: readonly THit[]): Point {
    let nearest = hits[0]
    for (let i = 1; i < hits.length; i++) if (hits[i].distance <= nearest.distance) nearest = hits[i]
    return nearest.geometry.anchor
  }

  private buildContext(controller: InteractionController, space: ChartSpace, pointer: TooltipPointer, hits: readonly THit[]): TooltipCtx<THit> {
    const pivot = this.pivotFor(controller, hits, pointer)

    const topLeft = controller.chartToPage({ x: space.layout.x, y: space.layout.y })
    const bottomRight = controller.chartToPage({ x: space.layout.x + space.layout.width, y: space.layout.y + space.layout.height })
    const chartBox = { top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y, left: topLeft.x }
    const highlights = (this.options.exposeHighlights ?? []).map(highlight => highlight.snapshot)

    function isAmongSelected(hit: InteractionHit, selected: readonly InteractionHit[]): boolean {
      const identities = [hit.identity, ...hit.memberships]
      return selected.some(candidate => identities.some(identity => isSameIdentity(identity, candidate.identity)))
    }

    return {
      hits,
      highlights,
      isHighlighted: (hit, highlight) => {
        const found = highlights.find(snapshot => snapshot.highlight === highlight)
        return found ? isAmongSelected(hit, found.hits) : false
      },
      pivot,
      absolutePivot: { x: pivot.x + this.windowScroll.x, y: pivot.y + this.windowScroll.y },
      cursor: pointer.cursor,
      absoluteCursor: { x: pointer.cursor.clientX + this.windowScroll.x, y: pointer.cursor.clientY + this.windowScroll.y },
      chartBox,
      absoluteChartBox: {
        top: chartBox.top + this.windowScroll.y,
        right: chartBox.right + this.windowScroll.x,
        bottom: chartBox.bottom + this.windowScroll.y,
        left: chartBox.left + this.windowScroll.x
      },
      isTouch: pointer.isTouch
    }
  }

  private pivotFor(controller: InteractionController, hits: readonly THit[], pointer: TooltipPointer): Point {
    const mode = this.options.tooltipPivot ?? 'cursor'
    if (mode === 'cursor') return { x: pointer.cursor.clientX, y: pointer.cursor.clientY }
    if (mode === 'nearest') return controller.chartToPage(this.nearestAnchor(hits))

    let x = 0
    let y = 0
    for (const hit of hits) {
      x += hit.geometry.anchor.x
      y += hit.geometry.anchor.y
    }

    return controller.chartToPage({ x: x / hits.length, y: y / hits.length })
  }
}
