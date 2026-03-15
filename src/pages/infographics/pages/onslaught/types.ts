

export type DayChartData = {
  relativeRating: number
  timeline: 'past' | 'future' | 'active' | 'played'
  rank: 'qual' | 'first' | 'second' | 'third' | 'fourth' | 'fifth'
}