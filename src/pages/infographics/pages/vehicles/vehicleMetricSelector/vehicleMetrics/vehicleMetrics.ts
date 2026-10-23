import { aggregationOrder } from './aggregations'
import { statisticMetric } from './statisticMetric'
import { snapshotMetrics } from './snapshotMetrics'
import { sampleExpressions } from '../../shared/metricData/battle/expressions'
import type { MetricCatalogSection, MetricCategory, MetricDefinition, MetricCatalogEntry, MetricTileDefinition } from '../utils/metricTypes'

const derivedColor = '#bbaad6'

function average(column: string) {
  const valueCount = column === 'stunDuration'
  const countColumn = valueCount ? `${column}ValueCount` : 'battles'
  return {
    aggregations: aggregationOrder, column, valueCount,
    sql: `avgOrNull(stats.${column})`,
    dailySql: `sum(stats.${column}Sum) / nullIf(sum(stats.${countColumn}), 0)`,
  }
}

function ratio(numerator: string | string[], denominator: string | string[], multiplier = 1) {
  const sum = (columns: string | string[], suffix: string) => (Array.isArray(columns) ? columns : [columns]).map(column => `sum(stats.${column}${suffix})`).join(' + ')
  const expression = (suffix: string) => `${sum(numerator, suffix)} / nullIf(${sum(denominator, suffix)}, 0)${multiplier === 1 ? '' : ` * ${multiplier}`}`

  return {
    sql: expression(''), dailySql: expression('Sum'), aggregations: aggregationOrder, valueCount: true,
    color: derivedColor, headingColor: '#bd8de8',
  }
}

