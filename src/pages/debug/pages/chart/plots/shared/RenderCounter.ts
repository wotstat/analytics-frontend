import type { PlotRenderer } from '@/shared/uiKit/chart/universalChart/UniversalChart'

// Все методы PlotRenderer необязательные, поэтому счётчик проходов рендера —
// это плот без единого элемента в DOM.
export class RenderCounter implements PlotRenderer {
  count = 0

  render() {
    this.count++
  }
}
