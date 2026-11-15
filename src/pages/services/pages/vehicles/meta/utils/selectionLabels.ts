import { nationNames, type Nation } from '@/shared/game/domain/vehicles/nations'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import type { VehicleSelection } from '../../shared/vehicleGrouping'

export type SelectionLabel = { text: string, level?: boolean, types?: string[] }

const vehicleClasses: Record<string, string> = { HT: 'ТТ', MT: 'СТ', LT: 'ЛТ', AT: 'ПТ-САУ', SPG: 'САУ' }
export const vehicleClassLabel = (type: string) => vehicleClasses[type] ?? type

export function selectionLabelParts(selection: VehicleSelection) {
  const labels: SelectionLabel[] = []
  if (selection.levels.length) {
    const levels = [...selection.levels].sort((a, b) => a - b)
    labels.push({ text: levels.map(romanNumberProcessor).join(', '), level: true })
  }
  if (selection.types.length) {
    labels.push({ text: selection.types.map(vehicleClassLabel).join(', '), types: selection.types })
  }
  if (selection.nations.length) {
    const nations = selection.nations.map(nation => nationNames[nation as Nation] ?? nation)
    labels.push({ text: nations.join(', ') })
  }
  return labels
}

export const selectionLabels = (selection: VehicleSelection) => selectionLabelParts(selection).map(label => label.text)
