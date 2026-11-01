import { spring, SpringFollower } from './spring'

export const DEFAULT_FOLLOW_OMEGA = 30 // Natural frequency of a follower. Higher = snappier catch-up.

export class CriticalFollower extends SpringFollower {
  constructor(value: number, velocity: number = 0, omega: number = DEFAULT_FOLLOW_OMEGA) {
    super(value, velocity, spring({ response: 2 * Math.PI / omega }))
  }
}
