import type { CloseOnOutsideWindow, OffsetValue, PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import type { InjectionKey, Ref } from 'vue'

export const openChildPanelsKey: InjectionKey<Ref<number>> = Symbol('open-child-panels')

export type PanelPopoverProps = {
  target: PopoverTarget | null
  title?: string
  density?: 'standard' | 'compact'
  scrollMode?: 'panel' | 'child'
  width?: number
  placement?: PlacementParam
  offset?: OffsetValue
  arrowSize?: number
  closeOnOutsideWindow?: CloseOnOutsideWindow
  scrollbarOffsets?: [number, number]
}
