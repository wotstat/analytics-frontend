// Движок не реактивный: состояние осей и подписей достаётся только в момент отрисовки.
// RenderProbe — пустой PlotRenderer, который живёт в чарте ради колбэка render.

import { shallowRef } from 'vue'
import type { Overflow, PlotRenderer, Size } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import type { ChartSpace } from '@/shared/uiKit/chart/universalChart/utils/ChartSpace'
import type { BaseLabels } from '@/shared/uiKit/chart/universalChart/labels/BaseLabels'

export type RenderedLabel = { text: string, p: number }

export type ProbeState = {
  bounds: { minX: number, maxX: number, minY: number, maxY: number }
  layout: { x: number, y: number, width: number, height: number }
  overflow: Overflow
  full: Size
  // Индекс шага из values, на котором подписи наконец поместились. -1 — не определён.
  step: number
  x: RenderedLabel[]
  y: RenderedLabel[]
  xTicks: number[]
  yTicks: number[]
}

export class RenderProbe implements PlotRenderer {
  constructor(private onRender: (space: ChartSpace, overflow: Overflow, full: Size) => void) { }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    this.onRender(space, overflow, full)
  }
}

// AutoLabels зовёт labelForValue(value, stepIndex) на каждом кандидате-шаге, и последний
// вызов за проход — всегда победивший шаг. Другого способа узнать выбранный шаг у API нет.
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

// Состояние меняется только на ресайзе и смене опций, поэтому дешевле сравнить, чем
// дёргать Vue на каждом кадре.
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

export function stepValue(steps: number[], index: number) {
  if (index < 0 || steps.length === 0) return null
  if (index < steps.length) return steps[index]
  // steppedOverrides дописывает к списку 10 удвоений последнего шага, начиная с ×1.
  return steps[steps.length - 1] * Math.pow(2, index - steps.length)
}
