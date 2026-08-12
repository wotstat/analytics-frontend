import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import type { Position } from '../baseInteractionController/BaseInteractionController'

export type InteractionPointer = {
  readonly point: Point
  readonly cursor?: Position
  readonly isTouch: boolean
}

export type InteractionInput = {
  readonly key: symbol
  readonly pointer: InteractionPointer | null
}

export interface HoverResolver {
  resolve(space: ChartSpace): Point | null
  readonly isTouch: boolean
}
