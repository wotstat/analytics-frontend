

export type BloomColorVariant = keyof typeof BloomColor
export function getColor(name: BloomColorVariant) {
  return BloomColor[name]
}

export const BloomColor = {
  red: {
    main: '#ffe7e7',
    highlight: '#ff9494',
    darken: '#ff9494',
    bloom: '#ce2021',
  },
  gold: {
    main: '#ffdd9c',
    highlight: '#ffdd9c',
    darken: '#ffdd9c',
    bloom: '#f73c08',
  },
  green: {
    main: '#e7ffde',
    highlight: '#b1ff95',
    darken: '#b1ff95',
    bloom: '#639e31',
  },
  blue: {
    main: '#eff3ff',
    highlight: '#cfdfff',
    darken: '#cfdfff',
    bloom: '#5249c6',
  },
  yellow: {
    main: '#ffffe7',
    highlight: '#ffffce',
    darken: '#ffffce',
    bloom: '#deaa0a',
  },
  orange: {
    main: '#fffbe7',
    highlight: '#fff295',
    darken: '#fff295',
    bloom: '#d66d08',
  }
} as const
