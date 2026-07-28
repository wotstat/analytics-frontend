import { onUnmounted } from 'vue'

export function useTimeouts() {
  const handles = new Set<ReturnType<typeof setTimeout>>()

  function after(delay: number, action: () => void) {
    const handle = setTimeout(() => {
      handles.delete(handle)
      action()
    }, delay)
    handles.add(handle)
  }

  function cancelAll() {
    handles.forEach(clearTimeout)
    handles.clear()
  }

  onUnmounted(cancelAll)

  return { after, cancelAll }
}
