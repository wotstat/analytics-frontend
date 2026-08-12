import { Overflow, Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BaseInteractionController, InteractionDirection, Position, TouchZoomPoint } from '../baseInteractionController/BaseInteractionController'
import { InteractionFrame } from '../core/InteractionFrame'
import { InteractionInput, InteractionPointer } from '../core/InteractionInput'

export interface InteractionComponent {
  attach?(root: SVGGElement, controller: InteractionController): void
  detach?(controller: InteractionController): void
  onBeforeLayout?(space: ChartSpace, full: Size): void
  render?(space: ChartSpace, overflow: Overflow, full: Size): void
  didLayout?(space: ChartSpace, full: Size): void

  prepareInteraction?(frame: InteractionFrame): void
  renderInteraction?(frame: InteractionFrame): void

  mayHover?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): InteractionDirection
  onHoverBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean
  onHoverUpdate?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean
  onHoverEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean

  mayPan?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): InteractionDirection
  onPanBegin?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean
  onPanUpdate?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean
  onPanEnd?(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean

  mayTouchZoom?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, controller: InteractionController): InteractionDirection
  onTouchZoomBegin?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, controller: InteractionController): boolean
  onTouchZoomUpdate?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, controller: InteractionController): boolean
  onTouchZoomEnd?(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, controller: InteractionController): boolean

  onWheelZoom?(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number, controller: InteractionController): boolean
}

// `own` — вклад самого контроллера, объединяется с компонентами по тем же правилам
function processInteractionDirection(components: InteractionComponent[], getter: (c: InteractionComponent) => InteractionDirection | undefined, own: InteractionDirection = false): InteractionDirection {
  if (own === 'all') return 'all'

  let vertical = own === 'vertical'
  let horizontal = own === 'horizontal'

  for (const component of components) {
    const dir = getter(component)
    if (!dir) continue
    if (dir === 'all') return 'all'
    if (dir === 'horizontal') horizontal = true
    if (dir === 'vertical') vertical = true
    if (horizontal && vertical) return 'all'
  }

  return horizontal ? (vertical ? 'all' : 'horizontal') : (vertical ? 'vertical' : false)
}

function processInteractionBoolean(components: InteractionComponent[], getter: (c: InteractionComponent) => boolean | undefined, own: boolean = false): boolean {
  let shouldRender = own
  for (const component of components) {
    const result = getter(component)
    shouldRender ||= result ?? false
  }

  return shouldRender
}

export class InteractionController extends BaseInteractionController {

  private readonly componentsRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  private components: InteractionComponent[] = []

  private readonly localInputKey: symbol = Symbol('localInput')
  private localPointer: InteractionPointer | null = null

  constructor(classes: Classes = [], options: { affectsBounds?: boolean } = {}) {
    super(classes, options)

    this.componentsRoot.classList.add('hover-components')
    this.root.appendChild(this.componentsRoot)
  }

  get localInput(): InteractionInput {
    return { key: this.localInputKey, pointer: this.localPointer }
  }

  detach(): void {
    super.detach()
    for (const component of this.components) component.detach?.(this)
    this.components = []
    this.localPointer = null
  }

  addComponent(component: InteractionComponent) {
    this.components.push(component)
    component.attach?.(this.componentsRoot, this)
    this.requestRender()

    return this
  }

  removeComponent(component: InteractionComponent) {
    this.components = this.components.filter(c => c !== component)
    component.detach?.(this)
    this.requestRender()
    return this
  }

  scheduleRender() {
    this.requestRender()
  }

  private get hasInteractionComponents(): boolean {
    return this.components.some(c => c.prepareInteraction || c.renderInteraction)
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    this.renderImpl(space, overflow, full)
  }

  protected onBeforeLayout(space: ChartSpace, full: Size): void {
    super.onBeforeLayout(space, full)
    for (const component of this.components) component.onBeforeLayout?.(space, full)
  }

  protected onRender(space: ChartSpace, overflow: Overflow, full: Size): void {
    super.onRender(space, overflow, full)

    const components = [...this.components]

    for (const component of components) component.render?.(space, overflow, full)

    const frame = new InteractionFrame(space, this.localInput)
    for (const component of components) component.prepareInteraction?.(frame)
    for (const component of components) component.renderInteraction?.(frame)
  }

  didLayout(space: ChartSpace, full: Size): void {
    super.didLayout(space, full)
    for (const component of this.components) component.didLayout?.(space, full)
  }

  //#region Hover

  protected mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection {
    return processInteractionDirection(this.components, c => c.mayHover?.(cursor, point, space, isTouch, this), this.hasInteractionComponents ? 'all' : false)
  }

  protected onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.localPointer = { point, cursor, isTouch }
    return processInteractionBoolean(this.components, c => c.onHoverBegin?.(cursor, point, space, isTouch, this), this.hasInteractionComponents)
  }

  protected onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.localPointer = { point, cursor, isTouch }
    return processInteractionBoolean(this.components, c => c.onHoverUpdate?.(cursor, point, space, isTouch, this), this.hasInteractionComponents)
  }

  protected onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.localPointer = null
    return processInteractionBoolean(this.components, c => c.onHoverEnd?.(cursor, point, space, isTouch, this), this.hasInteractionComponents)
  }

  //#endregion

  //#region Pan

  protected mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): InteractionDirection {
    return processInteractionDirection(this.components, component => component.mayPan?.(cursor, point, space, isTouch, this) ?? false)
  }

  protected onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onPanBegin(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, component => component.onPanBegin?.(cursor, point, space, isTouch, this))
  }

  protected onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onPanUpdate(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, component => component.onPanUpdate?.(cursor, point, space, isTouch, this))
  }

  protected onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    super.onPanEnd(cursor, point, space, isTouch)
    return processInteractionBoolean(this.components, component => component.onPanEnd?.(cursor, point, space, isTouch, this))
  }

  //#endregion

  //#region Touch Zoom

  protected mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): InteractionDirection {
    return processInteractionDirection(this.components, component => component.mayTouchZoom?.(first, second, space, this) ?? false)
  }

  protected onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    super.onTouchZoomBegin(first, second, space)
    return processInteractionBoolean(this.components, component => component.onTouchZoomBegin?.(first, second, space, this))
  }

  protected onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    super.onTouchZoomUpdate(first, second, space)
    return processInteractionBoolean(this.components, component => component.onTouchZoomUpdate?.(first, second, space, this))
  }

  protected onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    super.onTouchZoomEnd(first, second, space)
    return processInteractionBoolean(this.components, component => component.onTouchZoomEnd?.(first, second, space, this))
  }

  //#endregion

  //#region Wheel Zoom

  protected onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean {
    super.onWheelZoom(cursor, point, space, deltaY, deltaX)
    return processInteractionBoolean(this.components, component => component.onWheelZoom?.(cursor, point, space, deltaY, deltaX, this))
  }

  //#endregion

}
