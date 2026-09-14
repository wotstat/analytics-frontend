export type InteractionTag = string | number | symbol

export interface InteractionSource<TTag extends InteractionTag = InteractionTag> {
  readonly id: symbol
  readonly tag?: TTag
  getTargets(): readonly SVGElement[]
}
