import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'


export function afterRender(chart: UniversalChart, callback: () => void) {
  const lastStep = chart.manager.steps - 1
  chart.manager.scheduleAnimationFrame(step => { if (step === lastStep) callback() })
}

export function pathInfo(root: Element | null | undefined, selector = 'path.line') {
  const d = root?.querySelector(selector)?.getAttribute('d') ?? ''
  return {
    length: d.length,
    curves: (d.match(/C/g) ?? []).length,
    lines: (d.match(/L/g) ?? []).length,
    moves: (d.match(/M/g) ?? []).length,
  }
}

export type PathInfo = ReturnType<typeof pathInfo>
