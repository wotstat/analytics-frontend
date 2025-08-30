


export function toRelative(arr: number[]) {
  const sum = arr.reduce((prev, cur) => prev + cur, 0)
  return arr.map(t => sum == 0 ? 0 : t / sum)
}

export function toPercent(value: { raw: unknown }[], digits: number = 0) {
  const scale = Math.pow(10, digits)
  return `${(Math.round((value[0].raw as number) * 100 * scale) / scale).toFixed(digits)}%`
}


export function numberToRoman(value: number) {
  if (value < 1 || value > 3999) return value.toString()
  const roman = ['I', 'IV', 'V', 'IX', 'X', 'XL', 'L', 'XC', 'C', 'CD', 'D', 'CM', 'M']
  const decimal = [1, 4, 5, 9, 10, 40, 50, 90, 100, 400, 500, 900, 1000]
  let result = ''
  for (let i = 12; i >= 0; i--) {
    while (value >= decimal[i]) {
      result += roman[i]
      value -= decimal[i]
    }
  }
  return result
}