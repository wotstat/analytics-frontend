// Общие форматтеры чисел для таблиц стенда: NaN/±Infinity различаются явно, а не схлопываются в одно «∞»
export function fmt(value: number): string {
  if (Number.isNaN(value)) return 'NaN'
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'
  return value.toFixed(2)
}

export function range(values: readonly [number, number]): string {
  return `${fmt(values[0])} … ${fmt(values[1])}`
}
