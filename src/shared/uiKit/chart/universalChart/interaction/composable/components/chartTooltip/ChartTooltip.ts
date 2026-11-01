import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { Position } from '../../../baseInteractionController/BaseInteractionController'
import { InteractionFrame } from '../../../core/InteractionFrame'
import { InteractionHit } from '../../../core/InteractionHit'
import { InteractionComponent, InteractionController } from '../../InteractionController'
import type { InteractionBinding, InteractionPivot } from '../../../core/InteractionBinding'
import type { InteractionResolver } from '../../../core/InteractionResolver'
import { selectionCursor, selectionPivot } from '../../../core/utils/selectionBindings'
import { Highlight, HighlightRef, HighlightSnapshot } from '../highlight/Highlight'

export type TooltipBox = {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

type NonEmptyArray<T> = readonly [T, ...T[]]

export type TooltipPivot<THit extends InteractionHit = InteractionHit> = InteractionPivot<THit>

export type TooltipCtx<THit extends InteractionHit = InteractionHit> = {
  readonly hit: THit
  readonly hits: NonEmptyArray<THit>
  readonly highlights: readonly HighlightSnapshot[]
  isHighlighted(hit: InteractionHit, highlight: HighlightRef): boolean

  readonly pivot: Point
  readonly absolutePivot: Point
  readonly cursor: Position
  readonly absoluteCursor: Point
  readonly cursorAnchor: Point
  readonly absoluteCursorAnchor: Point
  readonly chartBox: TooltipBox
  readonly absoluteChartBox: TooltipBox
  readonly isTouch: boolean
}

export type ChartTooltipOptions<THit extends InteractionHit = InteractionHit> = {
  selection: InteractionResolver<THit>
  binding?: InteractionBinding<Point | null>
  cursorBinding?: InteractionBinding<Point | null>
  exposeHighlights?: readonly Highlight[]
  tooltipPivot?: TooltipPivot<THit>
  onShow?: (ctx: TooltipCtx<THit>) => void
  onPositionChange?: (ctx: TooltipCtx<THit>) => void
  onHide?: () => void
}

type TooltipPointer = {
  readonly point: Point
  readonly cursor: Position
  readonly isTouch: boolean
}

function isNonEmpty<T>(items: readonly T[]): items is NonEmptyArray<T> {
  return items.length > 0
}

export class ChartTooltip<THit extends InteractionHit = InteractionHit> implements InteractionComponent {

  private options: ChartTooltipOptions<THit>
  private pivotBinding: InteractionBinding<Point | null>
  private cursorBinding: InteractionBinding<Point | null>
  private controller: InteractionController | null = null

  private hits: readonly THit[] = []
  private pointer: TooltipPointer | null = null
  private pivot: Point | null = null
  private cursorAnchor: Point | null = null
  private active = false
  private windowScroll = { x: 0, y: 0 }

  constructor(options: ChartTooltipOptions<THit>) {
    this.options = options
    this.cursorBinding = options.cursorBinding ?? selectionCursor(options.selection)
    const pivot = options.tooltipPivot ?? 'cursor'
    this.pivotBinding = options.binding ?? (pivot === 'cursor' ? this.cursorBinding : selectionPivot(options.selection, pivot))
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
    this.cursorBinding = options.cursorBinding ?? selectionCursor(options.selection)
    const pivot = options.tooltipPivot ?? 'cursor'
    this.pivotBinding = options.binding ?? (pivot === 'cursor' ? this.cursorBinding : selectionPivot(options.selection, pivot))
    this.controller?.scheduleRender()
  }

  onBeforeLayout(): void {
    this.windowScroll = { x: window.scrollX, y: window.scrollY }
  }

  prepareInteraction(frame: InteractionFrame): void {
    this.hits = frame.resolve(this.options.selection)
    this.cursorAnchor = this.cursorBinding.read(frame)
    this.pivot = this.pivotBinding.read(frame)
    if (!this.controller || !isNonEmpty(this.hits)) return

    this.pointer = this.pointerFor(this.controller, frame, this.hits)
  }

  renderInteraction(frame: InteractionFrame): void {
    const controller = this.controller
    const hits = this.hits

    if (!controller || !isNonEmpty(hits) || !this.pointer || !this.pivot || !this.cursorAnchor) {
      this.hide()
      return
    }

    const ctx = this.buildContext(controller, frame.space, this.pointer, hits)

    const wasActive = this.active
    this.active = true

    if (!wasActive) this.options.onShow?.(ctx)
    this.options.onPositionChange?.(ctx)
  }

  private hide() {
    this.hits = []
    this.pointer = null
    this.pivot = this.cursorAnchor = null
    if (!this.active) return

    this.active = false
    this.options.onHide?.()
  }

  private pointerFor(controller: InteractionController, frame: InteractionFrame, hits: NonEmptyArray<THit>): TooltipPointer {
    const local = frame.input.pointer
    if (local) {
      if (local.cursor) return { point: local.point, cursor: local.cursor, isTouch: local.isTouch }
      return this.toPointer(controller, local.point, local.isTouch)
    }

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

  private nearestHit(hits: NonEmptyArray<THit>): THit {
    let nearest = hits[0]
    for (let i = 1; i < hits.length; i++) if (hits[i].distance <= nearest.distance) nearest = hits[i]
    return nearest
  }

  private nearestAnchor(hits: NonEmptyArray<THit>): Point {
    return this.nearestHit(hits).geometry.anchor
  }

  private buildContext(controller: InteractionController, space: ChartSpace, pointer: TooltipPointer, hits: NonEmptyArray<THit>): TooltipCtx<THit> {
    const cursorAnchor = controller.chartToPage(this.cursorAnchor!)
    const pivot = controller.chartToPage(this.pivot!)

    const topLeft = controller.chartToPage({ x: space.layout.x, y: space.layout.y })
    const bottomRight = controller.chartToPage({ x: space.layout.x + space.layout.width, y: space.layout.y + space.layout.height })
    const chartBox = { top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y, left: topLeft.x }
    const highlights = (this.options.exposeHighlights ?? []).map(highlight => highlight.snapshot)

    return {
      hit: hits[0],
      hits,
      highlights,
      isHighlighted: (hit, highlight) => {
        const found = highlights.find(snapshot => snapshot.highlight === highlight)
        return found?.isHighlighted(hit) ?? false
      },
      pivot,
      absolutePivot: { x: pivot.x + this.windowScroll.x, y: pivot.y + this.windowScroll.y },
      cursor: pointer.cursor,
      absoluteCursor: { x: pointer.cursor.clientX + this.windowScroll.x, y: pointer.cursor.clientY + this.windowScroll.y },
      cursorAnchor,
      absoluteCursorAnchor: { x: cursorAnchor.x + this.windowScroll.x, y: cursorAnchor.y + this.windowScroll.y },
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
}
