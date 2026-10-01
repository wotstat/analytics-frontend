import { useTimeoutFn } from '@vueuse/core'
import { watch, type Ref } from 'vue'

export function usePopoverCloseDelay(open: Ref<boolean>) {
  const { start: closeAfterSelection, stop: cancelClose } = useTimeoutFn(() => {
    open.value = false
  }, 150, { immediate: false })

  watch(open, cancelClose, { flush: 'sync' })

  return { closeAfterSelection, cancelClose }
}
