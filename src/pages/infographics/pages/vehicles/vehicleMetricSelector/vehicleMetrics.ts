import type { IconType } from '@/shared/game/efficiencyIcon/utils'

export type SlotDefinition = {
  icon: IconType
  label: string
  description?: string
  formula?: string
  headingLabel?: string
  sql: string
  dailySql: string
  format?: 'integer' | 'decimal' | 'percent' | 'time' | 'distance'
}

const average = (column: string) => ({
  sql: `avgOrNull(stats.${column})`,
  dailySql: `sum(stats.${column}Sum) / nullIf(sum(stats.${column === 'stunDuration' ? 'stunDurationValueCount' : 'battles'}), 0)`,
})

// Основные показатели без дополнительных агрегаций.
export const baseSlots = {
  battles: { icon: 'battles', label: 'Бои', sql: 'count()', dailySql: 'sum(stats.battles)', description: 'Число участий на танке за выбранный период, не уникальных арен' },
  playerCount: { icon: 'player', label: 'Игроки', sql: 'uniqIf(stats.participantId, stats.participantId != 0)', dailySql: 'uniqIfMerge(stats.playersState)', description: 'Оценка числа уникальных игроков за выбранный период, без неизвестных аккаунтов' },
  winrate: { icon: 'winrate', label: 'Победы', sql: "countIf(stats.result = 'win') / nullIf(count(), 0) * 100", dailySql: 'sum(stats.wins) / nullIf(sum(stats.battles), 0) * 100', format: 'percent' },
  survival: { icon: 'hp', label: 'Выживаемость', sql: 'avgOrNull(stats.alive) * 100', dailySql: 'sum(stats.survived) / nullIf(sum(stats.battles), 0) * 100', format: 'percent' },

  damage: { icon: 'dmg', label: 'Средний урон', ...average('damageDealt') },

  assist: { icon: 'assist', label: 'Среднее содействие', ...average('damageAssistedTotal'), description: 'Суммарное содействие по разведданным, гусеницам и оглушению за бой' },
  assistRadio: { icon: 'assist-radio', label: 'Содействие по разведданным', ...average('damageAssistedRadio') },
  assistTrack: { icon: 'assist-track', label: 'Содействие по гусеницам', ...average('damageAssistedTrack') },
  assistStun: { icon: 'stun', label: 'Содействие по оглушению', ...average('damageAssistedStun') },
  assistMax: { icon: 'assist', label: 'Максимальный вид содействия', ...average('damageAssistedMax'), description: 'Среднее от максимума трёх видов содействия в каждом бою' },

  damageForMarks: { icon: 'gun-mark-dmg', label: 'Сумма для отметки', ...average('damageForMarks') },
  blocked: { icon: 'block', label: 'Заблокированный урон', ...average('damageBlockedByArmor') },
  damageReceived: { icon: 'hp', label: 'Полученный урон', ...average('damageReceived') },
  damageReceivedFromInvisibles: { icon: 'hp', label: 'Урон от незасвеченных', ...average('damageReceivedFromInvisibles') },

  xp: { icon: 'xp', label: 'Средний опыт', ...average('xp') },
  kills: { icon: 'kill', label: 'Средние уничтожения', ...average('kills'), format: 'decimal' },
  spotted: { icon: 'discover', label: 'Обнаружено противников', ...average('spotted'), format: 'decimal' },
  damaged: { icon: 'dmg', label: 'Повреждено противников', ...average('damaged'), format: 'decimal' },

  shots: { icon: 'shots', label: 'Выстрелы', ...average('shots'), format: 'decimal' },
  directEnemyHits: { icon: 'hits', label: 'Прямые попадания', ...average('directEnemyHits'), format: 'decimal' },
  piercingEnemyHits: { icon: 'piercing', label: 'Пробития', ...average('piercingEnemyHits'), format: 'decimal' },
  explosionHits: { icon: 'explosion-hits', label: 'Попадания осколками', ...average('explosionHits'), format: 'decimal' },

  directHitsReceived: { icon: 'received-hits', label: 'Получено прямых попаданий', ...average('directHitsReceived'), format: 'decimal' },
  piercingsReceived: { icon: 'received-piercing', label: 'Получено пробитий', ...average('piercingsReceived'), format: 'decimal' },
  explosionHitsReceived: { icon: 'received-explosion-hits', label: 'Получено попаданий осколками', ...average('explosionHitsReceived'), format: 'decimal' },

  stunned: { icon: 'stun', label: 'Оглушено противников', ...average('stunned'), format: 'decimal' },
  stunDuration: { icon: 'stun-duration', label: 'Время оглушения', ...average('stunDuration'), format: 'time' },

  lifeTime: { icon: 'lifetime', label: 'Время жизни', ...average('lifeTime'), format: 'time' },
  duration: { icon: 'duration', label: 'Длительность боя', ...average('duration'), format: 'time' },
  mileage: { icon: 'distance', label: 'Пройденная дистанция', ...average('mileage'), format: 'distance' },

  maxHealth: { icon: 'hp', label: 'Начальная прочность', ...average('maxHealth') },
  health: { icon: 'hp', label: 'Оставшаяся прочность', ...average('health') },

  higherTierEnemies: { icon: 'tank-upper', label: 'Противники выше уровнем', ...average('higherTierEnemies'), format: 'decimal' },
  sameTierEnemies: { icon: 'tank-equal', label: 'Противники того же уровня', ...average('sameTierEnemies'), format: 'decimal' },
  lowerTierEnemies: { icon: 'tank-lower', label: 'Противники ниже уровнем', ...average('lowerTierEnemies'), format: 'decimal' },
} as const satisfies Record<string, SlotDefinition>

