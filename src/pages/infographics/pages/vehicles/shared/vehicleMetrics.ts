import type { IconType } from '@/shared/game/efficiencyIcon/utils'

export type SlotDefinition = {
  icon: IconType
  label: string
  description?: string
  formula?: string
  headingLabel?: string
  sql: string
  format?: 'integer' | 'decimal' | 'percent' | 'time' | 'distance'
}

const average = (column: string) => `sum(${column}) / nullIf(sum(participations), 0)`

// Все базовые показатели загружаются вместе, независимо от выбранных столбцов.
export const baseSlots = {
  battles: { icon: 'battles', label: 'Бои', sql: 'sum(participations)', description: 'Число участий на танке за выбранный период, не уникальных арен' },
  playerCount: { icon: 'player', label: 'Игроки', sql: 'uniqIfMerge(players)', description: 'Оценка числа уникальных игроков за выбранный период, без неизвестных аккаунтов' },
  winrate: { icon: 'winrate', label: 'Победы', sql: "sumIf(participations, result = 'win') / nullIf(sum(participations), 0) * 100", format: 'percent' },
  survival: { icon: 'hp', label: 'Выживаемость', sql: `${average('aliveCount')} * 100`, format: 'percent' },

  damage: { icon: 'dmg', label: 'Средний урон', sql: average('damageDealtSum') },

  assist: { icon: 'assist', label: 'Среднее содействие', sql: average('damageAssistedTotalSum'), description: 'Суммарное содействие по разведданным, гусеницам и оглушению за бой' },
  assistRadio: { icon: 'assist-radio', label: 'Содействие по разведданным', sql: average('damageAssistedRadioSum') },
  assistTrack: { icon: 'assist-track', label: 'Содействие по гусеницам', sql: average('damageAssistedTrackSum') },
  assistStun: { icon: 'stun', label: 'Содействие по оглушению', sql: average('damageAssistedStunSum') },
  assistMax: { icon: 'assist', label: 'Максимальный вид содействия', sql: average('damageAssistedMaxSum'), description: 'Среднее от максимума трёх видов содействия в каждом бою' },

  damageForMarks: { icon: 'gun-mark-dmg', label: 'Урон для отметки', sql: average('damageForMarksSum') },
  blocked: { icon: 'block', label: 'Заблокированный урон', sql: average('damageBlockedByArmorSum') },
  damageReceived: { icon: 'hp', label: 'Полученный урон', sql: average('damageReceivedSum') },
  damageReceivedFromInvisibles: { icon: 'hp', label: 'Урон от незасвеченных', sql: average('damageReceivedFromInvisiblesSum') },

  xp: { icon: 'xp', label: 'Средний опыт', sql: average('xpSum') },
  kills: { icon: 'kill', label: 'Средние уничтожения', sql: average('killsSum'), format: 'decimal' },
  spotted: { icon: 'discover', label: 'Обнаружено противников', sql: average('spottedSum'), format: 'decimal' },
  damaged: { icon: 'dmg', label: 'Повреждено противников', sql: average('damagedSum'), format: 'decimal' },

  shots: { icon: 'shots', label: 'Выстрелы', sql: average('shotsSum'), format: 'decimal' },
  directEnemyHits: { icon: 'hits', label: 'Прямые попадания', sql: average('directEnemyHitsSum'), format: 'decimal' },
  piercingEnemyHits: { icon: 'piercing', label: 'Пробития', sql: average('piercingEnemyHitsSum'), format: 'decimal' },
  explosionHits: { icon: 'hits', label: 'Попадания осколками', sql: average('explosionHitsSum'), format: 'decimal' },

  directHitsReceived: { icon: 'hits', label: 'Получено прямых попаданий', sql: average('directHitsReceivedSum'), format: 'decimal' },
  piercingsReceived: { icon: 'piercing', label: 'Получено пробитий', sql: average('piercingsReceivedSum'), format: 'decimal' },
  explosionHitsReceived: { icon: 'hits', label: 'Получено попаданий осколками', sql: average('explosionHitsReceivedSum'), format: 'decimal' },

  stunned: { icon: 'stun', label: 'Оглушено противников', sql: average('stunnedSum'), format: 'decimal' },
  stunDuration: { icon: 'stun', label: 'Время оглушения', sql: 'sum(stunDurationSum) / nullIf(sum(stunDurationCount), 0)', format: 'time' },

  lifeTime: { icon: 'lifetime', label: 'Время жизни', sql: average('lifeTimeSum'), format: 'time' },
  duration: { icon: 'duration', label: 'Длительность боя', sql: average('durationSum'), format: 'time' },
  mileage: { icon: 'distance', label: 'Пройденная дистанция', sql: average('mileageSum'), format: 'distance' },

  maxHealth: { icon: 'hp', label: 'Начальная прочность', sql: average('maxHealthSum') },
  health: { icon: 'hp', label: 'Оставшаяся прочность', sql: average('healthSum') },

  higherTierEnemies: { icon: 'tank', label: 'Противники выше уровнем', sql: average('higherTierEnemiesSum'), format: 'decimal' },
  sameTierEnemies: { icon: 'tank', label: 'Противники того же уровня', sql: average('sameTierEnemiesSum'), format: 'decimal' },
  lowerTierEnemies: { icon: 'tank', label: 'Противники ниже уровнем', sql: average('lowerTierEnemiesSum'), format: 'decimal' },
} as const satisfies Record<string, SlotDefinition>

