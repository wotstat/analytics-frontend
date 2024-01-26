

export type BloomColorVariant = keyof typeof BloomColor
export function getColor(name: BloomColorVariant) {
  return BloomColor[name]
}

export const BloomColor = {
  red: {
    main: '#ffe7e7',
    darken: '#ff9494',
    bloom: '#ce2021',
  },
  gold: {
    main: '#ffdd9c',
    darken: '#ffce7c',
    bloom: '#f73c08',
  },
  green: {
    main: '#e7ffde',
    darken: '#b1ff95',
    bloom: '#639e31',
  },
  blue: {
    main: '#eff3ff',
    darken: '#cfdfff',
    bloom: '#5249c6',
  },
  yellow: {
    main: '#ffffe7',
    darken: '#ffffce',
    bloom: '#deaa0a',
  },
  orange: {
    main: '#fffbe7',
    darken: '#fff295',
    bloom: '#d66d08',
  }
} as const
