
export interface ChartPlugin {
  apply?(delegate: ChartDelegate): void
  render?(): void
}

export interface ChartDelegate {
  addPlugin(plugin: ChartPlugin): void
  addChild(element: SVGElement): void
  removeChild(element: SVGElement): void
  scheduleRender(): void
  width(): number
  height(): number
}

export interface ChartSpace {
  setup(params: {
    top: number,
    left: number,
    width: number,
    height: number,
    paddingTop: number,
    paddingLeft: number,
    paddingRight: number,
    paddingBottom: number
  }): void
}

export class Chart {

  private root: HTMLElement | null = null
  private readonly svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  private readonly plugins: ChartPlugin[] = []

  private readonly resizeObserver = new ResizeObserver((entries, observer) => this.onResize(entries, observer))

  private rerenderScheduled = new Set<ChartPlugin>()
  private renderCallScheduler: number | null = null
  private readonly size = { width: 0, height: 0 }

  constructor() {
    this.svg.style.position = 'absolute'
  }

  public attach(root: HTMLElement) {
    this.root?.removeChild(this.svg)
    if (this.root) this.resizeObserver.unobserve(this.root)

    this.root = root
    this.root.appendChild(this.svg)
    this.resizeObserver.observe(this.root)
    const rect = this.root.getClientRects()[0]
    this.resize(rect.width, rect.height)
  }

  public addPlugin(plugin: ChartPlugin) {
    this.plugins.push(plugin)

    plugin.apply?.(this.createDelegate(plugin))

    this.scheduleRender(plugin)
    return this
  }

  private onResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
    if (entries.length === 0) return
    const { contentRect } = entries[0]
    this.resize(contentRect.width, contentRect.height)
  }

  private resize(width: number, height: number) {
    if (this.size.width === width && this.size.height === height) return
    this.size.width = width
    this.size.height = height
    this.svg.setAttribute('viewBox', `0 0 ${this.size.width} ${this.size.height}`)
    this.render(true)
  }

  private createDelegate(plugin: ChartPlugin): ChartDelegate {
    return {
      addPlugin: (plugin: ChartPlugin) => this.addPlugin(plugin),
      scheduleRender: () => this.scheduleRender(plugin),
      addChild: (element: SVGElement) => this.addChild(element),
      removeChild: (element: SVGElement) => this.removeChild(element),
      width: () => this.size.width,
      height: () => this.size.height,
    }
  }

  private addChild(element: SVGElement) {
    this.svg.appendChild(element)
  }

  private removeChild(element: SVGElement) {
    this.svg.removeChild(element)
  }

  private scheduleRender(plugin: ChartPlugin) {
    this.rerenderScheduled.add(plugin)
    this.renderOnNextFrame()
  }

  private renderOnNextFrame() {
    if (this.renderCallScheduler != null) return
    this.renderCallScheduler = requestAnimationFrame(() => {
      this.renderCallScheduler = null
      this.render()
    })
  }

  private render(all: boolean = false) {
    if (this.size.width === 0 || this.size.height === 0) return

    if (this.renderCallScheduler != null) {
      cancelAnimationFrame(this.renderCallScheduler)
      this.renderCallScheduler = null
    }

    for (const plugin of this.plugins) {
      if (this.rerenderScheduled.has(plugin) || all) {
        plugin.render?.()
        this.rerenderScheduled.delete(plugin)
      }
    }
    this.rerenderScheduled.clear()
  }
}