export type PrimarySlot = keyof typeof baseSlots

const ratio = (numerator: string, denominator: string, multiplier = 1) =>
  `${numerator} / nullIf(${denominator}, 0)${multiplier === 1 ? '' : ` * ${multiplier}`}`

// Отношения общих сумм за выбранный период, а не средние отношения по отдельным боям.
// Распределения производных показателей в агрегатах не хранятся, поэтому модификаторов нет.
export const derivedSlots = {
  lifeTimeShare: {
    icon: 'lifetime', label: 'Доля времени жизни', headingLabel: '%', formula: 'Время жизни / длительность боя',
    sql: ratio('sum(lifeTimeSum)', 'sum(durationSum)', 100), format: 'percent',
  },
  shotsPerLifeMinute: {
    icon: 'shots', label: 'Выстрелы в минуту жизни', headingLabel: '/мин', formula: 'Выстрелы / минуты жизни',
    sql: ratio('sum(shotsSum)', 'sum(lifeTimeSum)', 60), format: 'decimal',
  },
  damagePerLifeMinute: {
    icon: 'dmg', label: 'Урон в минуту жизни', headingLabel: '/мин', formula: 'Урон / минуты жизни',
    sql: ratio('sum(damageDealtSum)', 'sum(lifeTimeSum)', 60),
  },
  assistPerLifeMinute: {
    icon: 'assist', label: 'Содействие в минуту жизни', headingLabel: '/мин', formula: 'Содействие / минуты жизни',
    sql: ratio('sum(damageAssistedTotalSum)', 'sum(lifeTimeSum)', 60),
  },
  directHitRate: {
    icon: 'hits', label: 'Доля прямых попаданий', headingLabel: '%', formula: 'Попадания / выстрелы',
    sql: ratio('sum(directEnemyHitsSum)', 'sum(shotsSum)', 100), format: 'percent',
  },
  penetrationRate: {
    icon: 'piercing', label: 'Пробития среди попаданий', headingLabel: '%', formula: 'Пробития / попадания',
    sql: ratio('sum(piercingEnemyHitsSum)', 'sum(directEnemyHitsSum)', 100), format: 'percent',
  },
  penetratingShotRate: {
    icon: 'piercing', label: 'Пробития на выстрел', headingLabel: '/В', formula: 'Пробития / выстрелы',
    sql: ratio('sum(piercingEnemyHitsSum)', 'sum(shotsSum)', 100), format: 'percent',
  },
  receivedPenetrationRate: {
    icon: 'piercing', label: 'Доля входящих пробитий', headingLabel: 'Вх.%', formula: 'Пробития / попадания',
    description: 'Полученные пробития / полученные прямые попадания × 100%. Попадания осколками не учитываются.',
    sql: ratio('sum(piercingsReceivedSum)', 'sum(directHitsReceivedSum)', 100), format: 'percent',
  },
  damageExchangeRatio: {
    icon: 'dmg', label: 'Отношение урона', headingLabel: 'Н/П', formula: 'Нанесённый / полученный',
    sql: ratio('sum(damageDealtSum)', 'sum(damageReceivedSum)'), format: 'decimal',
  },
  damageToHealthRatio: {
    icon: 'dmg', label: 'Урон к собственной прочности', headingLabel: '/HP', formula: 'Урон / начальная прочность',
    description: 'Сколько собственных запасов прочности танк снимает с противников: суммарный урон / суммарная начальная прочность.',
    sql: ratio('sum(damageDealtSum)', 'sum(maxHealthSum)'), format: 'decimal',
  },
  blockedDamageShare: {
    icon: 'block', label: 'Доля заблокированного урона', headingLabel: '%', formula: 'Блок / (блок + полученный урон)',
    description: 'Заблокированный урон / (заблокированный + полученный урон) × 100%. Доля учтённого урона, не вероятность непробития.',
    sql: ratio('sum(damageBlockedByArmorSum)', 'sum(damageBlockedByArmorSum) + sum(damageReceivedSum)', 100), format: 'percent',
  },
  remainingHealthShare: {
    icon: 'hp', label: 'Оставшаяся прочность, %', headingLabel: '%', formula: 'Остаток / начальная прочность',
    description: 'Суммарная оставшаяся прочность / суммарная начальная прочность × 100%. Уничтоженные танки учитываются с нулевой оставшейся прочностью.',
    sql: ratio('sum(healthSum)', 'sum(maxHealthSum)', 100), format: 'percent',
  },
  invisibleDamageShare: {
    icon: 'hp', label: 'Доля урона от незасвеченных', headingLabel: 'НЗ%', formula: 'От незасвеченных / весь урон',
    sql: ratio('sum(damageReceivedFromInvisiblesSum)', 'sum(damageReceivedSum)', 100), format: 'percent',
  },
  assistShare: {
    icon: 'assist', label: 'Доля содействия', headingLabel: '%', formula: 'Содействие / (урон + содействие)',
    sql: ratio('sum(damageAssistedTotalSum)', 'sum(damageDealtSum) + sum(damageAssistedTotalSum)', 100), format: 'percent',
  },
} as const satisfies Record<string, SlotDefinition>

