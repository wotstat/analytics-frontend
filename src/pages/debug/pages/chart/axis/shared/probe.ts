import { shallowRef } from 'vue'
import type { Overflow, Size } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import type { BaseLabels } from '@/shared/uiKit/chart/universalChart/labels/BaseLabels'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import type { BaseTicks } from '@/shared/uiKit/chart/universalChart/ticks/BaseTicks'

export type RenderedLabel = { text: string, p: number }

// Уровень composite-тиков: значения — из итога кадра, классы и число линий — из DOM.
// `values` больше, чем `lines`: расчёт не знает про отсечение по краям области.
export type TickLevelProbe = {
  index: number
  classes: string[]
  values: number[]
  lines: number
}

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
  xLevels: TickLevelProbe[]
  yLevels: TickLevelProbe[]
}

// AutoLabels зовёт labelForValue(value, stepIndex) на каждом кандидате-шаге, и последний
// вызов за проход принадлежит победившему шагу. Отдельного геттера у движка нет: индекс
// нужен только стенду, а обвешивать им итог кадра ради дебага незачем.
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

export function readTickLevels(labels: BaseLabels | null, ticks: BaseTicks | TicksByLabels | null): TickLevelProbe[] {
  if (!labels || !(ticks instanceof TicksByLabels)) return []

  const root = ticks.getRootElement()

  return labels.getTickLevels().map((level, index) => {
    const group = root.querySelector(`g.tick-level-${index}`)
    return {
      index,
      classes: group ? Array.from(group.classList) : [],
      values: [...level.values],
      lines: group?.querySelectorAll('line').length ?? 0,
    }
  })
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
