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

const average = (column: string) => `avgOrNull(stats.${column})`

// Основные показатели без дополнительных агрегаций.
export const baseSlots = {
  battles: { icon: 'battles', label: 'Бои', sql: 'count()', description: 'Число участий на танке за выбранный период, не уникальных арен' },
  playerCount: { icon: 'player', label: 'Игроки', sql: 'uniqIf(stats.participantId, stats.participantId != 0)', description: 'Оценка числа уникальных игроков за выбранный период, без неизвестных аккаунтов' },
  winrate: { icon: 'winrate', label: 'Победы', sql: "countIf(stats.result = 'win') / nullIf(count(), 0) * 100", format: 'percent' },
  survival: { icon: 'hp', label: 'Выживаемость', sql: `${average('alive')} * 100`, format: 'percent' },

  damage: { icon: 'dmg', label: 'Средний урон', sql: average('damageDealt') },

  assist: { icon: 'assist', label: 'Среднее содействие', sql: average('damageAssistedTotal'), description: 'Суммарное содействие по разведданным, гусеницам и оглушению за бой' },
  assistRadio: { icon: 'assist-radio', label: 'Содействие по разведданным', sql: average('damageAssistedRadio') },
  assistTrack: { icon: 'assist-track', label: 'Содействие по гусеницам', sql: average('damageAssistedTrack') },
  assistStun: { icon: 'stun', label: 'Содействие по оглушению', sql: average('damageAssistedStun') },
  assistMax: { icon: 'assist', label: 'Максимальный вид содействия', sql: average('damageAssistedMax'), description: 'Среднее от максимума трёх видов содействия в каждом бою' },

  damageForMarks: { icon: 'gun-mark-dmg', label: 'Урон для отметки', sql: average('damageForMarks') },
  blocked: { icon: 'block', label: 'Заблокированный урон', sql: average('damageBlockedByArmor') },
  damageReceived: { icon: 'hp', label: 'Полученный урон', sql: average('damageReceived') },
  damageReceivedFromInvisibles: { icon: 'hp', label: 'Урон от незасвеченных', sql: average('damageReceivedFromInvisibles') },

  xp: { icon: 'xp', label: 'Средний опыт', sql: average('xp') },
  kills: { icon: 'kill', label: 'Средние уничтожения', sql: average('kills'), format: 'decimal' },
  spotted: { icon: 'discover', label: 'Обнаружено противников', sql: average('spotted'), format: 'decimal' },
  damaged: { icon: 'dmg', label: 'Повреждено противников', sql: average('damaged'), format: 'decimal' },

  shots: { icon: 'shots', label: 'Выстрелы', sql: average('shots'), format: 'decimal' },
  directEnemyHits: { icon: 'hits', label: 'Прямые попадания', sql: average('directEnemyHits'), format: 'decimal' },
  piercingEnemyHits: { icon: 'piercing', label: 'Пробития', sql: average('piercingEnemyHits'), format: 'decimal' },
  explosionHits: { icon: 'hits', label: 'Попадания осколками', sql: average('explosionHits'), format: 'decimal' },

  directHitsReceived: { icon: 'hits', label: 'Получено прямых попаданий', sql: average('directHitsReceived'), format: 'decimal' },
  piercingsReceived: { icon: 'piercing', label: 'Получено пробитий', sql: average('piercingsReceived'), format: 'decimal' },
  explosionHitsReceived: { icon: 'hits', label: 'Получено попаданий осколками', sql: average('explosionHitsReceived'), format: 'decimal' },

  stunned: { icon: 'stun', label: 'Оглушено противников', sql: average('stunned'), format: 'decimal' },
  stunDuration: { icon: 'stun', label: 'Время оглушения', sql: average('stunDuration'), format: 'time' },

  lifeTime: { icon: 'lifetime', label: 'Время жизни', sql: average('lifeTime'), format: 'time' },
  duration: { icon: 'duration', label: 'Длительность боя', sql: average('duration'), format: 'time' },
  mileage: { icon: 'distance', label: 'Пройденная дистанция', sql: average('mileage'), format: 'distance' },

  maxHealth: { icon: 'hp', label: 'Начальная прочность', sql: average('maxHealth') },
  health: { icon: 'hp', label: 'Оставшаяся прочность', sql: average('health') },

  higherTierEnemies: { icon: 'tank', label: 'Противники выше уровнем', sql: average('higherTierEnemies'), format: 'decimal' },
  sameTierEnemies: { icon: 'tank', label: 'Противники того же уровня', sql: average('sameTierEnemies'), format: 'decimal' },
  lowerTierEnemies: { icon: 'tank', label: 'Противники ниже уровнем', sql: average('lowerTierEnemies'), format: 'decimal' },
} as const satisfies Record<string, SlotDefinition>

export type PrimarySlot = keyof typeof baseSlots

const ratio = (numerator: string, denominator: string, multiplier = 1) =>
  `${numerator} / nullIf(${denominator}, 0)${multiplier === 1 ? '' : ` * ${multiplier}`}`

