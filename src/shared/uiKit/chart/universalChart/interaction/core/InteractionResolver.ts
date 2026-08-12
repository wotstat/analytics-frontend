import { ChartSpace } from '../../utils/ChartSpace'
import type { InteractionFrame } from './InteractionFrame'
import { InteractionHit } from './InteractionHit'
import { InteractionInput } from './InteractionInput'

export type InteractionResolveContext = {
  readonly frame: InteractionFrame
  readonly input: InteractionInput
  readonly space: ChartSpace
}

export interface InteractionResolver<THit extends InteractionHit = InteractionHit> {
  resolve(ctx: InteractionResolveContext): readonly THit[]
}
