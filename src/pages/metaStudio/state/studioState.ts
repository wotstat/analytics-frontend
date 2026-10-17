import { createGlobalState, useLocalStorage } from '@vueuse/core'
import type { MetaFormat } from '@/meta/utils'
import { metaDefinitions as cards } from '@/meta/definitions'

type StudioCardState = {
  mode: 'examples' | 'url'
  exampleIndex: number
  format: MetaFormat
  previewMode: 'card' | 'social'
  customUrl: string
}

type StudioState = Record<string, StudioCardState>

export const getStudioUrl = (card: (typeof cards)[number], state: StudioCardState) => {
  if (state.mode === 'url') return state.customUrl
  return card.examples[state.exampleIndex]?.url ?? card.examples[0]?.url ?? ''
}

export const useStudioState = createGlobalState(() => {
  const defaults: StudioState = Object.fromEntries(cards.map(card => [card.id, {
    mode: card.examples.length ? 'examples' : 'url', exampleIndex: 0, format: 'og', previewMode: 'card', customUrl: '',
  }]))

  return useLocalStorage('wotstat-meta-studio-state', defaults, {
    flush: 'sync',
    listenToStorageChanges: false,
    mergeDefaults: (saved, defaults) => {
      if (!saved || typeof saved !== 'object') return defaults
      const state = { ...defaults }

      for (const card of cards) {
        const entry = saved[card.id]
        if (!entry || typeof entry !== 'object') continue
        let { exampleIndex } = entry
        if (!Number.isInteger(exampleIndex) || exampleIndex < 0 || exampleIndex >= card.examples.length) exampleIndex = 0

        state[card.id] = {
          mode: entry.mode === 'url' || !card.examples.length ? 'url' : 'examples',
          exampleIndex,
          format: entry.format === 'twitter' ? 'twitter' : 'og',
          previewMode: entry.previewMode === 'social' ? 'social' : 'card',
          customUrl: typeof entry.customUrl === 'string' ? entry.customUrl : '',
        }
      }

      return state
    },
    onError: () => { /* Просмотр работает и без хранилища браузера. */ },
  })
})
