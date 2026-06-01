import { Overflow, PlotRenderer, Size } from '../UniversalChart'
import { BasePlotRenderer } from '../plot/BasePlotRenderer'
import { ChartSpace } from '../utils/ChartSpace'


type AxisVariant = 'space' | 'full'

type Point = { x: number; y: number };
type Line = [Point, Point];

function mergeContinuousLines(lines: Line[]): Point[][] {
  const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

  const remaining = [...lines]
  const result: Point[][] = []

  while (remaining.length > 0) {
    const [start, end] = remaining.shift()!
    const merged: Point[] = [start, end]

    let changed = true

    while (changed) {
      changed = false

      for (let i = 0; i < remaining.length; i++) {
        const [a, b] = remaining[i]

        const first = merged[0]
        const last = merged[merged.length - 1]

        if (samePoint(last, a)) {
          merged.push(b)
        } else if (samePoint(last, b)) {
          merged.push(a)
        } else if (samePoint(first, b)) {
          merged.unshift(a)
        } else if (samePoint(first, a)) {
          merged.unshift(b)
        } else {
          continue
        }

        remaining.splice(i, 1)
        changed = true
        break
      }
    }

    result.push(merged)
  }

  return result
}

export class Axis extends BasePlotRenderer {

  private lines: SVGPathElement[] = []

  constructor(readonly axises: {
    top?: AxisVariant
    right?: AxisVariant
    bottom?: AxisVariant
    left?: AxisVariant
  }) {
    super('chart-axis')
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
    const lines: [{ x: number, y: number }, { x: number, y: number }][] = []

    if (this.axises.top) {
      if (this.axises.top === 'full') lines.push([{ x: 0, y: space.layout.y }, { x: full.width, y: space.layout.y }])
      else lines.push([{ x: space.layout.x, y: space.layout.y }, { x: space.layout.x + space.layout.width, y: space.layout.y }])
    }

    if (this.axises.right) {
      if (this.axises.right === 'full') lines.push([{ x: space.layout.x + space.layout.width, y: 0 }, { x: space.layout.x + space.layout.width, y: full.height }])
      else lines.push([{ x: space.layout.x + space.layout.width, y: space.layout.y }, { x: space.layout.x + space.layout.width, y: space.layout.y + space.layout.height }])
    }

    if (this.axises.bottom) {
      if (this.axises.bottom === 'full') lines.push([{ x: 0, y: space.layout.y + space.layout.height }, { x: full.width, y: space.layout.y + space.layout.height }])
      else lines.push([{ x: space.layout.x, y: space.layout.y + space.layout.height }, { x: space.layout.x + space.layout.width, y: space.layout.y + space.layout.height }])
    }

    if (this.axises.left) {
      if (this.axises.left === 'full') lines.push([{ x: space.layout.x, y: 0 }, { x: space.layout.x, y: full.height }])
      else lines.push([{ x: space.layout.x, y: space.layout.y }, { x: space.layout.x, y: space.layout.y + space.layout.height }])
    }

    const mergedLines = mergeContinuousLines(lines)

    for (const line of this.lines) this.root.removeChild(line)
    this.lines = []

    for (const group of mergedLines) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path')

      const isClosed = group.length > 2 && group[0].x === group[group.length - 1].x && group[0].y === group[group.length - 1].y
      const d = group.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + (isClosed ? 'Z' : '')
      line.setAttribute('d', d)
      this.root.appendChild(line)
      this.lines.push(line)
    }
  }
}