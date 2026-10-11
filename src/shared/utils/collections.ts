export function uniqueSorted<T extends string | number>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((a, b) => {
    if (typeof a !== typeof b) return typeof a === 'number' ? -1 : 1
    return a < b ? -1 : a > b ? 1 : 0
  })
}

export function sameSet<T>(a: readonly T[], b: readonly T[]): boolean {
  const values = new Set(a)
  return values.size === new Set(b).size && b.every(value => values.has(value))
}
