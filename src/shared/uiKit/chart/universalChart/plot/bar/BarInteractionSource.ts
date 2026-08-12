import { geometryFromRanges, InteractionBounds, InteractionGeometry } from '../../interaction/core/InteractionGeometry'
import { InteractionHit } from '../../interaction/core/InteractionHit'
import { InteractionSource } from '../../interaction/core/InteractionIdentity'
import { InteractionResolveContext, InteractionResolver } from '../../interaction/core/InteractionResolver'
import { Selection } from '../../interaction/core/Selection'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import type { BarDataset, BarLayoutItem } from './Bar'

export type BarGapPolicy = 'miss' | 'nearest'
export type BarHitArea = 'geometry' | 'vertical'

export type BarContainsOptions = {
  gaps?: BarGapPolicy
  hitArea?: BarHitArea
}

export type BarContainsGroupOptions = Pick<BarContainsOptions, 'hitArea'>
export type BarGeometryScope = 'group'
export type BarRelation = 'group' | 'dataset'

export type BarItemHit = InteractionHit<number, 'bar-item', BarGeometryScope> & {
  readonly datasetIndex: number
  readonly categoryIndex: number
  readonly dataset: BarDataset
}

export type BarGroupHit = InteractionHit<readonly (number | undefined)[], 'bar-group'> & {
  readonly categoryIndex: number
}

export type BarPlotAccess = {
  datasets(): readonly BarDataset[]
  categoryCount(): number
  categoryLayout(categoryIndex: number, space: ChartSpace): readonly BarLayoutItem[]
  strategyType(): 'grouped' | 'stacked'
}

export class BarInteractionSource implements InteractionSource {

  constructor(private readonly plot: BarPlotAccess) { }

  identityKeyEquals(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
      return a.every((value, index) => value === b[index])
    }

    return a === b
  }

  contains(options: BarContainsOptions = {}): BarItemSelection {
    return new BarContainsSelection(this, options.gaps ?? 'miss', options.hitArea ?? 'geometry')
  }

  containsGroup(options: BarContainsGroupOptions = {}): Selection<BarGroupHit> {
    return new BarContainsGroupSelection(this, options.hitArea ?? 'geometry')
  }

  hitAt(pointer: Point, gaps: BarGapPolicy, hitArea: BarHitArea, space: ChartSpace): BarItemHit | null {
    const categoryIndex = this.resolveCategory(pointer, space)
    if (categoryIndex === null) return null

    const effectiveHitArea: BarHitArea = hitArea === 'vertical' && this.plot.strategyType() === 'stacked' ? 'geometry' : hitArea

    let found: BarLayoutItem | null = null
    for (const item of this.plot.categoryLayout(categoryIndex, space)) {
      if (item.value === 0) continue

      const rect = gaps === 'nearest' ? item.slotRect : item.rect
      if (hitAreaContains(rect, pointer, effectiveHitArea)) found = item
    }

    return found ? this.createHit(found, pointer) : null
  }

  hitGroupAt(pointer: Point, hitArea: BarHitArea, space: ChartSpace): BarGroupHit | null {
    const categoryIndex = this.resolveCategory(pointer, space)
    if (categoryIndex === null) return null

    const items = this.plot.categoryLayout(categoryIndex, space)
    if (items.length === 0) return null

    const groupRect = items[0].groupRect
    if (!hitAreaContains(groupRect, pointer, hitArea)) return null

    return this.createGroupHit(categoryIndex, items, hitArea, pointer, space)
  }

  private resolveCategory(pointer: Point, space: ChartSpace): number | null {
    return categoryAt(pointer.x, space, this.plot.categoryCount())
  }

  groupItems(categoryIndex: number, space: ChartSpace): readonly BarLayoutItem[] {
    return this.plot.categoryLayout(categoryIndex, space)
  }

  datasetItems(datasetIndex: number, space: ChartSpace): readonly BarLayoutItem[] {
    const items: BarLayoutItem[] = []
    const count = this.plot.categoryCount()

    for (let categoryIndex = 0; categoryIndex < count; categoryIndex++) {
      const item = this.plot.categoryLayout(categoryIndex, space).find(candidate => candidate.datasetIndex === datasetIndex)
      if (item) items.push(item)
    }

    return items
  }

  createHit(item: BarLayoutItem, pointer: Point): BarItemHit {
    return {
      kind: 'bar-item',
      source: this,
      datum: item.value,
      identity: { source: this, kind: 'item', key: [item.datasetIndex, item.categoryIndex] },
      memberships: [
        { source: this, kind: 'dataset', key: item.datasetIndex },
        { source: this, kind: 'group', key: item.categoryIndex },
      ],
      geometry: itemGeometry(item),
      geometryFor: scope => scope === 'group' ? groupGeometry(item) : null,
      distance: distanceToRect(item.rect, pointer),
      contains: rectContains(item.rect, pointer),
      targets: [item.target],
      datasetIndex: item.datasetIndex,
      categoryIndex: item.categoryIndex,
      dataset: this.plot.datasets()[item.datasetIndex],
    }
  }

  private createGroupHit(categoryIndex: number, items: readonly BarLayoutItem[], hitArea: BarHitArea, pointer: Point, space: ChartSpace): BarGroupHit {
    const groupRect = items[0].groupRect
    const yRange: readonly [number, number] = hitArea === 'vertical'
      ? [space.layout.y, space.layout.y + space.layout.height]
      : [groupRect.minY, groupRect.maxY]

    const anchor: Point = { x: (groupRect.minX + groupRect.maxX) / 2, y: (yRange[0] + yRange[1]) / 2 }

    return {
      kind: 'bar-group',
      source: this,
      datum: this.plot.datasets().map(dataset => dataset.values[categoryIndex]),
      identity: { source: this, kind: 'group', key: categoryIndex },
      memberships: [],
      geometry: geometryFromRanges(anchor, [groupRect.minX, groupRect.maxX], yRange),
      geometryFor: () => null,
      distance: distanceToRect(groupRect, pointer),
      contains: rectContains(groupRect, pointer),
      targets: items.map(item => item.target),
      categoryIndex,
    }
  }
}