export type PrimarySlot = keyof typeof baseSlots

function ratio(numerator: string | string[], denominator: string | string[], multiplier = 1) {
  const sum = (columns: string | string[], suffix: string) =>
    (Array.isArray(columns) ? columns : [columns]).map(column => `sum(stats.${column}${suffix})`).join(' + ')
  const expression = (suffix: string) =>
    `${sum(numerator, suffix)} / nullIf(${sum(denominator, suffix)}, 0)${multiplier === 1 ? '' : ` * ${multiplier}`}`
  return { sql: expression(''), dailySql: expression('Sum') }
}

// Отношения общих сумм за выбранный период, а не средние отношения по отдельным боям.
// Дополнительные агрегации ниже считаются по индивидуальным значениям из PlayerBattleResults.
export const derivedSlots = {
  lifeTimeShare: {
    icon: 'lifetime', label: 'Доля времени жизни', headingLabel: '%', formula: 'Время жизни / длительность боя',
    ...ratio('lifeTime', 'duration', 100), format: 'percent',
  },
  shotsPerLifeMinute: {
    icon: 'shots', label: 'Выстрелы в минуту жизни', headingLabel: '/мин', formula: 'Выстрелы / минуты жизни',
    ...ratio('shots', 'lifeTime', 60), format: 'decimal',
  },
  damagePerLifeMinute: {
    icon: 'dmg', label: 'Урон в минуту жизни', headingLabel: '/мин', formula: 'Урон / минуты жизни',
    ...ratio('damageDealt', 'lifeTime', 60),
  },
  assistPerLifeMinute: {
    icon: 'assist', label: 'Содействие в минуту жизни', headingLabel: '/мин', formula: 'Содействие / минуты жизни',
    ...ratio('damageAssistedTotal', 'lifeTime', 60),
  },
  directHitRate: {
    icon: 'hits', label: 'Доля прямых попаданий', headingLabel: '%', formula: 'Попадания / выстрелы',
    ...ratio('directEnemyHits', 'shots', 100), format: 'percent',
  },
  penetrationRate: {
    icon: 'piercing', label: 'Пробития среди попаданий', headingLabel: '%', formula: 'Пробития / попадания',
    ...ratio('piercingEnemyHits', 'directEnemyHits', 100), format: 'percent',
  },
  penetratingShotRate: {
    icon: 'piercing', label: 'Пробития на выстрел', headingLabel: '/В', formula: 'Пробития / выстрелы',
    ...ratio('piercingEnemyHits', 'shots', 100), format: 'percent',
  },
  receivedPenetrationRate: {
    icon: 'piercing', label: 'Доля входящих пробитий', headingLabel: 'Вх.%', formula: 'Пробития / попадания',
    description: 'Полученные пробития / полученные прямые попадания × 100%. Попадания осколками не учитываются.',
    ...ratio('piercingsReceived', 'directHitsReceived', 100), format: 'percent',
  },
  damageExchangeRatio: {
    icon: 'dmg', label: 'Отношение урона', headingLabel: 'Н/П', formula: 'Нанесённый / полученный',
    ...ratio('damageDealt', 'damageReceived'), format: 'decimal',
  },
  damageToHealthRatio: {
    icon: 'dmg', label: 'Урон к собственной прочности', headingLabel: '/HP', formula: 'Урон / начальная прочность',
    description: 'Сколько собственных запасов прочности танк снимает с противников: суммарный урон / суммарная начальная прочность.',
    ...ratio('damageDealt', 'maxHealth'), format: 'decimal',
  },
  blockedDamageShare: {
    icon: 'block', label: 'Доля заблокированного урона', headingLabel: '%', formula: 'Блок / (блок + полученный урон)',
    description: 'Заблокированный урон / (заблокированный + полученный урон) × 100%. Доля учтённого урона, не вероятность непробития.',
    ...ratio('damageBlockedByArmor', ['damageBlockedByArmor', 'damageReceived'], 100), format: 'percent',
  },
  remainingHealthShare: {
    icon: 'hp', label: 'Оставшаяся прочность, %', headingLabel: '%', formula: 'Остаток / начальная прочность',
    description: 'Суммарная оставшаяся прочность / суммарная начальная прочность × 100%. Уничтоженные танки учитываются с нулевой оставшейся прочностью.',
    ...ratio('health', 'maxHealth', 100), format: 'percent',
  },
  invisibleDamageShare: {
    icon: 'hp', label: 'Доля урона от незасвеченных', headingLabel: 'НЗ%', formula: 'От незасвеченных / весь урон',
    ...ratio('damageReceivedFromInvisibles', 'damageReceived', 100), format: 'percent',
  },
  assistShare: {
    icon: 'assist', label: 'Доля содействия', headingLabel: '%', formula: 'Содействие / (урон + содействие)',
    ...ratio('damageAssistedTotal', ['damageDealt', 'damageAssistedTotal'], 100), format: 'percent',
  },
} as const satisfies Record<string, SlotDefinition>

