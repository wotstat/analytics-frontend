import { geometryFromRanges, InteractionBounds, InteractionGeometry } from '../../interaction/core/InteractionGeometry'
import { InteractionHit } from '../../interaction/core/InteractionHit'
import { InteractionResolveContext, InteractionResolver } from '../../interaction/core/InteractionResolver'
import { Selection } from '../../interaction/core/Selection'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import type { BarDataset, BarDatum, BarLayoutItem } from './Bar'

export type BarGapPolicy = 'miss' | 'nearest'
export type BarHitArea = 'geometry' | 'vertical'

export type BarContainsOptions = {
  gaps?: BarGapPolicy
  groupGaps?: BarGapPolicy
  hitArea?: BarHitArea
}

export type BarContainsGroupOptions = Pick<BarContainsOptions, 'groupGaps' | 'hitArea'>
export type BarGeometryScope = 'group'
export type BarRelation = 'group' | 'dataset'

export type BarItemHit<TCategory = number, TBarDatum extends BarDatum = number> = InteractionHit<TBarDatum, 'bar-item', BarGeometryScope> & {
  readonly value: number
  readonly datasetIndex: number
  readonly categoryIndex: number
  readonly category: TCategory
  readonly dataset: BarDataset<TBarDatum>
}

export type BarGroupHit<TCategory = number, TBarDatum extends BarDatum = number> = InteractionHit<readonly (TBarDatum | undefined)[], 'bar-group'> & {
  readonly categoryIndex: number
  readonly category: TCategory
}

export type BarPlotAccess<TCategory = number, TBarDatum extends BarDatum = number> = {
  categories(): readonly TCategory[]
  datasets(): readonly BarDataset<TBarDatum>[]
  categoryCount(): number
  categoryLayout(categoryIndex: number, space: ChartSpace): readonly BarLayoutItem<TBarDatum>[]
  strategyType(): 'grouped' | 'stacked'
}

function barItemKey(datasetIndex: number, categoryIndex: number): string {
  return `${datasetIndex}:${categoryIndex}`
}

export class BarInteractionSource<TCategory = number, TBarDatum extends BarDatum = number> {

  readonly id = Symbol('BarInteractionSource')

  constructor(private readonly plot: BarPlotAccess<TCategory, TBarDatum>) { }

  contains(options: BarContainsOptions = {}): BarItemSelection<TCategory, TBarDatum> {
    return new BarContainsSelection(this, options.gaps ?? 'nearest', options.groupGaps ?? 'miss', options.hitArea ?? 'geometry')
  }

  containsGroup(options: BarContainsGroupOptions = {}): Selection<BarGroupHit<TCategory, TBarDatum>> {
    return new BarContainsGroupSelection(this, options.groupGaps ?? 'miss', options.hitArea ?? 'geometry')
  }

  hitAt(pointer: Point, gaps: BarGapPolicy, groupGaps: BarGapPolicy, hitArea: BarHitArea, space: ChartSpace): BarItemHit<TCategory, TBarDatum> | null {
    const categoryIndex = this.resolveCategory(pointer, space)
    if (categoryIndex === null) return null

    const effectiveHitArea: BarHitArea = hitArea === 'vertical' && this.plot.strategyType() === 'stacked' ? 'geometry' : hitArea
    const items = this.plot.categoryLayout(categoryIndex, space)
    const hitPointer = groupGaps === 'nearest' && items.length > 0 ? clampX(pointer, items[0].groupRect) : pointer

    let found: BarLayoutItem<TBarDatum> | null = null
    for (const item of items) {
      if (item.value === 0) continue

      const rect = gaps === 'nearest' ? item.slotRect : item.rect
      if (hitAreaContains(rect, hitPointer, effectiveHitArea)) found = item
    }

    return found ? this.createHit(found, pointer) : null
  }

  hitGroupAt(pointer: Point, groupGaps: BarGapPolicy, hitArea: BarHitArea, space: ChartSpace): BarGroupHit<TCategory, TBarDatum> | null {
    const categoryIndex = this.resolveCategory(pointer, space)
    if (categoryIndex === null) return null

    const items = this.plot.categoryLayout(categoryIndex, space)
    if (items.length === 0) return null

    const groupRect = items[0].groupRect
    const hitRect = groupGaps === 'nearest' ? categoryRect(categoryIndex, groupRect, space) : groupRect
    if (!hitAreaContains(hitRect, pointer, hitArea)) return null

    return this.createGroupHit(categoryIndex, items, hitArea, pointer, space)
  }

  private resolveCategory(pointer: Point, space: ChartSpace): number | null {
    return categoryAt(pointer.x, space, this.plot.categoryCount())
  }

  groupItems(categoryIndex: number, space: ChartSpace): readonly BarLayoutItem<TBarDatum>[] {
    return this.plot.categoryLayout(categoryIndex, space)
  }

  datasetItems(datasetIndex: number, space: ChartSpace): readonly BarLayoutItem<TBarDatum>[] {
    const items: BarLayoutItem<TBarDatum>[] = []
    const count = this.plot.categoryCount()

    for (let categoryIndex = 0; categoryIndex < count; categoryIndex++) {
      const item = this.plot.categoryLayout(categoryIndex, space).find(candidate => candidate.datasetIndex === datasetIndex)
      if (item) items.push(item)
    }

    return items
  }

