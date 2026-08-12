import { InteractionDirection } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'

export const panDirections = [
  { value: 'horizontal', label: 'horizontal' },
  { value: 'vertical', label: 'vertical' },
  { value: 'all', label: 'all' },
  { value: false, label: 'false (пан выключен)' },
] as const satisfies readonly { value: InteractionDirection, label: string }[]
