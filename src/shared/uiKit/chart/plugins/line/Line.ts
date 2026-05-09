import type { ChartPlugin, Chart, ChartDelegate } from '../../Chart'
import './style.scss'

export interface DataSource {
  getPointsCount(): number
  getPoint(index: number): { x: number, y: number } | number | [number, number]
}

export class Line implements ChartPlugin {

  private chartDelegate: ChartDelegate | null = null
  private group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  private lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  constructor(private readonly dataSource: DataSource) {
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

    let d = ''
    for (let i = 0; i < pointsCount; i++) {
      const point = this.dataSource.getPoint(i)
      const x = typeof point === 'number' ? point : Array.isArray(point) ? point[0] : point.x
      const y = typeof point === 'number' ? point : Array.isArray(point) ? point[1] : point.y
      d += `${i === 0 ? 'M' : 'L'} ${x * 10} ${y * 1.5} `
    }
    this.lineElement.setAttribute('d', d.trim())
  }

}