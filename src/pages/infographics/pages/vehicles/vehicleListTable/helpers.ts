import type { IconType } from '@/shared/game/efficiencyIcon/utils'

type SlotDefinition = {
  icon: IconType
  label: string
  description?: string
  sql: string
  format?: 'integer' | 'decimal' | 'percent' | 'time' | 'distance'
}

const average = (column: string) => `sum(${column}) / nullIf(sum(participations), 0)`

// Все базовые показатели загружаются вместе, независимо от выбранных столбцов.
export const availableSlots = {
  battles: { icon: 'battles', label: 'Бои', sql: 'sum(participations)', description: 'Число участий на танке за день, не уникальных арен' },
  playerCount: { icon: 'player', label: 'Игроки', sql: 'uniqIfMerge(players)', description: 'Оценка числа уникальных игроков за день, без неизвестных аккаунтов' },
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

export type Slot = keyof typeof availableSlots

export const slotCategories = [
  { title: 'Общее', slots: ['battles', 'playerCount', 'winrate', 'survival', 'xp', 'lifeTime', 'duration', 'mileage'] },
  { title: 'Урон и прочность', slots: ['damage', 'damageForMarks', 'blocked', 'damageReceived', 'damageReceivedFromInvisibles', 'maxHealth', 'health'] },
  { title: 'Содействие', slots: ['assist', 'assistRadio', 'assistTrack', 'assistStun', 'assistMax'] },
  { title: 'Стрельба', slots: ['shots', 'directEnemyHits', 'piercingEnemyHits', 'explosionHits', 'directHitsReceived', 'piercingsReceived', 'explosionHitsReceived'] },
  { title: 'В бою', slots: ['kills', 'spotted', 'damaged', 'stunned', 'stunDuration', 'higherTierEnemies', 'sameTierEnemies', 'lowerTierEnemies'] },
] as const satisfies readonly { title: string, slots: readonly Slot[] }[]

const slotOrder: Slot[] = slotCategories.flatMap(category => [...category.slots])

export function orderSlots(slots: readonly Slot[]): Slot[] {
  return slotOrder.filter(slot => slots.includes(slot))
}

export type VehicleStatistics = {
  tankTag: string
  tankLevel: number
  tankType: string
  region: string
  day: string
} & Record<Slot, number | null>

export const defaultSlots: Slot[] = ['battles', 'playerCount', 'winrate', 'damage', 'assist', 'xp', 'lifeTime']

const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatSlotValue(slot: Slot, value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—'

  const definition: SlotDefinition = availableSlots[slot]
  switch (definition.format) {
    case 'percent': return `${decimal.format(value)}%`
    case 'decimal': return decimal.format(value)
    case 'distance': return `${integer.format(value)} м`
    case 'time': {
      const seconds = Math.round(value)
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    }
    default: return integer.format(value)
  }
}

export function slotDescription(slot: Slot) {
  const definition: SlotDefinition = availableSlots[slot]
  return definition.description ?? definition.label
}

export function formatStatisticsDay(day: string) {
  return day.split('-').reverse().join('.')
}
