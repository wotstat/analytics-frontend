import { shallowRef, triggerRef } from 'vue'
import { query } from '@/db'
import { createMetaResolver } from '../utils'

const resolver = shallowRef<ReturnType<typeof createMetaResolver>>()

export function getBrowserMetaResolver() {
  resolver.value ??= createMetaResolver(query, () => triggerRef(resolver))
  return resolver.value
}

import.meta.hot?.dispose(() => resolver.value?.close())
