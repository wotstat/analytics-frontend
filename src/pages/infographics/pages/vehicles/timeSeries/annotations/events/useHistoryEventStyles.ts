import { createSharedComposable, useStyleTag } from '@vueuse/core'
import { onActivated, onDeactivated, onScopeDispose } from 'vue'
import { historyEvents } from '@/shared/game/historyEvents'
import { ColorHSVA } from '@/shared/uiKit/colorPicker/ColorHSVA'

const useSharedStyles = createSharedComposable(() => {
  const css = historyEvents.map(event => {
    const accent = new ColorHSVA(0, 0, 0)
    accent.setHex(event.color)
    accent.s = Math.min(0.75, accent.s * 1.4)
    accent.v = Math.min(1, accent.v * 1.04)

    return `.history-event.annotation-${CSS.escape(event.id)} {
  --history-event-color: ${event.color};
  --history-event-accent: ${accent.cssOpaqueString};
}`
  }).join('\n')

  return { ...useStyleTag(css, { immediate: false }), activeConsumers: 0 }
})

export function useHistoryEventStyles() {
  const styles = useSharedStyles()
  let active = false

  function activate() {
    if (active) return
    active = true
    if (++styles.activeConsumers === 1) styles.load()
  }

  function deactivate() {
    if (!active) return
    active = false
    if (--styles.activeConsumers === 0) styles.unload()
  }

  activate()
  onActivated(activate)
  onDeactivated(deactivate)
  onScopeDispose(deactivate)
}
