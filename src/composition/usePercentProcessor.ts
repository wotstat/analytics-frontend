import { computed, toValue, WatchSource } from "vue";

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

export function useLogProcessor(fractionDigits: number = 1) {
  return (value: number) => {
    if (Math.abs(value) < 1e5) return value.toFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (Math.abs(value) < 1e6) return (value / 1e3).toFixed(fractionDigits) + 'k';
    if (Math.abs(value) < 1e7) return (value / 1e6).toFixed(fractionDigits + 1) + 'M';
    if (Math.abs(value) < 1e9) return (value / 1e6).toFixed(fractionDigits) + 'M';
    if (Math.abs(value) < 1e12) return (value / 1e9).toFixed(fractionDigits) + 'B';
    return (value / 1e12).toFixed(1) + 'T';
  }
}