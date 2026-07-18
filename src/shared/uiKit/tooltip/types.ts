import type { OffsetValue, PlacementParam, PlacementWithModifiers } from '../popover/utils'


/**
 * Эти типы намеренно вынесены в модуль без зависимостей от Vue, потому что
 * global-directives.d.ts импортирует их для строгой проверки шаблонов. Импорт
 * tooltip.ts или textTooltip.ts оттуда протягивает дженерики ObjectDirective/VNode
 * во все SFC и ломает вывод типов для generic-компонентов, например vue-chartjs.
 */
export type DefineTooltipProps = {
  offset?: OffsetValue
  placement?: PlacementParam
  arrowSize?: number,
  viewportOffset?: OffsetValue
  class?: string | Record<string, boolean> | (string | Record<string, boolean>)[]
}

export type TextTooltipValue = string | DefineTooltipProps & {
  text: string
}

export type TooltipModifier = 'instant' | 'interactive' | PlacementWithModifiers
