
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

export function useFixedSpaceProcessor(digits = 2) {
  const toFixed = useFixedProcessor(digits);
  return (value: number) => {
    return toFixed(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}