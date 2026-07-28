import { useRafFn } from '@vueuse/core'
import { ref, watch, type Ref } from 'vue'

// Средняя и худшая длительность кадра за последние ~500мс — маркер джанка при массовой анимации.
export function useFrameStats(enabled: Ref<boolean>) {
  const average = ref(0)
  const worst = ref(0)

  let frames = 0
  let sum = 0
  let peak = 0
  let last = 0
  let windowStart = 0

  const { pause, resume } = useRafFn(() => {
    const now = performance.now()
    const delta = now - last
    last = now

    if (delta > 0 && delta < 1000) {
      frames++
      sum += delta
      peak = Math.max(peak, delta)
    }

    if (now - windowStart < 500) return

    average.value = frames > 0 ? sum / frames : 0
    worst.value = peak
    frames = 0
    sum = 0
    peak = 0
    windowStart = now
  }, { immediate: false })

  watch(enabled, value => {
    if (!value) {
      pause()
      return
    }

    last = performance.now()
    windowStart = last
    frames = 0
    sum = 0
    peak = 0
    resume()
  }, { immediate: true })

  return { average, worst }
}
