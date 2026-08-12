import { InteractionHit } from './InteractionHit'
import { HoverResolver, InteractionInput } from './InteractionInput'
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
    ctx.frame.inheritCompatibleEffectiveInput(this, [this.left, this.right], ctx.input)

    const result: THit[] = []
    const positions = new Map<symbol, Map<string, Map<string | number | symbol, number>>>()

    const place = (hit: THit) => {
      const { sourceId, kind, key } = hit.identity

      let byKind = positions.get(sourceId)
      if (!byKind) { byKind = new Map(); positions.set(sourceId, byKind) }

      let byKey = byKind.get(kind)
      if (!byKey) { byKey = new Map(); byKind.set(kind, byKey) }

      const existingIndex = byKey.get(key)
      if (existingIndex === undefined) {
        byKey.set(key, result.length)
        result.push(hit)
      } else {
        result[existingIndex] = hit
      }
    }

    for (const hit of left) place(hit)
    for (const hit of right) place(hit)

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
    if (left.length > 0) {
      ctx.frame.inheritEffectiveInput(this, this.left, ctx.input)
      return left
    }

    const right = ctx.frame.resolve(this.right, ctx.input)
    ctx.frame.inheritEffectiveInput(this, this.right, ctx.input)
    return right
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
    ctx.frame.inheritEffectiveInput(this, this.parent, ctx.input)
    return hits.filter(hit => hit.contains || hit.distance <= this.options.maxDistance)
  }
}

class NearestSelection<THit extends InteractionHit> extends Selection<THit> {

  constructor(private readonly parent: InteractionResolver<THit>) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly THit[] {
    const hits = ctx.frame.resolve(this.parent, ctx.input)
    ctx.frame.inheritEffectiveInput(this, this.parent, ctx.input)
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
    ctx.frame.inheritEffectiveInput(this, this.parent, ctx.input)
    if (hits.length === 0) return hits

    return [hits[hits.length - 1]]
  }
}

class WithInputSelection<THit extends InteractionHit> extends Selection<THit> {

  private readonly syncedKey: symbol = Symbol('syncedInput')

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
