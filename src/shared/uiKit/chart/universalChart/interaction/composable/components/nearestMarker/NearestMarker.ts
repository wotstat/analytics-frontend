import { AutoMarker } from '../../../../plot/markers/autoMarkers/AutoMarkers'
import { Overflow, Size } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { addClasses, removeClasses, Classes, joinClasses } from '../../../../utils/utils'
import { DataSource, HoveredDataPoint, isDataPointArrayEqual } from '../../../BaseDataSourcedInteractionController'
import { InteractionDirection, Position } from '../../../baseInteractionController/BaseInteractionController'
import { InteractionController, InteractionComponent } from '../../InteractionController'
import { HoverResolver } from '../../sync/HoverSynchronizer'



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
  hoverSync?: HoverResolver
}

export class NearestMarker implements InteractionComponent {

  protected root = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  protected options: Options = {}
  protected targetMasks: Element[] = []
  protected getClassesForDataSource: (dataSource: DataSource, index: number) => Classes = () => []
  protected position: 'data-point-x' | 'data-point-y' | 'data-point' | 'nearest-data-point' = 'data-point-x'

  protected markers: AutoMarker[] = []
  protected lastNearestDataPoints: HoveredDataPoint[] | null = null
  protected spaceHash = ''

  private controller: InteractionController | null = null
  private lastPoint: Point | null = null
  private hovered = false

  private onSyncChange = () => this.controller?.scheduleRender()

  constructor(options: Options = {}) {
    this.applyOptions(options)
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    root.appendChild(this.root)
    this.controller = controller
    this.options.hoverSync?.subscribeChange(this.onSyncChange)
  }

  detach(): void {
    this.options.hoverSync?.unsubscribeChange(this.onSyncChange)
    this.clearMarkers()
    this.root.remove()
    this.controller = null
    this.hovered = false
    this.spaceHash = ''
  }

  updateOptions(options: Options) {
    const previousSync = this.options.hoverSync
    if (previousSync !== options.hoverSync) {
      previousSync?.unsubscribeChange(this.onSyncChange)
      if (this.controller) options.hoverSync?.subscribeChange(this.onSyncChange)
    }

    this.applyOptions(options)

    this.clearMarkers()
    this.spaceHash = ''
    this.controller?.scheduleRender()
  }

  private applyOptions(options: Options) {
    if (this.options) removeClasses(this.root, 'hover-markers', this.options.classes)
    this.options = options
    this.position = options.position ?? 'data-point-x'

    if (options.getClassesForDataSource) this.getClassesForDataSource = options.getClassesForDataSource
    else if (options.classesForDataSource) this.getClassesForDataSource =
      (d: DataSource, index: number) => options.classesForDataSource!.at(index) || []
    else this.getClassesForDataSource = () => []

    if (Array.isArray(options.targetMasks)) this.targetMasks = options.targetMasks
    else if (options.targetMasks) this.targetMasks = [options.targetMasks]
    else this.targetMasks = []

    addClasses(this.root, 'hover-markers', options.classes)
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.hovered = true
    this.lastPoint = point
    return true
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.clearMarkers()
    this.hovered = false
    return false
  }

  private clearMarkers(): void {
    for (const marker of this.markers) marker.dispose()
    this.markers = []
    this.lastNearestDataPoints = null
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.lastPoint = point
    return this.hovered
  }

  mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): InteractionDirection {
    const direction = {
      'data-point-x': 'horizontal',
      'data-point-y': 'vertical',
      'data-point': 'all',
      'nearest-data-point': 'all'
    } as const

    return direction[this.position]
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const controller = this.controller
    const point = this.hovered ? this.lastPoint : (this.options.hoverSync?.resolve(space) ?? null)
    if (!controller || !point) {
      this.clearMarkers()
      return
    }

    let nearestDataPoints: HoveredDataPoint[]

    if (this.position === 'data-point-x') {
      const dp = controller.findNearestByAxis(point, space, 'x', true)
      nearestDataPoints = dp.length ? dp.filter(p => p.xValue === dp[0].xValue) : []
    } else if (this.position === 'data-point-y') {
      const dp = controller.findNearestByAxis(point, space, 'y', true)
      nearestDataPoints = dp.length ? dp.filter(p => p.yValue === dp[0].yValue) : []
    } else {
      nearestDataPoints = controller.findNearest(point, space, true)
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