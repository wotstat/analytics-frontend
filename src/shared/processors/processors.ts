export function createPercentProcessor(digits = 0) {
  return (value: number) => {
    return Number.isNaN(value) ? '0' : `${(value * 100).toFixed(digits)}%`
  }
}

export function roundProcessor(value: number, scale = 1) {
  return Number.isNaN(value) ? 0 : Math.round(value * scale) / scale
}

export function createFixedProcessor(digits = 2) {
  return (value: number) => {
    return Number.isNaN(value) ? '0' : value.toFixed(digits)
  }
}

export function createFixedSpaceProcessor(digits = 2) {
  const toFixed = createFixedProcessor(digits)
  return (value: number) => {
    return toFixed(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }
}

export function createLogProcessor(fractionDigits: number = 1) {
  return (value: number) => {
    if (Math.abs(value) < 1e5) return value.toFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    if (Math.abs(value) < 1e6) return (value / 1e3).toFixed(fractionDigits) + 'k'
    if (Math.abs(value) < 1e7) return (value / 1e6).toFixed(fractionDigits + 1) + 'M'
    if (Math.abs(value) < 1e9) return (value / 1e6).toFixed(fractionDigits) + 'M'
    if (Math.abs(value) < 1e12) return (value / 1e9).toFixed(fractionDigits) + 'B'
    return (value / 1e12).toFixed(1) + 'T'
  }
}

export function romanNumberProcessor(value: number) {
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