const metricCatalog = [
  {
    title: 'Общее', entries: [
      statisticMetric('battles', { icon: 'battles', label: 'Бои', ...sampleExpressions.battles }),
      statisticMetric('playerCount', { icon: 'player', label: 'Игроки', ...sampleExpressions.playerCount }),
      statisticMetric('winrate', { icon: 'winrate', label: 'Победы', sql: "countIf(stats.result = 'win') / nullIf(count(), 0) * 100", dailySql: 'sum(stats.wins) / nullIf(sum(stats.battles), 0) * 100', format: 'percent' }),
      statisticMetric('survival', { icon: 'hp', label: 'Выживаемость', sql: 'avgOrNull(stats.alive) * 100', dailySql: 'sum(stats.survived) / nullIf(sum(stats.battles), 0) * 100', format: 'percent' }),
      statisticMetric('xp', { icon: 'xp', label: 'Опыт', defaultLabel: 'Средний опыт', ...average('xp') }),
      statisticMetric('mileage', { icon: 'distance', label: 'Пройденная дистанция', ...average('mileage'), format: 'distance' }),
      statisticMetric('lifeTime', { icon: 'lifetime', label: 'Время жизни', ...average('lifeTime'), format: 'time' }),
      statisticMetric('duration', { icon: 'duration', label: 'Длительность боя', ...average('duration'), format: 'time' }),
    ],
  },
  {
    title: 'Основные', entries: [
      statisticMetric('damage', { icon: 'dmg', label: 'Урон', defaultLabel: 'Средний урон', ...average('damageDealt') }),
      statisticMetric('blocked', { icon: 'block', label: 'Заблокированный урон', ...average('damageBlockedByArmor') }),
      statisticMetric('assist', { icon: 'assist', label: 'Содействие', defaultLabel: 'Среднее содействие', ...average('damageAssistedTotal') }),
      statisticMetric('kills', { icon: 'kill', label: 'Уничтожения', defaultLabel: 'Средние уничтожения', ...average('kills'), format: 'decimal' }),
      statisticMetric('spotted', { icon: 'discover', label: 'Обнаружено противников', ...average('spotted'), format: 'decimal' }),
    ],
  },
  {
    title: 'Содействие', entries: [
      statisticMetric('assistRadio', { icon: 'assist-radio', label: 'Содействие по разведданным', ...average('damageAssistedRadio') }),
      statisticMetric('assistTrack', { icon: 'assist-track', label: 'Содействие по гусеницам', ...average('damageAssistedTrack') }),
      statisticMetric('assistStun', { icon: 'stun', label: 'Содействие по оглушению', ...average('damageAssistedStun') }),
      statisticMetric('maxAssist', { icon: 'assist', label: 'Максимальный вид содействия', ...average('damageAssistedMax') }),
      statisticMetric('damageForMarks', { icon: 'gun-mark-dmg', label: 'Сумма для отметки', ...average('damageForMarks') }),
      statisticMetric('damaged', { icon: 'dmg', label: 'Повреждено противников', ...average('damaged'), format: 'decimal' }),
      statisticMetric('stunned', { icon: 'stun', label: 'Оглушено противников', ...average('stunned'), format: 'decimal' }),
      statisticMetric('stunDuration', { icon: 'stun-duration', label: 'Время оглушения', ...average('stunDuration'), format: 'time' }),
    ],
  },
  {
    title: 'Сетап', entries: [
      statisticMetric('higherTierEnemies', { icon: 'tank-upper', label: 'Противники выше уровнем', ...average('higherTierEnemies'), format: 'decimal' }),
      statisticMetric('sameTierEnemies', { icon: 'tank-equal', label: 'Противники того же уровня', ...average('sameTierEnemies'), format: 'decimal' }),
      statisticMetric('lowerTierEnemies', { icon: 'tank-lower', label: 'Противники ниже уровнем', ...average('lowerTierEnemies'), format: 'decimal' }),
    ],
  },
  {
    title: 'Стрельба', entries: [
      statisticMetric('shots', { icon: 'shots', label: 'Выстрелы', ...average('shots'), format: 'decimal' }),
      statisticMetric('directEnemyHits', { icon: 'hits', label: 'Прямые попадания', ...average('directEnemyHits'), format: 'decimal' }),
      statisticMetric('piercingEnemyHits', { icon: 'piercing', label: 'Пробития', ...average('piercingEnemyHits'), format: 'decimal' }),
      statisticMetric('explosionHits', { icon: 'explosion-hits', label: 'Попадания осколками', ...average('explosionHits'), format: 'decimal' }),
      statisticMetric('directHitsReceived', { icon: 'received-hits', label: 'Получено прямых попаданий', ...average('directHitsReceived'), format: 'decimal' }),
      statisticMetric('piercingsReceived', { icon: 'received-piercing', label: 'Получено пробитий', ...average('piercingsReceived'), format: 'decimal' }),
      statisticMetric('explosionHitsReceived', { icon: 'received-explosion-hits', label: 'Получено попаданий осколками', ...average('explosionHitsReceived'), format: 'decimal' }),
    ],
  },
  {
    title: 'Прочность', entries: [
      statisticMetric('maxHealth', { icon: 'hp', label: 'Начальная прочность', ...average('maxHealth') }),
      statisticMetric('health', { icon: 'hp', label: 'Оставшаяся прочность', ...average('health') }),
      statisticMetric('damageReceived', { icon: 'hp', label: 'Полученный урон', ...average('damageReceived') }),
      statisticMetric('damageReceivedFromInvisibles', { icon: 'hp', label: 'Урон от незасвеченных', ...average('damageReceivedFromInvisibles') }),
    ],
  },
  {
    title: 'Производные · время', color: derivedColor, entries: [
      statisticMetric('lifeTimeShare', {
        icon: 'lifetime', label: 'Доля времени жизни', headingLabel: '%', subtitle: 'Время жизни / длительность боя',
        ...ratio('lifeTime', 'duration', 100), format: 'percent',
      }),
      statisticMetric('shotsPerLifeMinute', {
        icon: 'shots', label: 'Выстрелы в минуту жизни', headingLabel: '/мин', subtitle: 'Выстрелы / минуты жизни',
        ...ratio('shots', 'lifeTime', 60), format: 'decimal',
      }),
      statisticMetric('damagePerLifeMinute', {
        icon: 'dmg', label: 'Урон в минуту жизни', headingLabel: '/мин', subtitle: 'Урон / минуты жизни',
        ...ratio('damageDealt', 'lifeTime', 60),
      }),
      statisticMetric('assistPerLifeMinute', {
        icon: 'assist', label: 'Содействие в минуту жизни', headingLabel: '/мин', subtitle: 'Содействие / минуты жизни',
        ...ratio('damageAssistedTotal', 'lifeTime', 60),
      }),
    ],
  },
  {
    title: 'Производные · стрельба', color: derivedColor, entries: [
      statisticMetric('directHitRate', {
        icon: 'hits', label: 'Доля прямых попаданий', headingLabel: '%', subtitle: 'Попадания / выстрелы',
        ...ratio('directEnemyHits', 'shots', 100), format: 'percent',
      }),
      statisticMetric('penetrationRate', {
        icon: 'piercing', label: 'Пробития среди попаданий', headingLabel: '%', subtitle: 'Пробития / попадания',
        ...ratio('piercingEnemyHits', 'directEnemyHits', 100), format: 'percent',
      }),
      statisticMetric('penetratingShotRate', {
        icon: 'piercing', label: 'Пробития на выстрел', headingLabel: '/В', subtitle: 'Пробития / выстрелы',
        ...ratio('piercingEnemyHits', 'shots', 100), format: 'percent',
      }),
      statisticMetric('receivedPenetrationRate', {
        icon: 'piercing', label: 'Доля входящих пробитий', headingLabel: 'Вх.%', subtitle: 'Пробития / попадания',
        ...ratio('piercingsReceived', 'directHitsReceived', 100), format: 'percent',
      }),
    ],
  },
  {
    title: 'Производные · урон и прочность', color: derivedColor, entries: [
      statisticMetric('damageExchangeRatio', {
        icon: 'dmg', label: 'Отношение урона', headingLabel: 'Н/П', subtitle: 'Нанесённый / полученный',
        ...ratio('damageDealt', 'damageReceived'), format: 'decimal',
      }),
      statisticMetric('damageToHealthRatio', {
        icon: 'dmg', label: 'Урон к собственной прочности', headingLabel: '/HP', subtitle: 'Урон / начальная прочность',
        ...ratio('damageDealt', 'maxHealth'), format: 'decimal',
      }),
      statisticMetric('blockedDamageShare', {
        icon: 'block', label: 'Доля заблокированного урона', headingLabel: '%', subtitle: 'Блок / (блок + полученный урон)',
        ...ratio('damageBlockedByArmor', ['damageBlockedByArmor', 'damageReceived'], 100), format: 'percent',
      }),
      statisticMetric('remainingHealthShare', {
        icon: 'hp', label: 'Оставшаяся прочность, %', headingLabel: '%', subtitle: 'Остаток / начальная прочность',
        ...ratio('health', 'maxHealth', 100), format: 'percent',
      }),
      statisticMetric('invisibleDamageShare', {
        icon: 'hp', label: 'Доля урона от незасвеченных', headingLabel: 'НЗ%', subtitle: 'От незасвеченных / весь урон',
        ...ratio('damageReceivedFromInvisibles', 'damageReceived', 100), format: 'percent',
      }),
      statisticMetric('assistShare', {
        icon: 'assist', label: 'Доля содействия', headingLabel: '%', subtitle: 'Содействие / (урон + содействие)',
        ...ratio('damageAssistedTotal', ['damageDealt', 'damageAssistedTotal'], 100), format: 'percent',
      }),
    ],
  },
  {
    title: 'Знаки классности', color: '#e4bf78', entries: [
      snapshotMetrics('mastery', {
        label: 'Знак классности', color: '#e4bf78', headingColor: '#ffc45c', icon: 'mastery-percent',
        tables: { history: 'MasteryInfo', latest: 'MasteryInfoLatest' },
        percentiles: [1, 5, 10, 25, 50, 75, 80, 90, 95, 99, 100],
        icons: { 50: 'mastery-3', 80: 'mastery-2', 95: 'mastery-1', 99: 'mastery-m' },
        presets: [
          { percentile: 50, label: 'III степень' },
          { percentile: 80, label: 'II степень' },
          { percentile: 95, label: 'I степень' },
          { percentile: 99, label: 'Мастер' },
        ],
        defaultPercentile: 100,
      })
    ],
  },
  {
    title: 'Отметки на стволах орудий', color: '#7dcec0', entries: [
      snapshotMetrics('marks', {
        label: 'Отметка', color: '#7dcec0', headingColor: '#52ddc6', icon: 'moe-percent',
        tables: { history: 'MoeInfo', latest: 'MoeInfoLatest' },
        percentiles: [0, 20, 40, 55, 65, 75, 85, 95, 100],
        icons: { 65: 'moe-1', 85: 'moe-2', 95: 'moe-3', 100: 'moe-4' },
        presets: [
          { percentile: 65, label: 'Первая' },
          { percentile: 85, label: 'Вторая' },
          { percentile: 95, label: 'Третья' },
        ],
        defaultPercentile: 100,
      })
    ],
  },
] as const satisfies readonly MetricCatalogSection[]

