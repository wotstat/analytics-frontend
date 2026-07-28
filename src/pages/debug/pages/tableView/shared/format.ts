export function formatInt(value: number) {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatMs(value: number) {
  if (value >= 100) return `${Math.round(value)} мс`
  return `${value.toFixed(1)} мс`
}
