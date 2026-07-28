import { watch } from 'vue'
import { displayedTooltips } from '@/shared/uiKit/tooltip/tooltip'
import { useEventLog } from './useEventLog'


export function useDisplayedTooltipsLog() {
  const { entries, push, clear } = useEventLog()
  let known = new Set<string>()

  watch(displayedTooltips, groups => {
    const next = new Set(groups.keys())

    for (const group of next) if (!known.has(group)) push(`показан «${group}»`)
    for (const group of known) if (!next.has(group)) push(`скрыт «${group}»`)

    known = next
  }, { deep: true })

  return { entries, clear }
}
