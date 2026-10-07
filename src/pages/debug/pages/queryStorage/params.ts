import { defineParams } from '@/shared/ui/queryStorage/useQueryStorage'

export const demoParams = defineParams({
  season: { type: String, label: 'debug-season', default: '', history: 'push' },
  shot: { type: Number, label: 'debug-shot', default: 0, debounce: 500 },
  visible: { type: Boolean, label: 'debug-visible', default: true },
  items: {
    label: 'debug-items',
    default: () => new Set<number>(),
    serialize: (items: Set<number>) => [...items].sort((a, b) => a - b).join(','),
    deserialize: (raw: string) => {
      const items = raw.split(',').filter(Boolean).map(Number)
      if (items.some(item => !Number.isSafeInteger(item))) throw new Error('Некорректный набор')
      return new Set(items)
    }
  }
})
