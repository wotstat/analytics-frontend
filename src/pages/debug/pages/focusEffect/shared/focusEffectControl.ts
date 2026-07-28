import { computed, triggerRef } from 'vue'
import { activeShowEffects } from '@/shared/uiKit/focusEffect/focusEffect'


export const EFFECT_LIFETIME_MS = 1000

export const PULSE_INTERVAL_MS = 700

export const activeEffectsCount = computed(() => activeShowEffects.value.size)

export function clearFocusEffects() {
  if (activeShowEffects.value.size === 0) return
  activeShowEffects.value.clear()
  triggerRef(activeShowEffects)
}

export function targetLabel(element: HTMLElement) {
  return element.dataset.focusLabel ?? `<${element.tagName.toLowerCase()}>`
}