export type DerivedSlot = keyof typeof derivedSlots
export type BaseSlot = PrimarySlot | DerivedSlot

export const aggregations = {
  min: { label: 'Минимум', shortLabel: 'Мин.' },
  max: { label: 'Максимум', shortLabel: 'Макс.' },
  q01: { label: 'Квантиль 1%', shortLabel: 'Q1' },
  q05: { label: 'Квантиль 5%', shortLabel: 'Q5' },
  q10: { label: 'Квантиль 10%', shortLabel: 'Q10' },
  q25: { label: 'Квантиль 25%', shortLabel: 'Q25' },
  q50: { label: 'Медиана (50%)', shortLabel: 'Мед.' },
  q75: { label: 'Квантиль 75%', shortLabel: 'Q75' },
  q90: { label: 'Квантиль 90%', shortLabel: 'Q90' },
  q95: { label: 'Квантиль 95%', shortLabel: 'Q95' },
  q99: { label: 'Квантиль 99%', shortLabel: 'Q99' },
  zero: { label: 'Доля нулевых значений', shortLabel: '0%' },
} as const

type Aggregation = keyof typeof aggregations
const aggregationOrder = Object.keys(aggregations) as Aggregation[]
const quantileLevels = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]

// Имена исходных колонок совпадают с префиксами агрегатов в дневных витринах.
const aggregationSources = {
  damage: 'damageDealt',
  assist: 'damageAssistedTotal',
  assistRadio: 'damageAssistedRadio',
  assistTrack: 'damageAssistedTrack',
  assistStun: 'damageAssistedStun',
  assistMax: 'damageAssistedMax',
  damageForMarks: 'damageForMarks',
  blocked: 'damageBlockedByArmor',
  damageReceived: 'damageReceived',
  damageReceivedFromInvisibles: 'damageReceivedFromInvisibles',
  xp: 'xp',
  kills: 'kills',
  spotted: 'spotted',
  damaged: 'damaged',
  shots: 'shots',
  directEnemyHits: 'directEnemyHits',
  piercingEnemyHits: 'piercingEnemyHits',
  explosionHits: 'explosionHits',
  directHitsReceived: 'directHitsReceived',
  piercingsReceived: 'piercingsReceived',
  explosionHitsReceived: 'explosionHitsReceived',
  stunned: 'stunned',
  stunDuration: 'stunDuration',
  lifeTime: 'lifeTime',
  duration: 'duration',
  mileage: 'mileage',
  maxHealth: 'maxHealth',
  health: 'health',
  higherTierEnemies: 'higherTierEnemies',
  sameTierEnemies: 'sameTierEnemies',
  lowerTierEnemies: 'lowerTierEnemies',
  lifeTimeShare: 'lifeTimeShare',
  shotsPerLifeMinute: 'shotsPerLifeMinute',
  damagePerLifeMinute: 'damagePerLifeMinute',
  assistPerLifeMinute: 'assistPerLifeMinute',
  directHitRate: 'directHitRate',
  penetrationRate: 'penetrationRate',
  penetratingShotRate: 'penetratingShotRate',
  receivedPenetrationRate: 'receivedPenetrationRate',
  damageExchangeRatio: 'damageExchangeRatio',
  damageToHealthRatio: 'damageToHealthRatio',
  blockedDamageShare: 'blockedDamageShare',
  remainingHealthShare: 'remainingHealthShare',
  invisibleDamageShare: 'invisibleDamageShare',
  assistShare: 'assistShare',
} as const satisfies Partial<Record<BaseSlot, string>>

