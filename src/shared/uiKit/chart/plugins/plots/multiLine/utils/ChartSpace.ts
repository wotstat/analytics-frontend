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

  translate(p: Point): Point {
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

  translateX(x: number): number {
    const { minX, maxX } = this.bounds
    const { x: layoutX, width: layoutWidth } = this.layout

    const scaleX = layoutWidth / (maxX - minX)

    return layoutX + (x - minX) * scaleX
  }

  translateY(y: number): number {
    const { minY, maxY } = this.bounds
    const { y: layoutY, height: layoutHeight } = this.layout

    const scaleY = layoutHeight / (maxY - minY)

    return layoutY + (maxY - y) * scaleY
  }

  getHash(): string {
    const { minX, maxX, minY, maxY } = this.bounds
    const { x, y, width, height } = this.layout
    return `${minX}_${maxX}_${minY}_${maxY}_${x}_${y}_${width}_${height}`
  }
}