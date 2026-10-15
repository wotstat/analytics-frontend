import { shallowRef } from 'vue'
import { query } from '@/db'
import { createMetaResolver } from '../utils'

const revision = shallowRef(0)
let resolver: ReturnType<typeof createMetaResolver> | undefined

function getResolver() {
  resolver ??= createMetaResolver(query, () => { revision.value++ })
  return resolver
}

export function readBrowserMeta(url: URL) {
  // Зависимость computed/render от последнего успешного обновления контекстов.
  void revision.value
  return getResolver().readMeta(url)
}

export const resolveBrowserMeta = (url: URL) => getResolver().resolveMeta(url)

import.meta.hot?.dispose(() => resolver?.close())
