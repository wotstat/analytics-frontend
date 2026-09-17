import { Bounds, type BoundsConstraint } from './Bounds'
import { Point } from './Point'
import type { NormalizedOffset4Side } from './utils'

function padAxis(min: number, max: number, size: number, lowPx: number, highPx: number,
  fixedMin: number | undefined, fixedMax: number | undefined) {
  if (fixedMin !== undefined && fixedMax !== undefined) return [fixedMin, fixedMax] as const
  if (!(max > min) || !(size > lowPx + highPx)) return [fixedMin ?? min, fixedMax ?? max] as const

  if (fixedMin !== undefined) return [fixedMin, fixedMin + (max - fixedMin) * size / (size - highPx)] as const
  if (fixedMax !== undefined) return [fixedMax - (fixedMax - min) * size / (size - lowPx), fixedMax] as const

  // The new bounds change the scale. Reserve the requested pixels in the final
  // layout, so the original data span occupies size - lowPx - highPx pixels.
  const unitsPerPixel = (max - min) / (size - lowPx - highPx)
  return [min - lowPx * unitsPerPixel, max + highPx * unitsPerPixel] as const
}


export class ChartSpace {
  constructor(
    public layout: {
      x: number,
      y: number,
      width: number,
      height: number
    },
    public bounds: Bounds
  ) { }

  withPixelPadding(padding: NormalizedOffset4Side, fixed: BoundsConstraint = {}): Bounds {
    const [minX, maxX] = padAxis(this.bounds.minX, this.bounds.maxX, this.layout.width,
      padding.left, padding.right, fixed.minX, fixed.maxX)
    const [minY, maxY] = padAxis(this.bounds.minY, this.bounds.maxY, this.layout.height,
      padding.bottom, padding.top, fixed.minY, fixed.maxY)
    return Bounds.fromMinMax(minX, maxX, minY, maxY)
  }

  chartToLayout(p: Point): Point {
    const { x, y } = p
    const { minX, maxX, minY, maxY } = this.bounds
    const { x: layoutX, y: layoutY, width: layoutWidth, height: layoutHeight } = this.layout

    const scaleX = layoutWidth / (maxX - minX)
    const scaleY = layoutHeight / (maxY - minY)

    return {
      x: layoutX + (x - minX) * scaleX,
      y: layoutY + (maxY - y) * scaleY
    }
  }

  chartToLayoutX(x: number): number {
    const { minX, maxX } = this.bounds
    const { x: layoutX, width: layoutWidth } = this.layout

    const scaleX = layoutWidth / (maxX - minX)

    return layoutX + (x - minX) * scaleX
  }

  chartToLayoutY(y: number): number {
    const { minY, maxY } = this.bounds
    const { y: layoutY, height: layoutHeight } = this.layout

    const scaleY = layoutHeight / (maxY - minY)

    return layoutY + (maxY - y) * scaleY
  }

  chartToLocal(points: Point): Point {
    const { x, y } = points
    const { minX, maxX, minY, maxY } = this.bounds
    const { width: layoutWidth, height: layoutHeight } = this.layout

    return {
      x: (x - minX) / (maxX - minX) * layoutWidth,
      y: (y - minY) / (maxY - minY) * layoutHeight
    }
  }

  chartToLocalScale(): { scaleX: number, scaleY: number } {
    const { minX, maxX, minY, maxY } = this.bounds
    const { width: layoutWidth, height: layoutHeight } = this.layout

    return {
      scaleX: layoutWidth / (maxX - minX),
      scaleY: layoutHeight / (maxY - minY)
    }
  }

  chartToLocalX(x: number): number {
    const { minX, maxX } = this.bounds
    const { width: layoutWidth } = this.layout

    return (x - minX) / (maxX - minX) * layoutWidth
  }

  chartToLocalY(y: number): number {
    const { minY, maxY } = this.bounds
    const { height: layoutHeight } = this.layout

    return (y - minY) / (maxY - minY) * layoutHeight
  }

  localToLayout(p: Point): Point {
    const { x, y } = p
    const { x: layoutX, y: layoutY, height } = this.layout

    return {
      x: layoutX + x,
      y: y + height - layoutY
    }
  }

  localToLayoutX(x: number): number {
    const { x: layoutX } = this.layout

    return layoutX + x
  }

  localToLayoutY(y: number): number {
    const { y: layoutY, height } = this.layout

    return layoutY + height - y
  }

  layoutToChart(p: Point): Point {
    const { x, y } = p
    const { minX, maxX, minY, maxY } = this.bounds
    const { x: layoutX, y: layoutY, width: layoutWidth, height: layoutHeight } = this.layout

    return {
      x: minX + (x - layoutX) / layoutWidth * (maxX - minX),
      y: maxY - (y - layoutY) / layoutHeight * (maxY - minY)
    }
  }

  layoutToChartX(x: number): number {
    const { minX, maxX } = this.bounds
    const { x: layoutX, width: layoutWidth } = this.layout

    return minX + (x - layoutX) / layoutWidth * (maxX - minX)
  }

  layoutToChartY(y: number): number {
    const { minY, maxY } = this.bounds
    const { y: layoutY, height: layoutHeight } = this.layout

    return maxY - (y - layoutY) / layoutHeight * (maxY - minY)
  }

  layoutToFractionY(y: number): number {
    const { y: layoutY, height: layoutHeight } = this.layout
    return (y - layoutY) / layoutHeight
  }

  fractionToLayoutY(fraction: number): number {
    const { y: layoutY, height: layoutHeight } = this.layout
    return layoutY + fraction * layoutHeight
  }

  layoutToFractionX(x: number): number {
    const { x: layoutX, width: layoutWidth } = this.layout
    return (x - layoutX) / layoutWidth
  }

  fractionToLayoutX(fraction: number): number {
    const { x: layoutX, width: layoutWidth } = this.layout
    return layoutX + fraction * layoutWidth
  }

  getHash(): string {
    const { minX, maxX, minY, maxY } = this.bounds
    const { x, y, width, height } = this.layout
    return `${minX}_${maxX}_${minY}_${maxY}_${x}_${y}_${width}_${height}`
  }

  getLayoutHash(): string {
    const { x, y, width, height } = this.layout
    return `${x}_${y}_${width}_${height}`
  }
}
