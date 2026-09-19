import { HighlightSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HighlightSynchronizer'
import type { InteractionTag } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionSource'
import { computed, onScopeDispose, shallowRef, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

export type LegendItem = {
  readonly name: string
  readonly color: string
  readonly tag: InteractionTag
  readonly loading?: boolean
}

export type LegendModel<TItem extends LegendItem = LegendItem> = {
  readonly items: ComputedRef<readonly TItem[]>
  readonly enabled: ComputedRef<readonly TItem[]>
  readonly enabledTags: ComputedRef<readonly TItem['tag'][]>
  readonly highlighted: ComputedRef<readonly TItem[]>
  readonly highlightSync: HighlightSynchronizer
  isEnabled(item: TItem): boolean
  isHighlighted(item: TItem): boolean
  toggle(item: TItem): void
  highlight(item: TItem): void
  clearHighlight(): void
}

export function useLegend<TItem extends LegendItem>(
  source: MaybeRefOrGetter<readonly TItem[]>,
  options: { highlightSync?: HighlightSynchronizer } = {},
): LegendModel<TItem> {
  const items = computed(() => toValue(source))
  const disabledTags = shallowRef<ReadonlySet<InteractionTag>>(new Set())
  const highlightedTags = shallowRef<readonly InteractionTag[]>([])

  const highlightSync = options.highlightSync ?? new HighlightSynchronizer()
  const connection = highlightSync.connect()
  let publishedTag: InteractionTag | undefined

  const enabled = computed(() => items.value.filter(item => !disabledTags.value.has(item.tag)))
  const enabledTags = computed(() => [...new Set(enabled.value.map(item => item.tag))])
  const highlighted = computed(() => {
    const tags = new Set(highlightedTags.value)
    return enabled.value.filter(item => tags.has(item.tag))
  })

  const stopSync = connection.subscribe(state => {
    highlightedTags.value = state ? [...state.tags] : []
  })

  watch(() => items.value.map(item => item.tag), tags => {
    const currentTags = new Set(tags)
    disabledTags.value = new Set([...disabledTags.value].filter(tag => currentTags.has(tag)))

    if (publishedTag !== undefined && !currentTags.has(publishedTag)) clearHighlight()
  })

  function isEnabled(item: TItem): boolean {
    return !disabledTags.value.has(item.tag)
  }

  function isHighlighted(item: TItem): boolean {
    return isEnabled(item) && highlightedTags.value.includes(item.tag)
  }

  function toggle(item: TItem): void {
    const next = new Set(disabledTags.value)
    if (next.has(item.tag)) next.delete(item.tag)
    else next.add(item.tag)
    disabledTags.value = next

    if (!isEnabled(item) && publishedTag === item.tag) clearHighlight()
  }

  function highlight(item: TItem): void {
    if (!isEnabled(item)) return
    publishedTag = item.tag
    connection.publish([item.tag])
  }

  function clearHighlight(): void {
    publishedTag = undefined
    connection.release()
  }

  onScopeDispose(() => {
    stopSync()
    connection.dispose()
  })

  return {
    items,
    enabled,
    enabledTags,
    highlighted,
    highlightSync,
    isEnabled,
    isHighlighted,
    toggle,
    highlight,
    clearHighlight,
  }
}