export type DerivedSlot = keyof typeof derivedSlots
export type BaseSlot = PrimarySlot | DerivedSlot

export const aggregations = {
  sum: { label: 'Сумма', shortLabel: 'Σ' },
  min: { label: 'Минимум', shortLabel: 'Мин.' },
  max: { label: 'Максимум', shortLabel: 'Макс.' },
  q10: { label: 'Квантиль 10%', shortLabel: 'Q10' },
  q25: { label: 'Квантиль 25%', shortLabel: 'Q25' },
  q50: { label: 'Медиана (50%)', shortLabel: 'Мед.' },
  q75: { label: 'Квантиль 75%', shortLabel: 'Q75' },
  q90: { label: 'Квантиль 90%', shortLabel: 'Q90' },
  q95: { label: 'Квантиль 95%', shortLabel: 'Q95' },
  q99: { label: 'Квантиль 99%', shortLabel: 'Q99' },
  variance: { label: 'Дисперсия', shortLabel: 'Дисп.' },
  deviation: { label: 'Стандартное отклонение', shortLabel: 'σ' },
  zero: { label: 'Доля нулевых значений', shortLabel: '0%' },
} as const

type Aggregation = keyof typeof aggregations
const sumAggregations = ['sum'] as const
const rangeAggregations = ['sum', 'min', 'max', 'zero'] as const
const distributionAggregations = ['sum', 'min', 'max', 'q10', 'q25', 'q50', 'q75', 'q90', 'q95', 'q99', 'variance', 'deviation', 'zero'] as const
const quantileLevels = [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]

