import { onUnmounted } from 'vue'

export class Disposer {
  private disposers: (() => void)[] = []

  add(...disposers: (() => void)[]): this {
    this.disposers.push(...disposers)
    return this
  }

  dispose(): void {
    for (const d of this.disposers) {
      try {
        d()
      } catch (e) {
        console.error(`Disposer error: ${e}`)
      }
    }
    this.disposers.length = 0
  }
}

export function useDisposer(): Disposer {
  const disposer = new Disposer()
  onUnmounted(() => disposer.dispose())
  return disposer
}