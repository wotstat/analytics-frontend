import { ChartSpace } from '../../../../utils/ChartSpace'
import type { Axis } from '../../../../utils/Axis'
import { addClasses, Classes, removeClasses } from '../../../../utils/utils'
import { InteractionFrame } from '../../../core/InteractionFrame'
import type { InteractionBinding, PresentedCoordinate } from '../../../core/InteractionBinding'
import type { InteractionResolver } from '../../../core/InteractionResolver'
import { selectionCoordinates } from '../../../core/utils/selectionBindings'
import { InteractionComponent, InteractionController } from '../../InteractionController'

export type LineBinding = InteractionBinding<number | null | readonly PresentedCoordinate[]>

export type LineOptions = (
  | { selection: InteractionResolver, binding?: never }
  | { binding: LineBinding, selection?: never }
) & {
  classes?: Classes
  offset?: number | { start?: number, end?: number } | [start: number, end: number]
}

function unwrapLineOffset(offset: LineOptions['offset']) {
  if (typeof offset === 'number') return { start: offset, end: offset }
  if (Array.isArray(offset)) return { start: offset[0], end: offset[1] }
  if (offset) return { start: offset.start ?? 0, end: offset.end ?? 0 }
  return { start: 0, end: 0 }
}

export abstract class BaseLine implements InteractionComponent {

  protected readonly root = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  protected offset = { start: 0, end: 0 }

  private options: LineOptions
  private lines: SVGLineElement[] = []
  private coordinates: number[] = []
  private binding: LineBinding | null = null
  private controller: InteractionController | null = null

  constructor(options: LineOptions) {
    this.options = options
    this.offset = unwrapLineOffset(options.offset)
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    if (this.controller && this.controller !== controller) throw new Error('Line interaction is already attached to another controller')
    root.appendChild(this.root)
    this.controller = controller
  }

  detach(): void {
    this.clear()
    this.root.remove()
    this.controller = null
  }

  updateOptions(options: LineOptions) {
    for (const line of this.lines) removeClasses(line, 'hover-line', this.options.classes)
    this.options = options
    this.binding = options.binding ?? null
    this.offset = unwrapLineOffset(options.offset)

    for (const line of this.lines) addClasses(line, 'hover-line', options.classes)

    this.controller?.scheduleRender()
  }

  prepareInteraction(frame: InteractionFrame): void {
    const coordinates: number[] = []
    const seen = new Set<number>()
    if (!this.binding) this.binding = this.options.binding ?? selectionCoordinates(this.options.selection, this.axis)

    const value = this.binding.read(frame)
    const values = typeof value === 'number' ? [value] : value?.map(item => item.value) ?? []

    for (const coordinate of values) {
      if (!Number.isFinite(coordinate) || seen.has(coordinate)) continue
      seen.add(coordinate)
      coordinates.push(coordinate)
    }

    this.coordinates = coordinates
  }

  renderInteraction(frame: InteractionFrame): void {
    if (!this.controller) return

    while (this.lines.length > this.coordinates.length) this.lines.pop()!.remove()
    while (this.lines.length < this.coordinates.length) this.lines.push(this.createLine())

    for (let i = 0; i < this.coordinates.length; i++) this.place(this.lines[i], this.coordinates[i], frame.space)
  }

  private createLine() {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    addClasses(line, 'hover-line', this.options.classes)
    this.root.appendChild(line)
    return line
  }

  private clear() {
    for (const line of this.lines) line.remove()
    this.lines = []
    this.coordinates = []
  }

  protected abstract readonly axis: Axis
  protected abstract place(line: SVGLineElement, coordinate: number, space: ChartSpace): void
}
