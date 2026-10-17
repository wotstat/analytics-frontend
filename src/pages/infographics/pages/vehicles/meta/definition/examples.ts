import { serializeComparison } from '../../timeSeriesCompare/query/codec/codec'
import { createVehicleFilters } from '../../filters/types'
import type { SavedComparisonSource } from '../../timeSeriesCompare/query/state'

export function tableExamples() {
  const url = 'https://wotstat.info/session/vehicles'
  return [
    { name: 'Техника · RU', url },
    { name: 'Только X уровень', url: `${url}?level=10` },
    { name: 'По уровням', url: `${url}?group=levels` },
    { name: 'По типам', url: `${url}?group=classes` },
    { name: 'Типы по уровням · VIII–X', url: `${url}?group=classes-by-level&level=8,9,10` },
    { name: 'EU · за неделю', url: `${url}?region=EU&period=week` },
    { name: 'X · тяжёлые · победы', url: `${url}?level=10&type=HT&result=win` },
    { name: 'Один столбец · урон', url: `${url}?columns=damage&sort=damage` },
    { name: 'Четыре выбранных столбца', url: `${url}?columns=assist-radio,damage,winrate,blocked&sort=assist-radio` },
    { name: 'Пять столбцов · сортировка по содействию', url: `${url}?columns=assist-radio,damage,winrate,player-count,battles&sort=assist-radio` },
    { name: 'Составная сортировка · два показателя', url: `${url}?columns=battles,player-count,winrate,damage,blocked,assist-radio&sort=assist-radio,blocked-asc` },
    { name: 'Медиана · время и дистанция', url: `${url}?columns=damage-q50,duration,mileage&sort=damage-q50` },
    { name: 'Медиана · по возрастанию', url: `${url}?columns=damage-q50,duration,mileage&sort=damage-q50-asc` },
    { name: 'Проценты и дробные значения', url: `${url}?columns=winrate,survival,kills,spotted&sort=kills` },
    { name: 'Пустая выборка', url: `${url}?search=несуществующий-танк` },
  ]
}

export function compareExamples() {
  const url = 'https://wotstat.info/session/vehicles?region=RU'
  const filters = createVehicleFilters()

  const levelSources: SavedComparisonSource[] = [8, 9, 10].map((level, color) => ({
    target: { category: { level }, selection: { levels: [level], types: [], nations: [] } },
    filters, color, enabled: true,
  }))
  const tankSources: SavedComparisonSource[] = ['ussr:R45_IS-7', 'ussr:R52_Object_261', 'germany:G121_Grille_15_L63'].map((tank, color) => ({
    target: { tank }, filters, color, enabled: true,
  }))

  const levels = serializeComparison(levelSources, filters)
  const singleLevel = serializeComparison([levelSources[2]], filters)
  const object261 = serializeComparison([{ ...tankSources[1], color: 0 }], filters)
  const threeTanks = serializeComparison(tankSources, filters)
  const mixed = serializeComparison([tankSources[0], levelSources[2]], filters)
  const types = serializeComparison((['HT', 'AT'] as const).map((type, color) => ({
    target: { category: { type }, selection: { levels: [], types: [type], nations: [] } },
    filters, color, enabled: true,
  })), filters)
  const different = serializeComparison(['RU', 'EU'].map((region, color) => ({
    target: { tank: 'ussr:R45_IS-7' }, filters: { ...filters, regions: [region as 'RU' | 'EU'] }, color, enabled: true,
  })), filters)
  const results = serializeComparison((['win', 'loss'] as const).map((result, color) => ({
    target: { tank: 'ussr:R45_IS-7' }, filters: { ...filters, result }, color, enabled: true,
  })), filters)

  return [
    { name: 'Два танка · урон', url: `${url}&compare=4u2COGR` },
    { name: 'ИС-7 · урон', url: `${url}&compare=HpeZ` },
    { name: 'Два танка · победы', url: `${url}&metric=winrate&compare=4u2COGR` },
    { name: 'Объект 261 · победы', url: `${url}&metric=winrate&compare=${object261}` },
    { name: 'Три танка · урон', url: `${url}&compare=${threeTanks}` },
    { name: 'Уровни VIII / IX / X', url: `${url}&compare=${levels}` },
    { name: 'Один уровень · X', url: `${url}&compare=${singleLevel}` },
    { name: 'Типы · ТТ / ПТ-САУ', url: `${url}&compare=${types}` },
    { name: 'ИС-7 и X уровень', url: `${url}&compare=${mixed}` },
    { name: 'ИС-7 · RU против EU', url: `${url}&compare=${different}` },
    { name: 'ИС-7 · победы против поражений', url: `${url}&compare=${results}` },
    { name: 'Некорректная ссылка', url: `${url}&compare=invalid` },
  ]
}
