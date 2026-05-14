import { Bounds } from '../../utils/Bounds'
import { Point } from '../../utils/Point'
import { Line } from './Line'

export class SimpleLine extends Line {
  constructor(private points: Point[], classes: string[] = []) {
    super(classes)
  }

  getPointsCount() {
    return this.points.length
  }

  getPointAt(index: number) {
    return this.points[index]
  }

  getPointsInBounds(bounds: Bounds) {

    const points: (Point | null)[] = []
    if (this.points.length < 2) return points

    let lastPointInBounds = this.pointInBounds(this.points[0], bounds)
    let nextPointInBounds = this.pointInBounds(this.points[1], bounds)

    if (lastPointInBounds || nextPointInBounds) points.push(this.points[0])

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i]
      const pointInBounds = nextPointInBounds
      nextPointInBounds = i == this.points.length - 1 ? true : this.pointInBounds(this.points[i + 1], bounds)

      const lastPointIsNull = points[points.length - 1] === null

      if (pointInBounds) {
        points.push(point)
      } else {
        if (lastPointInBounds) points.push(point)
        else if (nextPointInBounds) points.push(point)
        else if (!lastPointIsNull) points.push(null)
      }

      lastPointInBounds = pointInBounds
    }

    return points
  }

  setPoints(points: Point[]) {
    this.points = points
    this.pointsDidChange()
  }

  override getBounds(): Bounds {
    if (this.bounds && !this.bounds.isEmpty()) return this.bounds

    this.bounds = new Bounds()
    if (this.points.length === 0) return this.bounds

    for (const p of this.points) this.bounds.addY(p.y)
    this.bounds.addX(this.points[0].x)
    this.bounds.addX(this.points[this.points.length - 1].x)

    return this.bounds
  }

  private pointInBounds(point: Point, bounds: Bounds) {
    return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY
  }

}
