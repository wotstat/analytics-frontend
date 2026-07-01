import { AutoMarker } from '../../../../plot/markers/autoMarkers/AutoMarkers'
import { Overflow, Size } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { addClasses, Classes, joinClasses } from '../../../../utils/utils'
import { DataSource, HoveredDataPoint, isDataPointArrayEqual, Position } from '../../../BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'



type Options = {
  classes?: Classes
  markerClasses?: Classes
  getClassesForDataSource?: (dataSource: DataSource, index: number) => Classes
  classesForDataSource?: Classes[],
  targetMasks?: Element[] | Element
  size?: number
  maskSize?: number
  position?: 'data-point-x' | 'data-point-y' | 'data-point' | 'nearest-data-point'
  activateDistance?: number
}

export class NearestMarker implements HoverComponent {

  protected root = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  protected targetMasks: Element[] = []
  protected getClassesForDataSource: (dataSource: DataSource, index: number) => Classes
  protected position: 'data-point-x' | 'data-point-y' | 'data-point' | 'nearest-data-point'

  protected markers: AutoMarker[] = []
  protected lastNearestDataPoints: HoveredDataPoint[] | null = null
  protected spaceHash = ''

  private composable: ComposableHover | null = null
  private lastPoint: Point | null = null
  private hovered = false

  constructor(protected options: Options = {}) {
    addClasses(this.root, 'hover-markers', options.classes)

    if (options.getClassesForDataSource) this.getClassesForDataSource = options.getClassesForDataSource
    else if (options.classesForDataSource) this.getClassesForDataSource =
      (d: DataSource, index: number) => options.classesForDataSource!.at(index) || []
    else this.getClassesForDataSource = () => []


    if (Array.isArray(options.targetMasks)) this.targetMasks = options.targetMasks
    else if (options.targetMasks) this.targetMasks = [options.targetMasks]

    this.position = options.position ?? 'data-point-x'
  }

  attach(root: SVGGElement, composable: ComposableHover): void {
    root.appendChild(this.root)
    this.composable = composable
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    this.hovered = true
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    for (const marker of this.markers) marker.dispose()
    this.markers = []
    this.lastNearestDataPoints = null
    this.hovered = false
  }

  onHoverMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    this.lastPoint = point
    return this.hovered
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    if (!this.hovered) return

    const composable = this.composable
    const point = this.lastPoint
    if (!composable || !point) return

    let nearestDataPoints: HoveredDataPoint[]

    if (this.position === 'data-point-x') {
      const dp = composable.findNearestByAxis(point, space, 'x', true)
      nearestDataPoints = dp.filter(p => p.xValue === dp[0].xValue)
    } else if (this.position === 'data-point-y') {
      const dp = composable.findNearestByAxis(point, space, 'y', true)
      nearestDataPoints = dp.filter(p => p.yValue === dp[0].yValue)
    } else {
      nearestDataPoints = composable.findNearest(point, space, true)
      if (this.position === 'nearest-data-point' && nearestDataPoints.length > 1) nearestDataPoints = [nearestDataPoints[0]]
    }

    nearestDataPoints = nearestDataPoints.filter(p => p.distance <= (this.options.activateDistance ?? Infinity))

    const spaceHash = space.getHash()
    if (this.spaceHash === spaceHash &&
      this.lastNearestDataPoints &&
      isDataPointArrayEqual(nearestDataPoints, this.lastNearestDataPoints)) return

    this.lastNearestDataPoints = nearestDataPoints
    this.spaceHash = spaceHash

    for (const marker of this.markers) marker.dispose()
    this.markers = []

    for (const dataPoint of nearestDataPoints) {
      const marker = this.createMarker(dataPoint)
      marker.render({ x: dataPoint.xValue, y: dataPoint.yValue }, space)
      this.markers.push(marker)
    }
  }

  protected createMarker(dataPoint: HoveredDataPoint) {
    const classes = this.getClassesForDataSource(dataPoint.dataSource, dataPoint.sourceIndex)

    return new AutoMarker(this.root, this.targetMasks, {
      variant: 'circle',
      size: this.options.size ?? 4,
      maskSize: this.options.maskSize ?? 8,
      markerClasses: joinClasses('hover-marker', this.options.markerClasses, classes),
    })
  }
}