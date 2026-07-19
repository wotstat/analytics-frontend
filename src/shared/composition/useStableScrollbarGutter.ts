import { onMounted, onUnmounted } from 'vue'

let activeComponents = 0
let previousValue = ''
let previousPriority = ''

function enableStableScrollbarGutter() {
  const style = document.documentElement.style

  previousValue = style.getPropertyValue('scrollbar-gutter')
  previousPriority = style.getPropertyPriority('scrollbar-gutter')
  style.setProperty('scrollbar-gutter', 'stable')
}

function disableStableScrollbarGutter() {
  const style = document.documentElement.style

  if (previousValue) {
    style.setProperty('scrollbar-gutter', previousValue, previousPriority)
  } else {
    style.removeProperty('scrollbar-gutter')
  }

  previousValue = ''
  previousPriority = ''
}

export function useStableScrollbarGutter() {
  onMounted(() => {
    if (activeComponents === 0) enableStableScrollbarGutter()
    activeComponents++
  })

  onUnmounted(() => {
    if (activeComponents === 0) return

    activeComponents--
    if (activeComponents === 0) disableStableScrollbarGutter()
  })
}
