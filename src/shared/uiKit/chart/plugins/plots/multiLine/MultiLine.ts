import './style.scss'

import { ChartDelegate, ChartPlugin } from '../../../Chart'


type Point = { x: number, y: number }
type Options = {
}

class ChartSpace {
  constructor(
    public layout: {
      x: number,
      y: number,
      width: number,
      height: number
    },
    public space: Bounds
  ) { }

  translate(p: Point): Point {
    const { x, y } = p
    const { minX, maxX, minY, maxY } = this.space
    const { x: layoutX, y: layoutY, width: layoutWidth, height: layoutHeight } = this.layout

    const scaleX = layoutWidth / (maxX - minX)
    const scaleY = layoutHeight / (maxY - minY)

    return {
      x: layoutX + (x - minX) * scaleX,
      y: layoutY + (maxY - y) * scaleY
    }
  }
}

class Bounds {
  private dataCount = 0

  constructor(
    public minX: number = Infinity,
    public maxX: number = -Infinity,
    public minY: number = Infinity,
    public maxY: number = -Infinity
  ) { }

  addPoint(p: Point) {
    this.minX = Math.min(this.minX, p.x)
    this.maxX = Math.max(this.maxX, p.x)
    this.minY = Math.min(this.minY, p.y)
    this.maxY = Math.max(this.maxY, p.y)
    this.dataCount++
  }

  addXY(x: number, y: number) {
    this.minX = Math.min(this.minX, x)
    this.maxX = Math.max(this.maxX, x)
    this.minY = Math.min(this.minY, y)
    this.maxY = Math.max(this.maxY, y)
    this.dataCount++
  }

  addX(x: number) {
    this.minX = Math.min(this.minX, x)
    this.maxX = Math.max(this.maxX, x)
    this.dataCount++
  }

  addY(y: number) {
    this.minY = Math.min(this.minY, y)
    this.maxY = Math.max(this.maxY, y)
    this.dataCount++
  }

  extend(bounds: Bounds) {
    this.minX = Math.min(this.minX, bounds.minX)
    this.maxX = Math.max(this.maxX, bounds.maxX)
    this.minY = Math.min(this.minY, bounds.minY)
    this.maxY = Math.max(this.maxY, bounds.maxY)
    this.dataCount += bounds.dataCount
  }

  clone() {
    const clone = new Bounds(this.minX, this.maxX, this.minY, this.maxY)
    clone.dataCount = this.dataCount
    return clone
  }

  isEmpty() {
    return this.dataCount === 0
  }
}

export abstract class Line {
  protected multiLine: MultiLineChart | null = null
  protected bounds: Bounds | null = null
  protected isDirty = true

  protected line = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  constructor(classes: string[] = []) {
    this.line.classList.add('line', ...classes)
  }

  abstract getPointsCount(): number
  abstract getPointAt(index: number): Point | null
  abstract getPointsInBounds(bounds: Bounds): (Point | null)[]

  protected pointsDidChange() {
    this.isDirty = true
    this.bounds = null
    this.multiLine?.dataDidChange()
  }

  attach(root: SVGGElement, multiLine: MultiLineChart) {
    this.multiLine = multiLine
    root.appendChild(this.line)
  }

  detach() {
    this.line.remove()
  }

  getBounds(): Bounds {
    if (this.bounds && !this.bounds.isEmpty()) return this.bounds

    this.bounds = new Bounds()
    const pointsCount = this.getPointsCount()
    for (let i = 0; i < pointsCount; i++) {
      const p = this.getPointAt(i)
      if (p) this.bounds.addPoint(p)
    }
    return this.bounds
  }

  render(translate: (p: Point) => Point, space: Bounds, force: boolean = false) {
    if (!this.isDirty && !force) return

    const points = this.getPointsInBounds(space)

    if (points.length === 0) {
      this.line.setAttribute('d', '')
      return
    }

    let d = ''
    let lastPointIsNull = true
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      if (point === null) {
        lastPointIsNull = true
        continue
      }

      const p = translate(point)
      d += `${lastPointIsNull ? 'M' : 'L'} ${p.x} ${p.y} `
      lastPointIsNull = false
    }

    this.line.setAttribute('d', d)

    this.isDirty = false
  }
}

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

const NAMESPACE = 'http://www.w3.org/2000/svg'
export class MultiLineChart implements ChartPlugin {
  private chartDelegate: ChartDelegate | null = null

  private width = 0
  private height = 0
  private mainSpace = new ChartSpace(
    { x: 0, y: 0, width: 0, height: 0 },
    new Bounds()
  )


  private lines = new Set<Line>()

  private root = document.createElementNS(NAMESPACE, 'g')
  private defs = document.createElementNS(NAMESPACE, 'defs')
  private clipPathRoot = document.createElementNS(NAMESPACE, 'clipPath')
  private plotClipRect = document.createElementNS(NAMESPACE, 'rect')
  private plotRoot = document.createElementNS(NAMESPACE, 'g')
  private nextRenderIsForce = false

  constructor(options: Options) {
    this.root.classList.add('chart-multiline-root')
    this.root.appendChild(this.defs)
    this.defs.appendChild(this.clipPathRoot)
    this.clipPathRoot.appendChild(this.plotClipRect)

    const clipId = `multiline-clip-${Math.random().toString(16).slice(2)}`
    this.clipPathRoot.setAttribute('id', clipId)
    this.plotRoot.setAttribute('clip-path', `url(#${clipId})`)
    this.plotRoot.classList.add('plot')

    this.root.appendChild(this.plotRoot)
  }

  apply(delegate: ChartDelegate): void {
    this.chartDelegate?.removeChild(this.root)
    this.chartDelegate = delegate
    delegate.addChild(this.root)
  }

  addLine(line: Line) {
    this.lines.add(line)
    line.attach(this.plotRoot, this)
  }

  removeLine(line: Line) {
    this.lines.delete(line)
    line.detach()
  }

  dataDidChange() {
    this.chartDelegate?.scheduleRender()
  }

  render() {
    this.recalculateDataBounds()
    this.layoutIfNeeded()
    this.renderLines()
  }

  private layoutIfNeeded() {
    const width = this.chartDelegate?.width() ?? 0
    const height = this.chartDelegate?.height() ?? 0

    if (width !== this.width || height !== this.height) {
      this.width = width
      this.height = height
      this.layout()
    }
  }

  private layout() {
    this.mainSpace.layout = { x: 0, y: 0, width: this.width, height: this.height }

    this.updatePlotSpace()
    this.nextRenderIsForce = true
  }

  private updatePlotSpace() {
    this.plotClipRect.setAttribute('x', this.mainSpace.layout.x.toString())
    this.plotClipRect.setAttribute('y', this.mainSpace.layout.y.toString())
    this.plotClipRect.setAttribute('width', this.mainSpace.layout.width.toString())
    this.plotClipRect.setAttribute('height', this.mainSpace.layout.height.toString())
  }

  private recalculateDataBounds() {
    const bounds = new Bounds()
    for (const line of this.lines) bounds.extend(line.getBounds())
    this.mainSpace.space = bounds
  }

  private renderLines() {
    for (const line of this.lines) {
      line.render(p => this.mainSpace.translate(p), this.mainSpace.space, this.nextRenderIsForce)
    }
    this.nextRenderIsForce = false
  }
}