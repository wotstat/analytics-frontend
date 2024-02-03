

export function toRelative(arr: number[]) {
  const sum = arr.reduce((prev, cur) => prev + cur, 0)
  return arr.map(t => sum == 0 ? 0 : t / sum)
}

export function toPercent(value: { raw: unknown }[]) {
  return `${Math.round((value[0].raw as number) * 100)}%`
}

export function whereSum(exp: string[], addWhere: boolean = true) {
  return exp.length > 0 ? (addWhere ? 'WHERE ' : '') + exp.join(' AND ') : ''
}