  createHit(item: BarLayoutItem<TBarDatum>, pointer: Point): BarItemHit<TCategory, TBarDatum> {
    return {
      kind: 'bar-item',
      sourceId: this.id,
      datum: item.datum,
      identity: { sourceId: this.id, kind: 'item', key: barItemKey(item.datasetIndex, item.categoryIndex) },
      memberships: [
        { sourceId: this.id, kind: 'dataset', key: item.datasetIndex },
        { sourceId: this.id, kind: 'group', key: item.categoryIndex },
      ],
      geometry: itemGeometry(item),
      geometryFor: scope => scope === 'group' ? groupGeometry(item) : null,
      distance: distanceToRect(item.rect, pointer),
      contains: rectContains(item.rect, pointer),
      targets: [item.target],
      value: item.value,
      datasetIndex: item.datasetIndex,
      categoryIndex: item.categoryIndex,
      category: this.plot.categories()[item.categoryIndex],
      dataset: this.plot.datasets()[item.datasetIndex],
    }
  }

  private createGroupHit(categoryIndex: number, items: readonly BarLayoutItem<TBarDatum>[], hitArea: BarHitArea, pointer: Point, space: ChartSpace): BarGroupHit<TCategory, TBarDatum> {
    const groupRect = items[0].groupRect
    const yRange: readonly [number, number] = hitArea === 'vertical'
      ? [space.layout.y, space.layout.y + space.layout.height]
      : [groupRect.minY, groupRect.maxY]

    const anchor: Point = { x: (groupRect.minX + groupRect.maxX) / 2, y: (yRange[0] + yRange[1]) / 2 }

    return {
      kind: 'bar-group',
      sourceId: this.id,
      datum: this.plot.datasets().map(dataset => dataset.values[categoryIndex]),
      identity: { sourceId: this.id, kind: 'group', key: categoryIndex },
      memberships: [],
      geometry: geometryFromRanges(anchor, [groupRect.minX, groupRect.maxX], yRange),
      geometryFor: () => null,
      distance: distanceToRect(groupRect, pointer),
      contains: rectContains(groupRect, pointer),
      targets: items.map(item => item.target),
      categoryIndex,
      category: this.plot.categories()[categoryIndex],
    }
  }
}

export abstract class BarItemSelection<TCategory = number, TBarDatum extends BarDatum = number> extends Selection<BarItemHit<TCategory, TBarDatum>> {

  constructor(protected readonly source: BarInteractionSource<TCategory, TBarDatum>) {
    super()
  }

  related(relation: BarRelation): Selection<BarItemHit<TCategory, TBarDatum>> {
    return new BarRelatedSelection(this, this.source, relation)
  }
}

class BarContainsSelection<TCategory, TBarDatum extends BarDatum> extends BarItemSelection<TCategory, TBarDatum> {

  constructor(source: BarInteractionSource<TCategory, TBarDatum>, private readonly gaps: BarGapPolicy, private readonly groupGaps: BarGapPolicy, private readonly hitArea: BarHitArea) {
    super(source)
  }

  resolve(ctx: InteractionResolveContext): readonly BarItemHit<TCategory, TBarDatum>[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hit = this.source.hitAt(pointer.point, this.gaps, this.groupGaps, this.hitArea, ctx.space)
    return hit ? [hit] : []
  }
}

class BarContainsGroupSelection<TCategory, TBarDatum extends BarDatum> extends Selection<BarGroupHit<TCategory, TBarDatum>> {

  constructor(private readonly source: BarInteractionSource<TCategory, TBarDatum>, private readonly groupGaps: BarGapPolicy, private readonly hitArea: BarHitArea) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly BarGroupHit<TCategory, TBarDatum>[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hit = this.source.hitGroupAt(pointer.point, this.groupGaps, this.hitArea, ctx.space)
    return hit ? [hit] : []
  }
}

class BarRelatedSelection<TCategory, TBarDatum extends BarDatum> extends Selection<BarItemHit<TCategory, TBarDatum>> {

  constructor(
    private readonly parent: InteractionResolver<BarItemHit<TCategory, TBarDatum>>,
    private readonly source: BarInteractionSource<TCategory, TBarDatum>,
    private readonly relation: BarRelation
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly BarItemHit<TCategory, TBarDatum>[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hits: BarItemHit<TCategory, TBarDatum>[] = []
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

function categoryRect(categoryIndex: number, groupRect: InteractionBounds, space: ChartSpace): InteractionBounds {
  return { ...groupRect, minX: space.chartToLayoutX(categoryIndex), maxX: space.chartToLayoutX(categoryIndex + 1) }
}

function clampX(point: Point, rect: InteractionBounds): Point {
  return { ...point, x: Math.max(rect.minX, Math.min(point.x, rect.maxX)) }
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

function itemGeometry<TBarDatum extends BarDatum>(item: BarLayoutItem<TBarDatum>): InteractionGeometry {
  const anchor = {
    x: (item.rect.minX + item.rect.maxX) / 2,
    y: item.value < 0 ? item.rect.maxY : item.rect.minY,
  }

  return geometryFromRanges(anchor, [item.rect.minX, item.rect.maxX], [item.rect.minY, item.rect.maxY])
}

function groupGeometry<TBarDatum extends BarDatum>(item: BarLayoutItem<TBarDatum>): InteractionGeometry {
  const anchor = {
    x: (item.groupRect.minX + item.groupRect.maxX) / 2,
    y: (item.groupRect.minY + item.groupRect.maxY) / 2,
  }

  return geometryFromRanges(anchor, [item.groupRect.minX, item.groupRect.maxX], [item.groupRect.minY, item.groupRect.maxY])
}
