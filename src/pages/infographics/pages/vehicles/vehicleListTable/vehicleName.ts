import { getTankName } from '@/shared/i18n/i18n'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import type { VehicleStatistics } from './helpers'

const classNames: Record<string, string> = {
  HT: 'ТТ', MT: 'СТ', LT: 'ЛТ', AT: 'ПТ-САУ', SPG: 'САУ'
}

export function vehicleName(vehicle: VehicleStatistics, short = true) {
  if (vehicle.tankTag !== null) return getTankName(vehicle.tankTag, short)
  const level = vehicle.tankLevel === null ? '' : romanNumberProcessor(vehicle.tankLevel)
  const type = vehicle.tankType === null ? '' : classNames[vehicle.tankType] ?? vehicle.tankType
  return type ? `${type}${level ? ` · ${level}` : ''}` : `${level} уровень`
}