type EntryKeys<Entry> = Entry extends MetricCatalogEntry<infer Key> ? Key : never
export type Slot = EntryKeys<typeof metricCatalog[number]['entries'][number]>

export const availableSlots = Object.fromEntries(metricCatalog.flatMap(section =>
  section.entries.flatMap(entry => Object.entries(entry.metrics)))) as Record<Slot, MetricDefinition>

export const metricCategories: readonly MetricCategory<Slot>[] = metricCatalog.map(({ entries, ...section }) => ({
  ...section, tiles: entries.flatMap<MetricTileDefinition<Slot>>(entry => entry.tiles),
}))

const tilesByValue = new Map(metricCategories.flatMap(category =>
  category.tiles.flatMap(tile => tile.values.map(value => [value, tile] as const))))

export function metricTileFor(slot: Slot) {
  return tilesByValue.get(slot)!
}

export function slotHeadingLabel(slot: Slot) {
  return availableSlots[slot].headingLabel
}

const slotOrder = Object.keys(availableSlots) as Slot[]

export function orderSlots(slots: readonly Slot[]): Slot[] {
  const selected = new Set(slots)
  return slotOrder.filter(slot => selected.has(slot))
}

// Порядок приоритета: сначала обрезаем набор по лимиту, затем упорядочиваем столбцы для отображения.
const defaultSlotOrder = [
  'battles', 'playerCount', 'winrate', 'damage', 'blocked', 'assist', 'duration',
  'kills', 'xp', 'spotted', 'survival', 'shots', 'mileage', 'lifeTime', 'damageReceived', 'assistRadio', 'assistTrack',
  'piercingEnemyHits', 'directEnemyHits'
] as const satisfies readonly Slot[]

export const defaultSlots: Slot[] = [...defaultSlotOrder]

export function defaultSlotsForLimit(limit: number): Slot[] {
  return orderSlots(defaultSlots.slice(0, limit))
}
