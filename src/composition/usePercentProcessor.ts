
export function usePercentProcessor(digits = 0) {
  return (value: number) => {
    return Number.isNaN(value) ? '0' : `${(value * 100).toFixed(digits)}%`;
  }
}

export function roundProcessor(value: number, scale = 1) {
  return Number.isNaN(value) ? 0 : Math.round(value * scale) / scale;
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

export function useLogProcessor() {
  return (value: number) => {
    if (value < 100000) return value.toString();
    if (value < 1000000) return (value / 1000).toFixed(1) + 'k';
    return (value / 1000000).toFixed(1) + 'M';
  }
}