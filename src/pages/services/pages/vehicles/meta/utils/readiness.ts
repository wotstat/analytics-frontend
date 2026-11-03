import { ref, watch } from 'vue'
import { isErrorStatus, loading, type Status } from '@/db'
import { useMetaReady } from '@/meta/cards/useMetaReady'

export function useVehiclesMetaReady(statuses: () => Status[]) {
  const state = ref<'loading' | 'ready' | 'error'>('loading')

  useMetaReady(async ({ signal }) => {
    let cleanup = () => { }
    try {
      await new Promise<void>((resolve, reject) => {
        const check = () => {
          const current = statuses()
          const failure = current.find(isErrorStatus)
          if (failure) return reject(new Error(failure.reason))
          if (current.every(status => status !== loading)) resolve()
        }

        const stop = watch(statuses, check)
        const abort = () => reject(signal.reason)
        signal.addEventListener('abort', abort, { once: true })
        check()

        // Снимаем наблюдение и после ошибки, и после успешного снимка.
        cleanup = () => {
          stop()
          signal.removeEventListener('abort', abort)
        }
      })

      state.value = 'ready'
    } catch (error) {
      state.value = 'error'
      throw error
    } finally { cleanup() }
  })

  return state
}
