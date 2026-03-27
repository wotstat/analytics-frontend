import { watch } from 'vue'

type WatchSources = Parameters<typeof watch>[0]

export function watchWithAbortSignal(sources: WatchSources, callback: (signal: AbortSignal) => void) {
  let abortController = new AbortController()
  watch(sources, () => {
    abortController.abort()
    abortController = new AbortController()
    callback(abortController.signal)
  })
}