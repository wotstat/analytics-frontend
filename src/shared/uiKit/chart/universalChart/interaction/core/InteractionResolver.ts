import { ChartSpace } from '../../utils/ChartSpace'
import type { InteractionFrame } from './InteractionFrame'
import { InteractionHit } from './InteractionHit'
import { InteractionInput } from './InteractionInput'
import { InteractionSource } from './InteractionSource'

export type InteractionResolveContext = {
  readonly frame: InteractionFrame
  readonly input: InteractionInput
  readonly space: ChartSpace
}

export interface InteractionResolver<THit extends InteractionHit = InteractionHit> {
  readonly interactionSources?: readonly InteractionSource[]
  resolve(ctx: InteractionResolveContext): readonly THit[]
}
