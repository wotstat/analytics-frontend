
export function usePercentProcessor(digits = 0) {
  return (value: number) => {
    return `${(value * 100).toFixed(digits)}%`;
  }
}