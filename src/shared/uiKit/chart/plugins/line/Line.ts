import { BaseSpace } from '../../BaseSpace'
import { type ChartPlugin, type Chart, type ChartDelegate } from '../../Chart'
import './style.scss'


type Point = { x: number, y: number } | number | [number, number]
export interface DataSource {
  getPointsCount(): number
  getPoint(index: number): Point
}


function processPoint(point: Point): { x: number, y: number } {
  if (typeof point === 'number') {
    return { x: point, y: point }
  } else if (Array.isArray(point)) {
    return { x: point[0], y: point[1] }
  } else {
    return point
  }
}

export class Line extends BaseSpace implements ChartPlugin {

  private chartDelegate: ChartDelegate | null = null
  private group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  private lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  constructor(private readonly dataSource: DataSource) {
    super()
    this.group.appendChild(this.lineElement)
    this.group.classList.add('line-chart-root')
    this.lineElement.classList.add('line-chart-line')
  }

  public apply(delegate: ChartDelegate): void {
    this.chartDelegate?.removeChild(this.group)
    this.chartDelegate = delegate
    delegate.addChild(this.group)
  }

  public dataDidUpdate(): void {
    this.chartDelegate?.scheduleRender()
  }

  public render() {

    const pointsCount = this.dataSource.getPointsCount()
    if (pointsCount === 0) {
      this.lineElement.setAttribute('d', '')
      return
    }

    const pointes = new Array(pointsCount)
    let maxX = -Infinity
    let maxY = -Infinity
    let minX = Infinity
    let minY = Infinity
    for (let i = 0; i < pointsCount; i++) {
      pointes[i] = processPoint(this.dataSource.getPoint(i))
      const { x, y } = pointes[i]
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
    }

    let d = ''
    for (let i = 0; i < pointsCount; i++) {
      const { x, y } = pointes[i]
      const xNorm = (x - minX) / (maxX - minX)
      const yNorm = (y - minY) / (maxY - minY)

      const res = this.transform(xNorm, yNorm)
      d += `${i === 0 ? 'M' : 'L'} ${res.x} ${res.y} `
    }
    this.lineElement.setAttribute('d', d.trim())
  }

}