// Возможности совпадают у VehiclesStatistics и VehiclesStatisticsByBattleMode.
const aggregationSources = {
  damage: { column: 'damageDealt', aggregations: distributionAggregations },
  assist: { column: 'damageAssistedTotal', aggregations: distributionAggregations },
  assistRadio: { column: 'damageAssistedRadio', aggregations: distributionAggregations },
  assistTrack: { column: 'damageAssistedTrack', aggregations: distributionAggregations },
  assistStun: { column: 'damageAssistedStun', aggregations: distributionAggregations },
  assistMax: { column: 'damageAssistedMax', aggregations: distributionAggregations },
  damageForMarks: { column: 'damageForMarks', aggregations: distributionAggregations },
  blocked: { column: 'damageBlockedByArmor', aggregations: distributionAggregations },
  damageReceived: { column: 'damageReceived', aggregations: distributionAggregations },
  damageReceivedFromInvisibles: { column: 'damageReceivedFromInvisibles', aggregations: distributionAggregations },
  xp: { column: 'xp', aggregations: distributionAggregations },
  kills: { column: 'kills', aggregations: rangeAggregations },
  spotted: { column: 'spotted', aggregations: rangeAggregations },
  damaged: { column: 'damaged', aggregations: rangeAggregations },
  shots: { column: 'shots', aggregations: rangeAggregations },
  directEnemyHits: { column: 'directEnemyHits', aggregations: rangeAggregations },
  piercingEnemyHits: { column: 'piercingEnemyHits', aggregations: rangeAggregations },
  explosionHits: { column: 'explosionHits', aggregations: rangeAggregations },
  directHitsReceived: { column: 'directHitsReceived', aggregations: rangeAggregations },
  piercingsReceived: { column: 'piercingsReceived', aggregations: rangeAggregations },
  explosionHitsReceived: { column: 'explosionHitsReceived', aggregations: rangeAggregations },
  stunned: { column: 'stunned', aggregations: rangeAggregations },
  stunDuration: { column: 'stunDuration', aggregations: distributionAggregations },
  lifeTime: { column: 'lifeTime', aggregations: distributionAggregations },
  duration: { column: 'duration', aggregations: distributionAggregations },
  mileage: { column: 'mileage', aggregations: distributionAggregations },
  maxHealth: { column: 'maxHealth', aggregations: rangeAggregations },
  health: { column: 'health', aggregations: rangeAggregations },
  higherTierEnemies: { column: 'higherTierEnemies', aggregations: sumAggregations },
  sameTierEnemies: { column: 'sameTierEnemies', aggregations: sumAggregations },
  lowerTierEnemies: { column: 'lowerTierEnemies', aggregations: sumAggregations },
} as const satisfies Partial<Record<PrimarySlot, { column: string, aggregations: readonly Aggregation[] }>>

type AggregatableSlot = keyof typeof aggregationSources
export type AggregatedSlot = {
  [K in AggregatableSlot]: `${K}_${typeof aggregationSources[K]['aggregations'][number]}`
}[AggregatableSlot]
export type Slot = BaseSlot | AggregatedSlot

// Переопределения агрегации, которая включается нажатием на название показателя.
// Без переопределения используется базовый слот (обычно среднее).
const defaultAggregations: Partial<Record<BaseSlot, Slot>> = {}

export function defaultSlot(slot: BaseSlot): Slot {
  return defaultAggregations[slot] ?? slot
}

function aggregationSql(slot: AggregatableSlot, aggregation: Aggregation) {
  const { column } = aggregationSources[slot]
  const count = slot === 'stunDuration' ? 'stunDurationCount' : 'participations'
  switch (aggregation) {
    case 'sum': return `sum(${column}Sum)`
    case 'min': return `min(${column}Min)`
    case 'max': return `max(${column}Max)`
    case 'variance': return `varPopStableMerge(${column}Variance)`
    case 'deviation': return `sqrt(varPopStableMerge(${column}Variance))`
    case 'zero': return `sum(${column}ZeroCount) / nullIf(sum(${count}), 0) * 100`
    default: {
      const index = quantileLevels.indexOf(Number(aggregation.slice(1)) / 100) + 1
      return `quantilesTDigestMerge(${quantileLevels.join(', ')})(${column}Quantiles)[${index}]`
    }
  }
}

