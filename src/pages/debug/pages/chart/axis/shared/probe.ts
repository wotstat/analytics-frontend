import { shallowRef } from 'vue'
import type { Overflow, Size } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import type { BaseLabels } from '@/shared/uiKit/chart/universalChart/labels/BaseLabels'

export type RenderedLabel = { text: string, p: number }

export type ProbeState = {
  bounds: { minX: number, maxX: number, minY: number, maxY: number }
  layout: { x: number, y: number, width: number, height: number }
  overflow: Overflow
  full: Size
  step: number
  x: RenderedLabel[]
  y: RenderedLabel[]
  xTicks: number[]
  yTicks: number[]
}

// AutoLabels зовёт labelForValue(value, stepIndex) на каждом кандидате-шаге, и последний
// вызов за проход принадлежит победившему шагу. Индекс движок отдаёт именно так — вторым
// аргументом форматтера, который мы же и передаём.
export class StepProbe {
  step = -1

  wrap(format: (value: number, step: number) => string) {
    return (value: number, step: number) => {
      this.step = step
      return format(value, step)
    }
  }
}

// Реально нарисованный текст, а не то, что вернул расчёт: видно и обрезку, и промахи.
export function readRenderedLabels(labels: BaseLabels | null, axis: 'horizontal' | 'vertical'): RenderedLabel[] {
  if (!labels) return []

  const nodes = Array.from(labels.getRootElement().querySelectorAll('text.label'))
  const result: RenderedLabel[] = []

  for (const node of nodes) {
    if (node.classList.contains('probe-label')) continue
    const text = node.textContent ?? ''
    if (!text) continue
    result.push({ text, p: Number(node.getAttribute(axis === 'horizontal' ? 'x' : 'y') ?? 0) })
  }

  return result.sort((a, b) => a.p - b.p)
}

export function useProbe() {
  const state = shallowRef<ProbeState | null>(null)
  let last = ''

  function onRender(next: ProbeState) {
    const key = JSON.stringify(next)
    if (key === last) return
    last = key
    state.value = next
  }

  return { state, onRender }
}
