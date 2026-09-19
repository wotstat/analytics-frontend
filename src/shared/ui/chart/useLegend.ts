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
  toggleFromClick(item: TItem, extend: boolean): void
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
  let toggleAnchor: { tag: InteractionTag, enabled: boolean } | undefined

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
    if (toggleAnchor && !currentTags.has(toggleAnchor.tag)) toggleAnchor = undefined
  })

  function isEnabled(item: TItem): boolean {
    return !disabledTags.value.has(item.tag)
  }

  function isHighlighted(item: TItem): boolean {
    return isEnabled(item) && highlightedTags.value.includes(item.tag)
  }

  function toggle(item: TItem): void {
    setEnabled([item], !isEnabled(item))
  }

  function toggleFromClick(item: TItem, extend: boolean): void {
    const anchor = toggleAnchor
    const anchorIndex = anchor
      ? items.value.findIndex(candidate => candidate.tag === anchor.tag)
      : -1
    const itemIndex = items.value.findIndex(candidate => candidate.tag === item.tag)

    if (extend && anchor && anchorIndex !== -1 && itemIndex !== -1) {
      const start = Math.min(anchorIndex, itemIndex)
      const end = Math.max(anchorIndex, itemIndex)
      setEnabled(items.value.slice(start, end + 1), anchor.enabled)
      toggleAnchor = { tag: item.tag, enabled: anchor.enabled }
      return
    }

    const enabled = !isEnabled(item)
    setEnabled([item], enabled)
    toggleAnchor = { tag: item.tag, enabled }
  }

  function setEnabled(targets: readonly TItem[], enabled: boolean): void {
    const next = new Set(disabledTags.value)
    for (const target of targets) {
      if (enabled) next.delete(target.tag)
      else next.add(target.tag)
    }
    disabledTags.value = next

    if (publishedTag !== undefined && next.has(publishedTag)) clearHighlight()
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
    toggleFromClick,
    highlight,
    clearHighlight,
  }
}
