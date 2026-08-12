import { geometryFromPoint } from './InteractionGeometry'
import { InteractionHit, InteractionSource } from './InteractionHit'
import { InteractionResolveContext } from './InteractionResolver'
import { Selection } from './Selection'

export type CursorHit = InteractionHit<null, 'cursor'>

const cursorSource: InteractionSource = {}

class CursorSelection extends Selection<CursorHit> {

  resolve(ctx: InteractionResolveContext): readonly CursorHit[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    return [{
      kind: 'cursor',
      source: cursorSource,
      datum: null,
      identity: { source: cursorSource, kind: 'item', key: ctx.input.key },
      memberships: [],
      geometry: geometryFromPoint(pointer.point),
      geometryFor: () => null,
      distance: Infinity,
      contains: false,
      targets: []
    }]
  }
}

export function cursorSelection(): Selection<CursorHit> {
  return new CursorSelection()
}