export type AggregatableSlot = keyof typeof aggregationSources
export type AggregatedSlot = `${AggregatableSlot}_${Aggregation}`
export type Slot = BaseSlot | AggregatedSlot

// Переопределения агрегации, которая включается нажатием на название показателя.
// Без переопределения используется базовый слот (обычно среднее).
const defaultAggregations: Partial<Record<BaseSlot, Slot>> = {}

export function defaultSlot(slot: BaseSlot): Slot {
  return defaultAggregations[slot] ?? slot
}

function aggregationSql(slot: AggregatableSlot, aggregation: Aggregation, daily = false) {
  const column = `stats.${aggregationSources[slot]}`
  const count = daily
    ? `sum(stats.${slot in derivedSlots || slot === 'stunDuration' ? `${aggregationSources[slot]}ValueCount` : 'battles'})`
    : `count(${column})`
  switch (aggregation) {
    case 'min': return `minOrNull(${column}${daily ? 'Min' : ''})`
    case 'max': return `maxOrNull(${column}${daily ? 'Max' : ''})`
    case 'zero': return `${daily ? `sum(${column}ZeroCount)` : `countIf(${column} = 0)`} / nullIf(${count}, 0) * 100`
    default: {
      const index = quantileLevels.indexOf(Number(aggregation.slice(1)) / 100) + 1
      return `if(${count} = 0, NULL, quantilesTDigest${daily ? 'Merge' : ''}(${quantileLevels.join(', ')})(${column}${daily ? 'QuantilesState' : ''})[${index}])`
    }
  }
}

export function baseSlot(slot: Slot): BaseSlot {
  return slot.split('_')[0] as BaseSlot
}

export function metricQuerySlots(slot: Slot): Slot[] {
  const base = baseSlot(slot)
  if (!isAggregatableSlot(base)) return [slot]
  return [base, ...aggregationOrder.map(aggregation => `${base}_${aggregation}` as AggregatedSlot)]
}

export function metricLabel(slot: Slot) {
  const label = availableSlots[baseSlot(slot)].label.replace(/^Средн(?:ий|ее|ие) /, '')
  return label[0].toUpperCase() + label.slice(1)
}

export function slotAggregationLabel(slot: Slot) {
  const aggregation = slot.split('_')[1] as Aggregation | undefined
  return aggregation ? aggregations[aggregation].shortLabel : ''
}

