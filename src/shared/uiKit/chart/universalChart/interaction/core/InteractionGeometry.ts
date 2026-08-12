import { Point } from '../../utils/Point'

export type InteractionBounds = {
  readonly minX: number
  readonly maxX: number
  readonly minY: number
  readonly maxY: number
}

export type InteractionGeometry = {
  readonly anchor: Point
  readonly bounds: InteractionBounds
  readonly xRange: readonly [number, number]
  readonly yRange: readonly [number, number]
}

export function geometryFromRanges(anchor: Point, xRange: readonly [number, number], yRange: readonly [number, number]): InteractionGeometry {
  const minX = Math.min(xRange[0], xRange[1])
  const maxX = Math.max(xRange[0], xRange[1])
  const minY = Math.min(yRange[0], yRange[1])
  const maxY = Math.max(yRange[0], yRange[1])

  return {
    anchor,
    bounds: { minX, maxX, minY, maxY },
    xRange: [minX, maxX],
    yRange: [minY, maxY]
  }
}

export function geometryFromPoint(anchor: Point): InteractionGeometry {
  return geometryFromRanges(anchor, [anchor.x, anchor.x], [anchor.y, anchor.y])
}
