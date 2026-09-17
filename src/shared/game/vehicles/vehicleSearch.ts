import { Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'

export function createVehicleNameFilter(query: string) {
  const term = query.trim()

  return (name: string): Highlighted | null => {
    const highlighted = new Highlighted(name)
    highlighted.setSubstring(term)
    return !term || highlighted.intervals.length ? highlighted : null
  }
}