export function slotHeadingLabel(slot: Slot) {
  return availableSlots[slot].headingLabel ?? slotAggregationLabel(slot)
}

export function isAggregatableSlot(slot: BaseSlot): slot is AggregatableSlot {
  return slot in aggregationSources
}

export const availableSlots: Record<Slot, SlotDefinition> = { ...baseSlots, ...derivedSlots } as Record<Slot, SlotDefinition>
for (const slot of Object.keys(aggregationSources) as AggregatableSlot[]) {
  for (const aggregation of aggregationOrder) {
    const definition: SlotDefinition = availableSlots[slot]
    availableSlots[`${slot}_${aggregation}` as AggregatedSlot] = {
      ...definition,
      label: `${metricLabel(slot)} · ${aggregations[aggregation].label}`,
      description: slot in derivedSlots
        ? `${metricLabel(slot)} для отдельного участия в бою. Агрегация: ${aggregations[aggregation].label}. Значения с нулевым знаменателем исключены.`
        : `${definition.description ?? metricLabel(slot)}. Агрегация: ${aggregations[aggregation].label}`,
      headingLabel: undefined,
      sql: aggregationSql(slot, aggregation),
      dailySql: aggregationSql(slot, aggregation, true),
      format: aggregation === 'zero' ? 'percent' : definition.format,
    }
  }
}

export const slotCategories: readonly { title: string, slots: readonly BaseSlot[], derived?: boolean }[] = [
  { title: 'Общее', slots: ['battles', 'playerCount', 'winrate', 'survival', 'xp', 'mileage', 'lifeTime', 'duration'] },
  { title: 'Основные', slots: ['damage', 'blocked', 'assist', 'kills', 'spotted'] },
  { title: 'Содействие', slots: ['assistRadio', 'assistTrack', 'assistStun', 'assistMax', 'damageForMarks', 'damaged', 'stunned', 'stunDuration'] },
  { title: 'Сетап', slots: ['higherTierEnemies', 'sameTierEnemies', 'lowerTierEnemies'] },
  { title: 'Стрельба', slots: ['shots', 'directEnemyHits', 'piercingEnemyHits', 'explosionHits', 'directHitsReceived', 'piercingsReceived', 'explosionHitsReceived'] },
  { title: 'Прочность', slots: ['maxHealth', 'health', 'damageReceived', 'damageReceivedFromInvisibles'] },

  { title: 'Производные · время', derived: true, slots: ['lifeTimeShare', 'shotsPerLifeMinute', 'damagePerLifeMinute', 'assistPerLifeMinute'] },
  { title: 'Производные · стрельба', derived: true, slots: ['directHitRate', 'penetrationRate', 'penetratingShotRate', 'receivedPenetrationRate'] },
  { title: 'Производные · урон и прочность', derived: true, slots: ['damageExchangeRatio', 'damageToHealthRatio', 'blockedDamageShare', 'remainingHealthShare', 'invisibleDamageShare', 'assistShare'] },
]

const slotOrder: BaseSlot[] = slotCategories.flatMap(category => [...category.slots])

export function orderSlots(slots: readonly Slot[]): Slot[] {
  const selected = new Set(slots)
  return slotOrder.flatMap(base => {
    const options: Slot[] = isAggregatableSlot(base)
      ? [base, ...aggregationOrder.map(aggregation => `${base}_${aggregation}` as AggregatedSlot)]
      : [base]
    return options.filter(slot => selected.has(slot))
  })
}

// Порядок приоритета: сначала обрезаем набор по лимиту, затем упорядочиваем столбцы для отображения.
const defaultSlotOrder = [
  'battles', 'playerCount', 'winrate', 'damage', 'blocked', 'assist', 'duration',
  'kills', 'xp', 'spotted', 'survival', 'shots', 'mileage', 'lifeTime', 'damageReceived', 'assistRadio', 'assistTrack',
  'piercingEnemyHits', 'directEnemyHits'
] as const satisfies readonly BaseSlot[]

export const defaultSlots: Slot[] = defaultSlotOrder.map(defaultSlot)

export function defaultSlotsForLimit(limit: number): Slot[] {
  return orderSlots(defaultSlots.slice(0, limit))
}
