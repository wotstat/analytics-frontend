
export function usePercentProcessor(digits = 0) {
  return (value: number) => {
    return Number.isNaN(value) ? '0' : `${(value * 100).toFixed(digits)}%`;
  }
}

export function useFixedProcessor(digits = 2) {
  return (value: number) => {
    return Number.isNaN(value) ? '0' : value.toFixed(digits);
  }
}