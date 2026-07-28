import { ref } from 'vue'

// Лог событий поповера. Большая часть событий (targetOutsideWindow, popoverOutsideWindow,
// pointerDownOutside) глазами не видна — единственный способ их проверить руками.

export type EventLogEntry = {
  id: number
  time: string
  text: string
}

const MAX_ENTRIES = 60

export function useEventLog() {
  const entries = ref<EventLogEntry[]>([])
  let counter = 0

  function push(text: string) {
    const now = new Date()
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(part => part.toString().padStart(2, '0'))
      .join(':') + '.' + now.getMilliseconds().toString().padStart(3, '0')

    // Новые записи сверху: так не нужно скроллить лог, чтобы увидеть последнее событие.
    entries.value.unshift({ id: counter++, time, text })
    if (entries.value.length > MAX_ENTRIES) entries.value.length = MAX_ENTRIES
  }

  function clear() {
    entries.value = []
  }

  return { entries, push, clear }
}
