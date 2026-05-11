import { ChartDelegate, ChartPlugin, ChartSpace } from '../../../Chart'

const slots = ['full', 'main', 'top', 'left', 'right', 'bottom'] as const
type Slot = typeof slots[number]

export interface SizeRequestable {
  requestPreferredSize(width: number, height: number): { width: number | null, height: number | null }
}

function isSizeRequester(plugin: unknown): plugin is SizeRequestable {
  return (plugin as SizeRequestable).requestPreferredSize !== undefined
}

function calculateSize(requestables: Set<SizeRequestable>, width: number, height: number, defaultSize: { width: number, height: number }) {
  if (requestables.size === 0) return defaultSize

  let maxWidth = defaultSize.width
  let maxHeight = defaultSize.height

  for (const requestable of requestables) {
    const { width: requestedWidth, height: requestedHeight } = requestable.requestPreferredSize(width, height)

    if (requestedWidth !== null && requestedWidth > maxWidth) maxWidth = requestedWidth
    if (requestedHeight !== null && requestedHeight > maxHeight) maxHeight = requestedHeight
  }

  return { width: maxWidth, height: maxHeight }
}

type Options = {
  defaultPaddings?: {
    top?: number,
    left?: number,
    right?: number,
    bottom?: number,
  }
}

export class BasicLayout implements ChartPlugin {
  private delegate: ChartDelegate | null = null
  private chartPlugins: ChartPlugin[] = []
  private _defaultPaddings = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }

  private slots: Record<Slot, Set<ChartSpace>> = {
    full: new Set(), main: new Set(), top: new Set(), left: new Set(), right: new Set(), bottom: new Set(),
  }
  private slotSizeRequestable: Record<Slot, Set<SizeRequestable>> = {
    full: new Set(), main: new Set(), top: new Set(), left: new Set(), right: new Set(), bottom: new Set(),
  }

  protected chartWidth = 0
  protected chartHeight = 0

  constructor(settings: Options = {}) {
    if (settings.defaultPaddings) {
      this._defaultPaddings = { ...this._defaultPaddings, ...settings.defaultPaddings }
    }
  }

  get defaultPaddings() {
    return this._defaultPaddings
  }

  set defaultPaddings(paddings: { top?: number, left?: number, right?: number, bottom?: number }) {
    this._defaultPaddings = { ...this._defaultPaddings, ...paddings }
    this.delegate?.scheduleRender()
  }

  apply(delegate: ChartDelegate): void {
    this.delegate = delegate
    for (const plugin of this.chartPlugins) {
      this.delegate.addPlugin(plugin)
    }
  }

  render() {
    if (!this.delegate) return

    const width = this.delegate.width() ?? 0
    const height = this.delegate.height() ?? 0

    if (this.chartWidth !== width || this.chartHeight !== height) {
      this.chartWidth = width
      this.chartHeight = height
      this.layout()
    }
  }

  protected layout() {
    const spaceParams = {
      top: 0,
      left: 0,
      width: this.chartWidth,
      height: this.chartHeight,
      paddingTop: 0,
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 0,
    }

    for (const space of this.slots.full) space.setup(spaceParams)

    const topSize = calculateSize(this.slotSizeRequestable.top, this.chartWidth, this.chartHeight, { width: 0, height: this._defaultPaddings.top })
    const bottomSize = calculateSize(this.slotSizeRequestable.bottom, this.chartWidth, this.chartHeight, { width: 0, height: this._defaultPaddings.bottom })
    const leftSize = calculateSize(this.slotSizeRequestable.left, this.chartWidth, this.chartHeight, { width: this._defaultPaddings.left, height: 0 })
    const rightSize = calculateSize(this.slotSizeRequestable.right, this.chartWidth, this.chartHeight, { width: this._defaultPaddings.right, height: 0 })

    for (const element of this.slots.top)
      element.setup({ ...spaceParams, height: topSize.height, paddingTop: 0, paddingBottom: 0, paddingLeft: leftSize.width, paddingRight: rightSize.width })
    for (const element of this.slots.bottom)
      element.setup({ ...spaceParams, top: this.chartHeight - bottomSize.height, height: bottomSize.height, paddingTop: 0, paddingBottom: 0, paddingLeft: leftSize.width, paddingRight: rightSize.width })
    for (const element of this.slots.left)
      element.setup({ ...spaceParams, width: leftSize.width, paddingTop: topSize.height, paddingBottom: bottomSize.height, paddingLeft: 0, paddingRight: 0 })
    for (const element of this.slots.right)
      element.setup({ ...spaceParams, left: this.chartWidth - rightSize.width, width: rightSize.width, paddingTop: topSize.height, paddingBottom: bottomSize.height, paddingLeft: 0, paddingRight: 0 })

    const mainTop = topSize.height
    const mainLeft = leftSize.width
    const mainWidth = this.chartWidth - leftSize.width - rightSize.width
    const mainHeight = this.chartHeight - topSize.height - bottomSize.height

    for (const element of this.slots.main)
      element.setup({ ...spaceParams, top: mainTop, left: mainLeft, width: mainWidth, height: mainHeight, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 })

  }

  addSpace(space: ChartSpace, slot: Slot = 'main') {
    this.slots[slot].add(space)
    if (isSizeRequester(space)) this.slotSizeRequestable[slot].add(space)
    return this
  }

  addSpacedPlugin(plugin: ChartPlugin & ChartSpace, slot: Slot = 'main') {
    this.addSpace(plugin, slot)
    this.chartPlugins.push(plugin)
    this.delegate?.addPlugin(plugin)

    return this
  }
}