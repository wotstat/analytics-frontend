import { describe, expect, mock, test } from 'bun:test'
import { shallowRef } from 'vue'
import { comparisonColor } from '../palette'
import fixtures from './codec.fixtures.json'

// Только граница с БД: каталоги готовы и не обращаются к сети.
// Кодек, компактеры, словари, палитра, Base62 и DEFLATE остаются настоящими.
mock.module('@/db', () => ({ loading: Symbol('loading'), isErrorStatus: () => false }))
mock.module('@/shared/game/domain/vehicles/catalog', () => ({
  vehicleCatalog: shallowRef({ status: Symbol('success'), data: fixtures.catalogs.vehicles }),
}))
mock.module('@/shared/game/domain/arenas/catalog', () => ({
  arenaCatalog: shallowRef({ status: Symbol('success'), data: fixtures.catalogs.arenas }),
}))

const { serializeComparison, deserializeComparison } = await import('./codec')

describe('compare v1: совместимость сохранённых ссылок', () => {
  for (const { name, compare, context, input, sources, colors } of fixtures.cases) {
    test(name, () => {
      // Ожидания хранятся в JSON, а не вычисляются обратным вызовом кодека.
      const decoded = deserializeComparison(compare, context)
      expect(decoded).toEqual(sources)
      expect(decoded.map(source => comparisonColor(source.color))).toEqual(colors)
      expect(serializeComparison(sources, context)).toBe(compare)
      if (input) expect(serializeComparison(input, context)).toBe(compare)
    })
  }
})
