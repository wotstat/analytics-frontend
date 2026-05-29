import { Overflow, Size } from '../../MultiLine'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'

export type DataSource = ({ x: number, y: number } | null)[]

export type HoveredDataPoint = {
  dataSource: DataSource,
  sourceIndex: number,
  pointIndex: number,
  xValue: number,
  yValue: number
  distance: number
}

export function isDataPointEqual(a: HoveredDataPoint, b: HoveredDataPoint): boolean {
  return a.dataSource === b.dataSource &&
    a.pointIndex === b.pointIndex &&
    a.xValue === b.xValue &&
    a.yValue === b.yValue
}

export function isDataPointArrayEqual(a: HoveredDataPoint[], b: HoveredDataPoint[]): boolean {
  if (a.length !== b.length) return false
  return a.every((point, i) => isDataPointEqual(point, b[i]))
}

export abstract class BasePlotHover extends BasePlotRenderer {

  private readonly interactiveZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  protected dataSources: DataSource[] = []

  protected lastNearestDataPoints: HoveredDataPoint[] | null = null
  protected lastNearestXDataPoints: HoveredDataPoint[] | null = null
  protected lastNearestYDataPoints: HoveredDataPoint[] | null = null

  constructor(classes: Classes = []) {
    super(classes)

    this.root.appendChild(this.interactiveZone)
    this.interactiveZone.classList.add('interactive-zone')

    this.interactiveZone.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.interactiveZone.addEventListener('mouseleave', this.onMouseLeave.bind(this))
    this.interactiveZone.addEventListener('mouseenter', this.onMouseEnter.bind(this))
  }

  protected onMouseMove(event: MouseEvent) {
    this.updateMouse(event)
  }

  protected onMouseEnter(event: MouseEvent) {
    this.root.classList.add('hovered')
    if (this.multiLine) this.onEnter(this.getLocalPoint(event), this.multiLine.mainSpace)
    this.updateMouse(event)
  }

  protected onMouseLeave(event: MouseEvent) {
    this.root.classList.remove('hovered')
    if (this.multiLine) this.onLeave(this.getLocalPoint(event), this.multiLine.mainSpace)
  }

  private updateMouse(event: MouseEvent) {
    if (!this.multiLine) return

    this.lastNearestDataPoints = null
    this.lastNearestXDataPoints = null
    this.lastNearestYDataPoints = null

    this.onPositionChange(this.getLocalPoint(event), this.multiLine.mainSpace)
  }

  private getLocalPoint(event: MouseEvent): Point {
    const rect = this.interactiveZone.getBoundingClientRect()
    const x = this.multiLine!.mainSpace.layout.x + event.clientX - rect.left
    const y = this.multiLine!.mainSpace.layout.y + event.clientY - rect.top

    return { x, y }
  }

  protected onEnter(point: Point, space: ChartSpace) { }
  protected onLeave(point: Point, space: ChartSpace) { }
  protected onPositionChange(point: Point, space: ChartSpace) { }

  findNearestInDataSource(point: Point, space: ChartSpace, dataSource: DataSource) {
    let nearestPointIndex = -1
    let nearestDistance = Infinity

    const chartPoint = space.layoutToChart(point)
    const chartScale = space.chartToLocalScale()

    for (let i = 0; i < dataSource.length; i++) {
      const dataPoint = dataSource[i]
      if (!dataPoint || !space.bounds.contains(dataPoint)) continue

      const dist = Math.pow((dataPoint.x - chartPoint.x) * chartScale.scaleX, 2) + Math.pow((dataPoint.y - chartPoint.y) * chartScale.scaleY, 2)
      if (dist < nearestDistance) {
        nearestDistance = dist
        nearestPointIndex = i
      }
    }

    if (nearestPointIndex === -1) return null

    const nearestDataPoint = dataSource[nearestPointIndex]
    const distance = Math.sqrt(nearestDistance)
    return {
      index: nearestPointIndex,
      xValue: nearestDataPoint!.x,
      yValue: nearestDataPoint!.y,
      distance
    }
  }

  findNearestInDataSourceByAxis(point: Point, space: ChartSpace, dataSource: DataSource, axis: 'x' | 'y') {
    let nearestPointIndex = -1
    let nearestDistance = Infinity

    const chartPoint = space.layoutToChart(point)

    for (let i = 0; i < dataSource.length; i++) {
      const dataPoint = dataSource[i]
      if (!dataPoint || !space.bounds.contains(dataPoint)) continue

      const dist = axis === 'x' ? Math.abs(dataPoint.x - chartPoint.x) : Math.abs(dataPoint.y - chartPoint.y)
      if (dist < nearestDistance) {
        nearestDistance = dist
        nearestPointIndex = i
      }
    }

    if (nearestPointIndex === -1) return null

    const nearestDataPoint = dataSource[nearestPointIndex]
    return {
      index: nearestPointIndex,
      xValue: nearestDataPoint!.x,
      yValue: nearestDataPoint!.y,
      distance: nearestDistance
    }
  }

  findNearest(point: Point, space: ChartSpace, sorted: boolean = false): HoveredDataPoint[] {
    const result = this.lastNearestDataPoints ?? this.dataSources
      .map((ds, i) => {
        const nearest = this.findNearestInDataSource(point, space, ds)
        if (!nearest) return null
        return {
          dataSource: ds,
          sourceIndex: i,
          pointIndex: nearest.index,
          xValue: nearest.xValue,
          yValue: nearest.yValue,
          distance: nearest.distance
        }
      })
      .filter(p => p !== null)

    this.lastNearestDataPoints = result

    if (!sorted) return result

    return result
      .sort((a, b) => a.distance - b.distance)
  }

  findNearestByAxis(point: Point, space: ChartSpace, axis: 'x' | 'y', sorted: boolean = false): HoveredDataPoint[] {
    const lastNearest = axis === 'x' ? this.lastNearestXDataPoints : this.lastNearestYDataPoints

    const result = lastNearest ?? this.dataSources
      .map((ds, i) => {
        const nearest = this.findNearestInDataSourceByAxis(point, space, ds, axis)
        if (!nearest) return null
        return {
          dataSource: ds,
          sourceIndex: i,
          pointIndex: nearest.index,
          xValue: nearest.xValue,
          yValue: nearest.yValue,
          distance: nearest.distance
        }
      })
      .filter(p => p !== null)

    if (axis === 'x') this.lastNearestXDataPoints = result
    else if (axis === 'y') this.lastNearestYDataPoints = result

    if (!sorted) return result

    return result
      .sort((a, b) => a.distance - b.distance)
  }

  didLayout(space: ChartSpace, full: Size): void {
    this.interactiveZone.setAttribute('x', space.layout.x.toString())
    this.interactiveZone.setAttribute('y', space.layout.y.toString())
    this.interactiveZone.setAttribute('width', space.layout.width.toString())
    this.interactiveZone.setAttribute('height', space.layout.height.toString())
  }

  setDataSources(...sources: DataSource[]) {
    this.dataSources = sources
    return this
  }

  addDataSource(...sources: DataSource[]) {
    this.dataSources.push(...sources)

    return this
  }
}