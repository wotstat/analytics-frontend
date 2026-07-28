import { ref } from 'vue'

export type EventLogEntry = {
  id: number
  time: string
  text: string
}

type EventLogOptions = {
  max?: number
  time?: 'clock' | 'relative'
  collapseRepeats?: boolean
}

export function useEventLog(options: EventLogOptions = {}) {
  const { max = 60, time = 'clock', collapseRepeats = false } = options

  const entries = ref<EventLogEntry[]>([])
  let counter = 0
  let start = 0
  let lastText = ''
  let lastId = -1
  let repeats = 0

  function stamp() {
    if (time === 'relative') {
      const now = performance.now()
      if (entries.value.length === 0) start = now
      return `+${Math.round(now - start)} мс`
    }

    const now = new Date()
    return [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(part => part.toString().padStart(2, '0'))
      .join(':') + '.' + now.getMilliseconds().toString().padStart(3, '0')
  }

  function push(text: string) {
    const at = stamp()

    if (collapseRepeats && text === lastText && entries.value[0]?.id === lastId) {
      repeats++
      entries.value[0] = { id: lastId, time: at, text: `${text} ×${repeats + 1}` }
      return
    }

    lastText = text
    lastId = counter++
    repeats = 0

    entries.value.unshift({ id: lastId, time: at, text })
    if (entries.value.length > max) entries.value.length = max
  }

  function clear() {
    entries.value = []
    lastText = ''
    lastId = -1
    repeats = 0
  }

  return { entries, push, clear }
}