export abstract class BarItemSelection extends Selection<BarItemHit> {

  constructor(protected readonly source: BarInteractionSource) {
    super()
  }

  related(relation: BarRelation): Selection<BarItemHit> {
    return new BarRelatedSelection(this, this.source, relation)
  }
}

class BarContainsSelection extends BarItemSelection {

  constructor(source: BarInteractionSource, private readonly gaps: BarGapPolicy, private readonly hitArea: BarHitArea) {
    super(source)
  }

  resolve(ctx: InteractionResolveContext): readonly BarItemHit[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hit = this.source.hitAt(pointer.point, this.gaps, this.hitArea, ctx.space)
    return hit ? [hit] : []
  }
}

class BarContainsGroupSelection extends Selection<BarGroupHit> {

  constructor(private readonly source: BarInteractionSource, private readonly hitArea: BarHitArea) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly BarGroupHit[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hit = this.source.hitGroupAt(pointer.point, this.hitArea, ctx.space)
    return hit ? [hit] : []
  }
}

class BarRelatedSelection extends Selection<BarItemHit> {

  constructor(
    private readonly parent: InteractionResolver<BarItemHit>,
    private readonly source: BarInteractionSource,
    private readonly relation: BarRelation
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly BarItemHit[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hits: BarItemHit[] = []
    for (const hit of ctx.frame.resolve(this.parent, ctx.input)) {
      const items = this.relation === 'group'
        ? this.source.groupItems(hit.categoryIndex, ctx.space)
        : this.source.datasetItems(hit.datasetIndex, ctx.space)

      for (const item of items) hits.push(this.source.createHit(item, pointer.point))
    }

    return hits
  }
}

function categoryAt(x: number, space: ChartSpace, count: number): number | null {
  const chartX = space.layoutToChartX(x)
  if (!Number.isFinite(chartX)) return null

  const index = Math.floor(chartX)
  if (index < 0 || index >= count) return null

  return index
}

function rectContains(rect: InteractionBounds, point: Point): boolean {
  return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY
}

function xRangeContains(rect: InteractionBounds, x: number): boolean {
  return x >= rect.minX && x <= rect.maxX
}

function hitAreaContains(rect: InteractionBounds, point: Point, hitArea: BarHitArea): boolean {
  return hitArea === 'vertical' ? xRangeContains(rect, point.x) : rectContains(rect, point)
}

function distanceToRect(rect: InteractionBounds, point: Point): number {
  const dx = Math.max(rect.minX - point.x, 0, point.x - rect.maxX)
  const dy = Math.max(rect.minY - point.y, 0, point.y - rect.maxY)
  return Math.hypot(dx, dy)
}

function itemGeometry(item: BarLayoutItem): InteractionGeometry {
  const anchor = {
    x: (item.rect.minX + item.rect.maxX) / 2,
    y: item.value < 0 ? item.rect.maxY : item.rect.minY,
  }

  return geometryFromRanges(anchor, [item.rect.minX, item.rect.maxX], [item.rect.minY, item.rect.maxY])
}

function groupGeometry(item: BarLayoutItem): InteractionGeometry {
  const anchor = {
    x: (item.groupRect.minX + item.groupRect.maxX) / 2,
    y: (item.groupRect.minY + item.groupRect.maxY) / 2,
  }

  return geometryFromRanges(anchor, [item.groupRect.minX, item.groupRect.maxX], [item.groupRect.minY, item.groupRect.maxY])
}
