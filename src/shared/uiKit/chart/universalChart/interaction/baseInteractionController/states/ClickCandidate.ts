const CLICK_MAX_DISTANCE = 4

export class ClickCandidate {
  private active = true

  constructor(
    readonly initialEvent: PointerEvent,
    private readonly isPointerInside: (event: PointerEvent) => boolean,
  ) { }

  get isActive() { return this.active }

  cancel() {
    this.active = false
  }

  move(event: PointerEvent) {
    if (!this.active || event.pointerId !== this.initialEvent.pointerId) return
    if (event.buttons !== 1 || !this.acceptsPosition(event)) this.cancel()
  }

  finish(event: PointerEvent): boolean {
    if (event.pointerId !== this.initialEvent.pointerId) return false
    const clicked = this.active && event.button === 0 && this.acceptsPosition(event)
    this.cancel()
    return clicked
  }

  private acceptsPosition(event: PointerEvent): boolean {
    const accepts = (sample: PointerEvent) =>
      Math.hypot(sample.clientX - this.initialEvent.clientX, sample.clientY - this.initialEvent.clientY) <= CLICK_MAX_DISTANCE
      && this.isPointerInside(sample)

    return accepts(event) && (event.getCoalescedEvents?.() ?? []).every(accepts)
  }
}
