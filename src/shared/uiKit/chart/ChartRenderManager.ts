type Handler = (step: number) => void
type ResizeHandler = (entry: ResizeObserverEntry, observer: ResizeObserver) => void

export class ChartRenderManager {

  private readonly resizeObserver = new ResizeObserver((entries, observer) => this.onResize(entries, observer))

  private nextHandlerId = 1

  private animationFrameHandlers = new Map<number, Handler>()
  private microTaskHandlers = new Map<number, Handler>()

  private resizeHandlers = new Map<HTMLElement, { resize: ResizeHandler, render: Handler }>()

  private animationFromHandle: number | null = null
  private microTaskHandle: number | null = null

  constructor(readonly steps: number = 2, readonly performanceMarks: boolean = false) { }

  scheduleAnimationFrame(callback: Handler) {
    this.nextHandlerId++
    this.animationFrameHandlers.set(this.nextHandlerId, callback)
    this.requestRender()
    return this.nextHandlerId
  }

  scheduleMicroTask(callback: Handler) {
    this.nextHandlerId++
    this.microTaskHandlers.set(this.nextHandlerId, callback)
    this.requestMicroTask()
    return this.nextHandlerId
  }

  renderImmediately(callback: Handler) {
    const handlers = [callback]
    this.callHandlers(handlers, 'Imm')
  }

  cancel(handlerId: number) {
    this.animationFrameHandlers.delete(handlerId)
    this.microTaskHandlers.delete(handlerId)
    return false
  }

  resizeObserve(root: HTMLElement, onResize: ResizeHandler, render: Handler) {
    this.resizeHandlers.set(root, { resize: onResize, render })
    this.resizeObserver.observe(root)
  }

  resizeUnobserve(root: HTMLElement) {
    this.resizeObserver.unobserve(root)
    this.resizeHandlers.delete(root)
  }

  private requestRender() {
    if (this.animationFromHandle) return
    this.animationFromHandle = requestAnimationFrame(this.animationFrame.bind(this))
  }

  private requestMicroTask() {
    if (this.microTaskHandle) return
    this.microTaskHandle = 1
    queueMicrotask(() => {
      this.microTaskHandle = null
      this.microTask()
    })
  }

  private microTask() {
    const handlers = [...this.microTaskHandlers.values()]
    this.microTaskHandlers.clear()
    this.callHandlers(handlers, 'Mic')
  }

  private animationFrame() {
    this.animationFromHandle = null

    const handlers = [...this.animationFrameHandlers.values()]
    this.animationFrameHandlers.clear()
    this.callHandlers(handlers, 'AF')
  }

  private callHandlers(handlers: Handler[], prefix: string = 'MS') {
    if (!this.performanceMarks) {
      for (let step = 0; step < this.steps; step++) {
        for (const handler of handlers) handler(step)
      }
    } else {
      performance.mark(`${prefix}: Start`)
      for (let step = 0; step < this.steps; step++) {
        performance.mark(`${prefix}: Step ${step} start`)
        for (const handler of handlers) handler(step)
        performance.mark(`${prefix}: Step ${step} end`)
        performance.measure(`${prefix}: Step ${step}`, `${prefix}: Step ${step} start`, `${prefix}: Step ${step} end`)
      }
      performance.mark(`${prefix}: End`)
      performance.measure(`${prefix}: Total`, `${prefix}: Start`, `${prefix}: End`)
    }
  }

  private onResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
    const handlers = []
    for (const entry of entries) {
      const root = entry.target as HTMLElement
      const handler = this.resizeHandlers.get(root)
      if (!handler) continue
      handler.resize(entry, observer)
      handlers.push(handler.render)
    }
    this.callHandlers(handlers, 'AR')
  }
}