// Отношения общих сумм за выбранный период, а не средние отношения по отдельным боям.
// Дополнительные агрегации ниже считаются по индивидуальным значениям из PlayerBattleResults.
export const derivedSlots = {
  lifeTimeShare: {
    icon: 'lifetime', label: 'Доля времени жизни', headingLabel: '%', formula: 'Время жизни / длительность боя',
    sql: ratio('sum(stats.lifeTime)', 'sum(stats.duration)', 100), format: 'percent',
  },
  shotsPerLifeMinute: {
    icon: 'shots', label: 'Выстрелы в минуту жизни', headingLabel: '/мин', formula: 'Выстрелы / минуты жизни',
    sql: ratio('sum(stats.shots)', 'sum(stats.lifeTime)', 60), format: 'decimal',
  },
  damagePerLifeMinute: {
    icon: 'dmg', label: 'Урон в минуту жизни', headingLabel: '/мин', formula: 'Урон / минуты жизни',
    sql: ratio('sum(stats.damageDealt)', 'sum(stats.lifeTime)', 60),
  },
  assistPerLifeMinute: {
    icon: 'assist', label: 'Содействие в минуту жизни', headingLabel: '/мин', formula: 'Содействие / минуты жизни',
    sql: ratio('sum(stats.damageAssistedTotal)', 'sum(stats.lifeTime)', 60),
  },
  directHitRate: {
    icon: 'hits', label: 'Доля прямых попаданий', headingLabel: '%', formula: 'Попадания / выстрелы',
    sql: ratio('sum(stats.directEnemyHits)', 'sum(stats.shots)', 100), format: 'percent',
  },
  penetrationRate: {
    icon: 'piercing', label: 'Пробития среди попаданий', headingLabel: '%', formula: 'Пробития / попадания',
    sql: ratio('sum(stats.piercingEnemyHits)', 'sum(stats.directEnemyHits)', 100), format: 'percent',
  },
  penetratingShotRate: {
    icon: 'piercing', label: 'Пробития на выстрел', headingLabel: '/В', formula: 'Пробития / выстрелы',
    sql: ratio('sum(stats.piercingEnemyHits)', 'sum(stats.shots)', 100), format: 'percent',
  },
  receivedPenetrationRate: {
    icon: 'piercing', label: 'Доля входящих пробитий', headingLabel: 'Вх.%', formula: 'Пробития / попадания',
    description: 'Полученные пробития / полученные прямые попадания × 100%. Попадания осколками не учитываются.',
    sql: ratio('sum(stats.piercingsReceived)', 'sum(stats.directHitsReceived)', 100), format: 'percent',
  },
  damageExchangeRatio: {
    icon: 'dmg', label: 'Отношение урона', headingLabel: 'Н/П', formula: 'Нанесённый / полученный',
    sql: ratio('sum(stats.damageDealt)', 'sum(stats.damageReceived)'), format: 'decimal',
  },
  damageToHealthRatio: {
    icon: 'dmg', label: 'Урон к собственной прочности', headingLabel: '/HP', formula: 'Урон / начальная прочность',
    description: 'Сколько собственных запасов прочности танк снимает с противников: суммарный урон / суммарная начальная прочность.',
    sql: ratio('sum(stats.damageDealt)', 'sum(stats.maxHealth)'), format: 'decimal',
  },
  blockedDamageShare: {
    icon: 'block', label: 'Доля заблокированного урона', headingLabel: '%', formula: 'Блок / (блок + полученный урон)',
    description: 'Заблокированный урон / (заблокированный + полученный урон) × 100%. Доля учтённого урона, не вероятность непробития.',
    sql: ratio('sum(stats.damageBlockedByArmor)', 'sum(stats.damageBlockedByArmor) + sum(stats.damageReceived)', 100), format: 'percent',
  },
  remainingHealthShare: {
    icon: 'hp', label: 'Оставшаяся прочность, %', headingLabel: '%', formula: 'Остаток / начальная прочность',
    description: 'Суммарная оставшаяся прочность / суммарная начальная прочность × 100%. Уничтоженные танки учитываются с нулевой оставшейся прочностью.',
    sql: ratio('sum(stats.health)', 'sum(stats.maxHealth)', 100), format: 'percent',
  },
  invisibleDamageShare: {
    icon: 'hp', label: 'Доля урона от незасвеченных', headingLabel: 'НЗ%', formula: 'От незасвеченных / весь урон',
    sql: ratio('sum(stats.damageReceivedFromInvisibles)', 'sum(stats.damageReceived)', 100), format: 'percent',
  },
  assistShare: {
    icon: 'assist', label: 'Доля содействия', headingLabel: '%', formula: 'Содействие / (урон + содействие)',
    sql: ratio('sum(stats.damageAssistedTotal)', 'sum(stats.damageDealt) + sum(stats.damageAssistedTotal)', 100), format: 'percent',
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

// Все распределения считаются по результатам участников, без сохранённых агрегатных состояний.
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

function aggregationSql(slot: AggregatableSlot, aggregation: Aggregation) {
  const column = `stats.${aggregationSources[slot]}`
  switch (aggregation) {
    case 'min': return `minOrNull(${column})`
    case 'max': return `maxOrNull(${column})`
    case 'zero': return `countIf(${column} = 0) / nullIf(count(${column}), 0) * 100`
    default: {
      const index = quantileLevels.indexOf(Number(aggregation.slice(1)) / 100) + 1
      return `if(count(${column}) = 0, NULL, quantilesTDigest(${quantileLevels.join(', ')})(${column})[${index}])`
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
      format: aggregation === 'zero' ? 'percent' : definition.format,
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
    const options: Slot[] = isAggregatableSlot(base)
      ? [base, ...aggregationOrder.map(aggregation => `${base}_${aggregation}` as AggregatedSlot)]
      : [base]
    return options.filter(slot => selected.has(slot))
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
