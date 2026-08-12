import { InteractionHit, isSameIdentity } from './InteractionHit'
import { HoverResolver, InteractionInput, InteractionInputKey } from './InteractionInput'
import { InteractionResolveContext, InteractionResolver } from './InteractionResolver'

export type WithinOptions = {
  maxDistance: number
}

export abstract class Selection<THit extends InteractionHit = InteractionHit> implements InteractionResolver<THit> {

  abstract resolve(ctx: InteractionResolveContext): readonly THit[]

  union<TOther extends InteractionHit>(other: InteractionResolver<TOther>): Selection<THit | TOther> {
    return new UnionSelection<THit | TOther>(this, other)
  }

  orElse<TOther extends InteractionHit>(other: InteractionResolver<TOther>): Selection<THit | TOther> {
    return new OrElseSelection<THit | TOther>(this, other)
  }

  within(options: WithinOptions): Selection<THit> {
    return new WithinSelection(this, options)
  }

  nearest(): Selection<THit> {
    return new NearestSelection(this)
  }

  topmost(): Selection<THit> {
    return new TopmostSelection(this)
  }

  withInput(hoverSync: HoverResolver): Selection<THit> {
    return new WithInputSelection(this, hoverSync)
  }
}

class UnionSelection<THit extends InteractionHit> extends Selection<THit> {

  constructor(
    private readonly left: InteractionResolver<THit>,
    private readonly right: InteractionResolver<THit>
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly THit[] {
    const left = ctx.frame.resolve(this.left, ctx.input)
    const right = ctx.frame.resolve(this.right, ctx.input)

    const result: THit[] = []
    for (const hit of [...left, ...right]) {
      const index = result.findIndex(existing => isSameIdentity(existing.identity, hit.identity))
      if (index === -1) result.push(hit)
      else result[index] = hit
    }

    return result
  }
}

class OrElseSelection<THit extends InteractionHit> extends Selection<THit> {

  constructor(
    private readonly left: InteractionResolver<THit>,
    private readonly right: InteractionResolver<THit>
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly THit[] {
    const left = ctx.frame.resolve(this.left, ctx.input)
    if (left.length > 0) return left

    return ctx.frame.resolve(this.right, ctx.input)
  }
}

class WithinSelection<THit extends InteractionHit> extends Selection<THit> {

  constructor(
    private readonly parent: InteractionResolver<THit>,
    private readonly options: WithinOptions
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly THit[] {
    const hits = ctx.frame.resolve(this.parent, ctx.input)
    return hits.filter(hit => hit.contains || hit.distance <= this.options.maxDistance)
  }
}

class NearestSelection<THit extends InteractionHit> extends Selection<THit> {

  constructor(private readonly parent: InteractionResolver<THit>) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly THit[] {
    const hits = ctx.frame.resolve(this.parent, ctx.input)
    if (hits.length === 0) return hits

    let best = hits[0]
    for (let i = 1; i < hits.length; i++) if (hits[i].distance <= best.distance) best = hits[i]

    return [best]
  }
}

class TopmostSelection<THit extends InteractionHit> extends Selection<THit> {

  constructor(private readonly parent: InteractionResolver<THit>) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly THit[] {
    const hits = ctx.frame.resolve(this.parent, ctx.input)
    if (hits.length === 0) return hits

    return [hits[hits.length - 1]]
  }
}

class WithInputSelection<THit extends InteractionHit> extends Selection<THit> {

  private readonly syncedKey: InteractionInputKey = {}

  constructor(
    private readonly parent: InteractionResolver<THit>,
    private readonly hoverSync: HoverResolver
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly THit[] {
    const local = ctx.frame.input
    if (local.pointer) {
      ctx.frame.recordEffectiveInput(this, ctx.input, local)
      return ctx.frame.resolve(this.parent, local)
    }

    const point = this.hoverSync.resolve(ctx.space)
    if (!point) return []

    const syncedInput: InteractionInput = {
      key: this.syncedKey,
      pointer: { point, isTouch: this.hoverSync.isTouch }
    }

    ctx.frame.recordEffectiveInput(this, ctx.input, syncedInput)
    return ctx.frame.resolve(this.parent, syncedInput)
  }
}
