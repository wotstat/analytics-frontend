import { ref } from 'vue'

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

    entries.value.unshift({ id: counter++, time, text })
    if (entries.value.length > MAX_ENTRIES) entries.value.length = MAX_ENTRIES
  }

  function clear() {
    entries.value = []
  }

  return { entries, push, clear }
}
