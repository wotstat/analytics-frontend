import { addClasses, Classes, removeClasses } from '../../../../utils/utils'
import { InteractionFrame } from '../../../core/InteractionFrame'
import { InteractionHit, isSameIdentity } from '../../../core/InteractionHit'
import { InteractionResolver } from '../../../core/InteractionResolver'
import { InteractionTag } from '../../../core/InteractionSource'
import { InteractionComponent, InteractionController } from '../../InteractionController'
import { HighlightSyncConnection, HighlightSynchronizer } from '../../sync/HighlightSynchronizer'

export type HighlightOptions<THit extends InteractionHit = InteractionHit> = {
  selection: InteractionResolver<THit>
  class?: Classes
  onHighlight?: (target: SVGElement) => void
  onDehighlight?: (target: SVGElement) => void
}

const highlightBrand = Symbol('highlightBrand')
export interface HighlightRef {
  readonly [highlightBrand]: true
}

export type HighlightSnapshot<THit extends InteractionHit = InteractionHit> = {
  readonly highlight: HighlightRef
  readonly hits: readonly THit[]
  readonly tags: readonly InteractionTag[]
  isHighlighted(hit: InteractionHit): boolean
}

function isAmongSelected(hit: InteractionHit, selected: readonly InteractionHit[]): boolean {
  const identities = [hit.identity, ...hit.memberships]
  return selected.some(candidate => identities.some(identity => isSameIdentity(identity, candidate.identity)))
}

function uniqueTags(hits: readonly InteractionHit[]): readonly InteractionTag[] {
  return [...new Set(hits.flatMap(hit => hit.interactionTag === undefined ? [] : [hit.interactionTag]))]
}

export class Highlight<THit extends InteractionHit = InteractionHit> implements InteractionComponent, HighlightRef {

  readonly [highlightBrand] = true as const

  private options: HighlightOptions<THit>
  private controller: InteractionController | null = null
  private synchronizer: HighlightSynchronizer | null = null
  private syncConnection: HighlightSyncConnection | null = null
  private stopSync: (() => void) | null = null
  private stopChartRender: (() => void) | null = null

  private hits: readonly THit[] = []
  private tags: readonly InteractionTag[] = []
  private matchByTag = false
  private pendingTargets = new Set<SVGElement>()
  private appliedTargets = new Set<SVGElement>()

  constructor(options: HighlightOptions<THit>) {
    this.options = options
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    if (this.controller && this.controller !== controller) throw new Error('Highlight is already attached to another controller')
    this.controller = controller
    this.stopChartRender = controller.attachedChart?.onAfterRender.on(() => this.refreshSyncedTargets()) ?? null
    this.connectSync()
  }

  detach(): void {
    this.disconnectSync()
    this.stopChartRender?.()
    this.stopChartRender = null
    this.clear()
    this.controller = null
  }

  updateOptions(options: HighlightOptions<THit>) {
    this.clear()
    this.options = options
    this.controller?.scheduleRender()
  }

  syncWith(synchronizer: HighlightSynchronizer | null): this {
    if (this.synchronizer === synchronizer) return this

    this.disconnectSync()
    this.synchronizer = synchronizer
    this.connectSync()
    this.controller?.scheduleRender()
    return this
  }

  get snapshot(): HighlightSnapshot<THit> {
    const hits = this.hits
    const tags = this.tags
    const matchByTag = this.matchByTag
    const tagSet = new Set(tags)

    return {
      highlight: this,
      hits,
      tags,
      isHighlighted: hit => matchByTag
        ? hit.interactionTag !== undefined && tagSet.has(hit.interactionTag)
        : isAmongSelected(hit, hits)
    }
  }

  prepareInteraction(frame: InteractionFrame): void {
    const hits = frame.resolve(this.options.selection)
      .filter(hit => hit.interactionTag !== undefined)

    const connection = this.syncConnection
    if (!connection || frame.input.pointer) {
      const tags = uniqueTags(hits)
      if (connection) connection.publish(tags)
      this.prepareLocal(hits, tags)
      return
    }

    connection.release()
    const synced = connection.consume()
    if (!synced) {
      this.prepareLocal([], [])
      return
    }

    this.prepareSynced(synced.tags)
  }

  private prepareLocal(hits: readonly THit[], tags: readonly InteractionTag[]): void {
    this.hits = hits
    this.tags = tags
    this.matchByTag = false

    const targets = new Set<SVGElement>()
    for (const hit of hits) for (const target of hit.targets) targets.add(target)
    this.pendingTargets = targets
  }

  private prepareSynced(tags: readonly InteractionTag[]): void {
    const tagSet = new Set(tags)
    const targets = new Set<SVGElement>()

    for (const source of this.options.selection.interactionSources ?? [])
      for (const tag of tagSet)
        for (const target of source.getTargets(tag)) targets.add(target)

    this.hits = []
    this.tags = tags
    this.matchByTag = true
    this.pendingTargets = targets
  }

  private refreshSyncedTargets(): void {
    if (!this.matchByTag) return
    this.prepareSynced(this.tags)
    this.renderInteraction()
  }

  renderInteraction(): void {
    if (!this.controller) return

    for (const target of this.appliedTargets) {
      if (this.pendingTargets.has(target)) continue
      removeClasses(target, this.options.class)
      this.options.onDehighlight?.(target)
    }

    for (const target of this.pendingTargets) {
      if (this.appliedTargets.has(target)) continue
      addClasses(target, this.options.class)
      this.options.onHighlight?.(target)
    }

    this.appliedTargets = this.pendingTargets
  }

  private clear() {
    for (const target of this.appliedTargets) {
      removeClasses(target, this.options.class)
      this.options.onDehighlight?.(target)
    }
    this.appliedTargets = new Set()
    this.pendingTargets = new Set()
    this.hits = []
    this.tags = []
    this.matchByTag = false
  }

  private connectSync() {
    if (!this.controller || !this.synchronizer || this.syncConnection) return

    this.syncConnection = this.synchronizer.connect()
    this.stopSync = this.syncConnection.subscribe(() => {
      const controller = this.controller
      if (!controller?.localInput.pointer) controller?.scheduleRender()
    })
  }

  private disconnectSync() {
    this.stopSync?.()
    this.stopSync = null
    this.syncConnection?.dispose()
    this.syncConnection = null
  }
}
