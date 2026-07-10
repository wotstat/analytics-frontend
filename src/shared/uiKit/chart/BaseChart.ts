import { ChartRenderManager } from './ChartRenderManager'

export default class BaseChart {

  protected root: HTMLElement | null = null
  protected readonly svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  protected readonly size = { width: 0, height: 0 }

  private renderCallScheduler: number | null = null
  private lastViewportSize = { width: 0, height: 0 }

  constructor(readonly manager: ChartRenderManager) {
    this.svg.style.position = 'absolute'
  }

  attach(element: HTMLElement) {
    this.root?.removeChild(this.svg)
    if (this.root) this.manager.resizeUnobserve(this.root)

    this.root = element
    this.root.appendChild(this.svg)
    this.manager.resizeObserve(this.root, (entry, observer) => this.onResize(entry, observer), (step) => this.render(step))

    this.didMount()

    this.manager.scheduleMicroTask(step => {
      if (step == 0) {
        const rect = this.root?.getClientRects()[0]
        if (!rect) return
        this.size.width = rect.width
        this.size.height = rect.height
      }
      this.render(step)
    })
  }

  dispose() {
    this.root?.removeChild(this.svg)
    if (this.root) this.manager.resizeUnobserve(this.root)
  }

  scheduleRender() {
    if (this.renderCallScheduler != null) return

    this.renderCallScheduler = this.manager.scheduleAnimationFrame(step => {
      if (step == 0) this.renderCallScheduler = null
      this.render(step)
    })
  }

  protected onResize(entry: ResizeObserverEntry, observer: ResizeObserver) {
    const { contentRect } = entry
    if (this.size.width === contentRect.width && this.size.height === contentRect.height) return
    this.size.width = contentRect.width
    this.size.height = contentRect.height
  }

  private render(step: number = 0) {
    if (this.size.width === 0 || this.size.height === 0) return
    this.renderImpl(step)
  }

  protected mutateViewBox() {
    if (this.lastViewportSize.width === this.size.width && this.lastViewportSize.height === this.size.height) return
    this.lastViewportSize.width = this.size.width
    this.lastViewportSize.height = this.size.height
    this.svg.setAttribute('viewBox', `0 0 ${this.size.width} ${this.size.height}`)
    this.svg.setAttribute('width', `${this.size.width}px`)
    this.svg.setAttribute('height', `${this.size.height}px`)
  }

  protected renderImpl(step: number) { }
  protected didMount() { }
}