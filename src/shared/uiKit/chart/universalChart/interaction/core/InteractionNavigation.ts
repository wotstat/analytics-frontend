import type { Axis } from '../../utils/Axis'

export type NavigationAnchorPolicy = 'data' | 'cursor'

export interface InteractionNavigation {
  anchorPolicy(axis: Axis, time: number): NavigationAnchorPolicy
}
