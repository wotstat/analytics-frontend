export default class BaseChart {

  protected root: HTMLElement | null = null
  protected readonly svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  protected readonly size = { width: 0, height: 0 }

  private readonly resizeObserver = new ResizeObserver((entries, observer) => this.onResize(entries, observer))
  private renderCallScheduler: number | null = null

  constructor() {
    this.svg.style.position = 'absolute'
  }

  attach(element: HTMLElement) {
    this.root?.removeChild(this.svg)
    if (this.root) this.resizeObserver.unobserve(this.root)

    this.root = element
    this.root.appendChild(this.svg)
    this.resizeObserver.observe(this.root)
    const rect = this.root.getClientRects()[0]
    this.resize(rect.width, rect.height)
  }

  scheduleRender() {
    if (this.renderCallScheduler != null) return
    this.renderCallScheduler = requestAnimationFrame(() => {
      this.renderCallScheduler = null
      this.render()
    })
  }

  protected onResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
    if (entries.length === 0) return
    const { contentRect } = entries[0]
    this.resize(contentRect.width, contentRect.height)
  }

  protected resize(width: number, height: number) {
    if (this.size.width === width && this.size.height === height) return
    this.size.width = width
    this.size.height = height
    this.svg.setAttribute('viewBox', `0 0 ${this.size.width} ${this.size.height}`)
    this.svg.setAttribute('width', `${this.size.width}px`)
    this.svg.setAttribute('height', `${this.size.height}px`)
    this.render()
  }

  private render() {
    if (this.size.width === 0 || this.size.height === 0) return

    if (this.renderCallScheduler != null) {
      cancelAnimationFrame(this.renderCallScheduler)
      this.renderCallScheduler = null
    }

    this.renderImpl()
  }

  protected renderImpl() { }
}