import { ref } from 'vue'

// Время в логе — от первой записи, а не по часам: у эффекта всё меряется
// сотнями миллисекунд, и важны именно интервалы между вызовами.

export type EventLogEntry = {
  id: number
  time: string
  text: string
}

const MAX_ENTRIES = 50

export function useEventLog() {
  const entries = ref<EventLogEntry[]>([])
  let counter = 0
  let start = 0

  function push(text: string) {
    const now = performance.now()
    if (entries.value.length === 0) start = now

    const time = `+${Math.round(now - start)} мс`

    // Новые записи сверху: последнее событие видно без скролла.
    entries.value.unshift({ id: counter++, time, text })
    if (entries.value.length > MAX_ENTRIES) entries.value.length = MAX_ENTRIES
  }

  function clear() {
    entries.value = []
  }

  return { entries, push, clear }
}
