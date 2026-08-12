import { addClasses, Classes, removeClasses } from '../../../../utils/utils'
import { InteractionFrame } from '../../../core/InteractionFrame'
import { InteractionHit } from '../../../core/InteractionHit'
import { InteractionResolver } from '../../../core/InteractionResolver'
import { InteractionComponent, InteractionController } from '../../InteractionController'

export type HighlightOptions<THit extends InteractionHit = InteractionHit> = {
  selection: InteractionResolver<THit>
  class: Classes
}

const highlightBrand = Symbol('highlightBrand')
export interface HighlightRef {
  readonly [highlightBrand]: true
}

export type HighlightSnapshot<THit extends InteractionHit = InteractionHit> = {
  readonly highlight: HighlightRef
  readonly hits: readonly THit[]
}

export class Highlight<THit extends InteractionHit = InteractionHit> implements InteractionComponent, HighlightRef {

  readonly [highlightBrand] = true as const

  private options: HighlightOptions<THit>
  private controller: InteractionController | null = null

  private hits: readonly THit[] = []
  private pendingTargets = new Set<SVGElement>()
  private appliedTargets = new Set<SVGElement>()

  constructor(options: HighlightOptions<THit>) {
    this.options = options
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    this.controller = controller
  }

  detach(): void {
    this.clear()
    this.controller = null
  }

  updateOptions(options: HighlightOptions<THit>) {
    this.clear()
    this.options = options
    this.controller?.scheduleRender()
  }

  get snapshot(): HighlightSnapshot<THit> {
    return { highlight: this, hits: this.hits }
  }

  prepareInteraction(frame: InteractionFrame): void {
    const hits = frame.resolve(this.options.selection)
    this.hits = hits

    const targets = new Set<SVGElement>()
    for (const hit of hits) for (const target of hit.targets) targets.add(target)
    this.pendingTargets = targets
  }

  renderInteraction(): void {
    if (!this.controller) return

    for (const target of this.appliedTargets) if (!this.pendingTargets.has(target)) removeClasses(target, this.options.class)
    for (const target of this.pendingTargets) if (!this.appliedTargets.has(target)) addClasses(target, this.options.class)

    this.appliedTargets = this.pendingTargets
  }

  private clear() {
    for (const target of this.appliedTargets) removeClasses(target, this.options.class)
    this.appliedTargets = new Set()
    this.pendingTargets = new Set()
    this.hits = []
  }
}
