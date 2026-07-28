export class EventEmitter<T> {
  private listeners: ((arg: T) => void)[] = []

  get hasListeners() {
    return this.listeners.length > 0
  }

  on(listener: (arg: T) => void) {
    this.listeners.push(listener)
    return () => this.off(listener)
  }

  once(listener: (arg: T) => void) {
    const off = this.on(arg => {
      off()
      listener(arg)
    })
    return off
  }

  off(listener: (arg: T) => void) {
    const index = this.listeners.indexOf(listener)
    if (index >= 0) this.listeners.splice(index, 1)
  }

  emit(arg: T) {
    if (this.listeners.length === 0) return
    for (const listener of [...this.listeners]) listener(arg)
  }
}
