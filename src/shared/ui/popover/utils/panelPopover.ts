import { spring } from 'motion'
import type { CloseOnOutsideWindow, OffsetValue, PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import type { InjectionKey, Ref } from 'vue'

export const openChildPanelsKey: InjectionKey<Ref<number>> = Symbol('open-child-panels')
export const panelEnterSpring = spring({ keyframes: [0, 1], duration: 250, bounce: 0.25 }).toString()

export type PanelPopoverProps = {
  target: PopoverTarget | null
  title?: string
  density?: 'standard' | 'compact'
  scrollMode?: 'panel' | 'child'
  width?: number
  scaleWidthOffset?: number
  placement?: PlacementParam
  offset?: OffsetValue
  arrowSize?: number
  closeOnOutsideWindow?: CloseOnOutsideWindow
  scrollbarOffsets?: [number, number]
}
