// Общие заготовки опций подписей, чтобы в секциях оставались только их различия.

import type { Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'

export const Y_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
export const X_STEPS = [1, 2, 5, 10, 25, 50, 100]

export function defaultYLabels(labelForValue: (value: number) => string = value => `${value}`): LabelsOptions {
  return {
    values: steppedOverrides({ step: Y_STEPS, offset: 0 }),
    labelForValue,
    padding: { clip: 10, flow: 5 },
    labelOffset: 5,
    onlyFitted: true,
    strategy: 'classic-flow',
  }
}

export function defaultXLabels(labelForValue: (value: number) => string = value => `${value}`): LabelsOptions {
  return {
    values: steppedOverrides({ step: X_STEPS, offset: 0 }),
    labelForValue,
    padding: 10,
    labelOffset: 5,
    strategy: 'classic-flow',
  }
}
