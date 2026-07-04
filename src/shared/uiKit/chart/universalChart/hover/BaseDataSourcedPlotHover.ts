import { BasePlotHover, Delegate, Position } from './basePlotHover/BasePlotHover'
import { Overflow, Size, UniversalChart } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { Point } from '../utils/Point'
import { Classes } from '../utils/utils'

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

export abstract class BaseDataSourcedPlotHover extends BasePlotHover {
  protected dataSources: DataSource[] = []

  protected lastNearestDataPoints: HoveredDataPoint[] | null = null
  protected lastNearestXDataPoints: HoveredDataPoint[] | null = null
  protected lastNearestYDataPoints: HoveredDataPoint[] | null = null

  constructor(classes: Classes = []) {
    super(classes)
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
    this.lastNearestDataPoints = null
    this.lastNearestXDataPoints = null
    this.lastNearestYDataPoints = null
    super.renderImpl(space, overflow, full)
  }

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
    const chartScale = space.chartToLocalScale()

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
      distance: nearestDistance * chartScale[axis === 'x' ? 'scaleX' : 'scaleY']
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
    super.didLayout(space, full)
    this.interactiveZoneOffsets = { x: space.layout.x, y: space.layout.y }
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