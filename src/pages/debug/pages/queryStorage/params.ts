import { defineParams, type QueryParam } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { arrayParam, booleanParam, dateParam, numberParam, oneOfParam, setParam, setOfParam, stringParam } from '@/shared/uiKit/queryStorage/params'
import { numberSerializer } from '@/shared/uiKit/queryStorage/serializers/numberSerializer'
import { stringSerializer } from '@/shared/uiKit/queryStorage/serializers/stringSerializer'

export const demoParams = defineParams({
  season: stringParam('', { label: 'debug-season', history: 'push' }),
  shot: numberParam(0, { label: 'debug-shot', debounce: 500 }),
  visible: booleanParam(true, { label: 'debug-visible' }),
  date: dateParam(new Date('2026-10-10'), { label: 'debug-date', precision: 'day' }),
  labels: arrayParam(stringSerializer, ['танк'], {
    label: 'debug-labels', validate: value => value.trim().length > 0
  }),
  regions: setOfParam(['RU', 'EU'], ['RU'], { label: 'debug-regions' }),
  snapshot: {
    label: 'debug-default',
    default: { nested: { count: 1 }, values: [1] }
  },
  items: setParam(numberSerializer, [], { label: 'debug-items', validate: Number.isSafeInteger })
})

export const contextRegion = oneOfParam(['RU', 'EU'], 'RU', {
  label: 'debug-context-region', key: 'debug.context-region', history: 'push', debounce: 800
}) satisfies QueryParam<'RU' | 'EU'>

export const contextSources = {
  label: 'debug-context-sources', key: 'debug.context-sources', default: [] as string[],
  context: { region: contextRegion }, debounce: 300,
  serialize: (sources: string[], context?: { region: string }) => sources.map(region => region === context?.region ? '_' : region).join(','),
  deserialize: (raw: string, context?: { region: string }): string[] => raw ? raw.split(',').map(value => {
    const region = value === '_' ? context?.region : value
    if (region !== 'RU' && region !== 'EU') throw new Error('Unknown source region')
    return region
  }) : []
}

export const conditionalMode = oneOfParam(['details', 'summary'], 'details', {
  label: 'debug-conditional-mode', history: 'push', debounce: 400
})

export const conditionalSearch = stringParam('', {
  label: 'debug-conditional-search', debounce: 600,
  context: { mode: conditionalMode },
  enabled: ({ mode }: { mode: 'details' | 'summary' }) => mode === 'details'
})
