import { ref } from 'vue'

// Ховер-коллбеки и переходы автомата глазами не разглядеть: без лога их не проверить.

export type EventLogEntry = {
  id: number
  time: string
  text: string
}

const MAX_ENTRIES = 60

export function useEventLog() {
  const entries = ref<EventLogEntry[]>([])
  let counter = 0
  let lastText = ''
  let lastId = -1
  let repeats = 0

  function push(text: string) {
    const now = new Date()
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(part => part.toString().padStart(2, '0'))
      .join(':') + '.' + now.getMilliseconds().toString().padStart(3, '0')

    // hoverUpdate прилетает каждым движением мыши — одинаковые подряд схлопываем в счётчик,
    // иначе лог за секунду выносит всё остальное.
    if (text === lastText && entries.value[0]?.id === lastId) {
      repeats++
      entries.value[0] = { id: lastId, time, text: `${text} ×${repeats + 1}` }
      return
    }

    lastText = text
    lastId = counter++
    repeats = 0

    entries.value.unshift({ id: lastId, time, text })
    if (entries.value.length > MAX_ENTRIES) entries.value.length = MAX_ENTRIES
  }

  function clear() {
    entries.value = []
    lastText = ''
    lastId = -1
    repeats = 0
  }

  return { entries, push, clear }
}
