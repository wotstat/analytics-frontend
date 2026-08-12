import { ChartSpace } from '../../utils/ChartSpace'
import { InteractionHit } from './InteractionHit'
import { InteractionInput, InteractionInputKey } from './InteractionInput'
import { InteractionResolver } from './InteractionResolver'

function mapFor<V>(store: WeakMap<InteractionResolver, Map<InteractionInputKey, V>>, resolver: InteractionResolver): Map<InteractionInputKey, V> {
  let byInput = store.get(resolver)
  if (!byInput) {
    byInput = new Map()
    store.set(resolver, byInput)
  }
  return byInput
}

export class InteractionFrame {

  private readonly cache = new WeakMap<InteractionResolver, Map<InteractionInputKey, readonly InteractionHit[]>>()
  private readonly effectiveInput = new WeakMap<InteractionResolver, Map<InteractionInputKey, InteractionInput>>()

  constructor(
    readonly space: ChartSpace,
    readonly input: InteractionInput
  ) { }

  resolve<THit extends InteractionHit>(resolver: InteractionResolver<THit>, input: InteractionInput = this.input): readonly THit[] {
    const byInput = mapFor(this.cache, resolver)

    const cached = byInput.get(input.key)
    if (cached !== undefined) return cached as readonly THit[]

    const hits = resolver.resolve({ frame: this, input, space: this.space })
    byInput.set(input.key, hits)
    return hits
  }

  recordEffectiveInput(resolver: InteractionResolver, callerInput: InteractionInput, effective: InteractionInput): void {
    mapFor(this.effectiveInput, resolver).set(callerInput.key, effective)
  }

  effectiveInputFor(resolver: InteractionResolver, callerInput: InteractionInput = this.input): InteractionInput | null {
    return this.effectiveInput.get(resolver)?.get(callerInput.key) ?? null
  }
}
