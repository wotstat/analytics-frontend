import { inject, onMounted, onScopeDispose, type InjectionKey } from 'vue'

export const metaReadyKey: InjectionKey<(ready: Promise<void>) => void> = Symbol('meta-ready')

export const useMetaReady = (prepare: (context: { signal: AbortSignal }) => void | Promise<void>) => {
  const register = inject(metaReadyKey)
  if (!register) throw new Error('useMetaReady must be used inside CardSurface')

  const controller = new AbortController()
  const ready = Promise.withResolvers<void>()
  register(ready.promise)

  onMounted(async () => {
    try {
      controller.signal.throwIfAborted()
      await prepare({ signal: controller.signal })
      ready.resolve()
    } catch (error) {
      ready.reject(error)
    }
  })

  onScopeDispose(() => {
    controller.abort(new Error('Meta card is unmounted'))
    ready.reject(controller.signal.reason)
  })
}
