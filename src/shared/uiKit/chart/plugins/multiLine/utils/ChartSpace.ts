import { Bounds } from './Bounds'
import { Point } from './Point'


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

  getHash(): string {
    const { minX, maxX, minY, maxY } = this.bounds
    const { x, y, width, height } = this.layout
    return `${minX}_${maxX}_${minY}_${maxY}_${x}_${y}_${width}_${height}`
  }
}