export function baseSlot(slot: Slot): BaseSlot {
  return slot.split('_')[0] as BaseSlot
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

export function slotAggregationOptions(slot: BaseSlot) {
  if (!(slot in aggregationSources)) return []
  const source = aggregationSources[slot as AggregatableSlot]
  return [
    { slot: slot as Slot, label: 'Среднее' },
    ...source.aggregations.map(aggregation => ({ slot: `${slot}_${aggregation}` as Slot, label: aggregations[aggregation].label })),
  ]
}

export const availableSlots: Record<Slot, SlotDefinition> = { ...baseSlots, ...derivedSlots } as Record<Slot, SlotDefinition>
for (const slot of Object.keys(aggregationSources) as AggregatableSlot[]) {
  for (const aggregation of aggregationSources[slot].aggregations) {
    const definition: SlotDefinition = baseSlots[slot]
    availableSlots[`${slot}_${aggregation}` as AggregatedSlot] = {
      ...definition,
      label: `${metricLabel(slot)} · ${aggregations[aggregation].label}`,
      description: `${definition.description ?? metricLabel(slot)}. Агрегация: ${aggregations[aggregation].label}`,
      sql: aggregationSql(slot, aggregation),
      format: aggregation === 'zero' ? 'percent' : aggregation === 'variance' ? 'decimal' : definition.format,
    }
  }
}

export const slotCategories: readonly { title: string, slots: readonly BaseSlot[], derived?: boolean }[] = [
  { title: 'Общее', slots: ['battles', 'playerCount', 'winrate', 'survival', 'xp', 'lifeTime', 'duration', 'mileage'] },
  { title: 'Урон и прочность', slots: ['damage', 'damageForMarks', 'blocked', 'damageReceived', 'damageReceivedFromInvisibles', 'maxHealth', 'health'] },
  { title: 'Содействие', slots: ['assist', 'assistRadio', 'assistTrack', 'assistStun', 'assistMax'] },
  { title: 'Стрельба', slots: ['shots', 'directEnemyHits', 'piercingEnemyHits', 'explosionHits', 'directHitsReceived', 'piercingsReceived', 'explosionHitsReceived'] },
  { title: 'В бою', slots: ['kills', 'spotted', 'damaged', 'stunned', 'stunDuration', 'higherTierEnemies', 'sameTierEnemies', 'lowerTierEnemies'] },
  { title: 'Производные · время', derived: true, slots: ['lifeTimeShare', 'shotsPerLifeMinute', 'damagePerLifeMinute', 'assistPerLifeMinute'] },
  { title: 'Производные · стрельба', derived: true, slots: ['directHitRate', 'penetrationRate', 'penetratingShotRate', 'receivedPenetrationRate'] },
  { title: 'Производные · урон и прочность', derived: true, slots: ['damageExchangeRatio', 'damageToHealthRatio', 'blockedDamageShare', 'remainingHealthShare', 'invisibleDamageShare', 'assistShare'] },
]

const slotOrder: BaseSlot[] = slotCategories.flatMap(category => [...category.slots])

export function orderSlots(slots: readonly Slot[]): Slot[] {
  const selected = new Set(slots)
  return slotOrder.flatMap(base => {
    const options = slotAggregationOptions(base)
    return (options.length ? options.map(option => option.slot) : [base]).filter(slot => selected.has(slot))
  })
}

// Порядок приоритета: сначала обрезаем набор по лимиту, затем упорядочиваем столбцы для отображения.
const defaultSlotOrder = [
  'battles', 'playerCount', 'winrate', 'damage', 'assist', 'kills', 'duration',
  'survival', 'xp', 'blocked', 'damageForMarks', 'spotted', 'shots', 'damageReceived',
  'assistRadio', 'assistTrack', 'piercingEnemyHits', 'directEnemyHits', 'lifeTime', 'mileage',
] as const satisfies readonly BaseSlot[]

export const defaultSlots: Slot[] = defaultSlotOrder.map(defaultSlot)

export function defaultSlotsForLimit(limit: number): Slot[] {
  return orderSlots(defaultSlots.slice(0, limit))
}
