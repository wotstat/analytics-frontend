import { ref } from 'vue'

// В API меню нет ни события выбора, ни события закрытия: и то и другое видно
// только по вызванным action и по watch на currentContextMenu.

export type EventLogEntry = {
  id: number
  time: string
  text: string
}

const MAX_ENTRIES = 80

export function useEventLog() {
  const entries = ref<EventLogEntry[]>([])
  let counter = 0

  function push(text: string) {
    const now = new Date()
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(part => part.toString().padStart(2, '0'))
      .join(':') + '.' + now.getMilliseconds().toString().padStart(3, '0')

    // Новые записи сверху — последнее событие видно без скролла.
    entries.value.unshift({ id: counter++, time, text })
    if (entries.value.length > MAX_ENTRIES) entries.value.length = MAX_ENTRIES
  }

  function clear() {
    entries.value = []
  }

  return { entries, push, clear }
}
