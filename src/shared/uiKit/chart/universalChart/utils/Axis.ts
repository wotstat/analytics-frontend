import type { Point } from './Point'

export type Axis = 'horizontal' | 'vertical'

export function axisCoordinate(axis: Axis): keyof Point {
  return axis === 'horizontal' ? 'x' : 'y'
}
