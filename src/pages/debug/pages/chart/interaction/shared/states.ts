import { BaseState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/BaseState'
import { StartState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/StartState'
import { MouseHoverState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/MouseHoverState'
import { MousePanState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/MousePanState'
import { AwaitingTouchPanOrHover } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/AwaitingTouchPanOrHover'
import { TouchHoverState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/touch/TouchHoverState'
import { TouchPanState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/touch/TouchPanState'
import { TouchZoomState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/touch/TouchZoomState'

// Имя класса брать нельзя: минификатор его переименует. Определяем состояние по instanceof.
export const stateList = [
  {
    name: 'StartState',
    input: 'общее',
    enter: 'старт и любой выход указателя за пределы зоны',
    note: 'Мышь входит в зону → сразу MouseHoverState, без проверки mayHover. Палец — только если хоть один компонент разрешил mayPan или mayHover.',
  },
  {
    name: 'MouseHoverState',
    input: 'мышь',
    enter: 'pointerenter не-тач указателем',
    note: 'Ховер и колесо. pointerdown левой кнопкой при mayPan сразу уводит в пан: порога расстояния для мыши нет.',
  },
  {
    name: 'MousePanState',
    input: 'мышь',
    enter: 'pointerdown в MouseHoverState',
    note: 'Пан с захватом указателя. Ховер продолжает обновляться вместе с паном. Отпускание возвращает прошлый MouseHoverState через returnToState.',
  },
  {
    name: 'AwaitingTouchPanOrHover',
    input: 'палец',
    enter: 'касание в StartState',
    note: 'Распознавание жеста. Таймаут до ховера: 200 мс если пан разрешён, иначе 75 мс. Порог движения — 0 px, поэтому сдвиг пальца до таймаута уводит в пан.',
  },
  {
    name: 'TouchHoverState',
    input: 'палец',
    enter: 'таймаут в AwaitingTouchPanOrHover',
    note: 'Ховер пальцем. Второе касание переводит в пинч.',
  },
  {
    name: 'TouchPanState',
    input: 'палец',
    enter: 'движение в AwaitingTouchPanOrHover или снятие пальца с пинча',
    note: 'Пан пальцем. Ховер при этом не работает — это либо одно, либо другое.',
  },
  {
    name: 'TouchZoomState',
    input: 'палец',
    enter: 'второе касание в любом одно-пальцевом состоянии',
    note: 'Пинч. Третий палец копится в запасных и подхватывается, когда отпускают один из активных. Снятие до одного пальца уводит в пан, а не в ховер.',
  },
] as const

export type StateName = typeof stateList[number]['name']

export function stateName(state: BaseState): StateName {
  if (state instanceof MousePanState) return 'MousePanState'
  if (state instanceof MouseHoverState) return 'MouseHoverState'
  if (state instanceof AwaitingTouchPanOrHover) return 'AwaitingTouchPanOrHover'
  if (state instanceof TouchZoomState) return 'TouchZoomState'
  if (state instanceof TouchPanState) return 'TouchPanState'
  if (state instanceof TouchHoverState) return 'TouchHoverState'
  if (state instanceof StartState) return 'StartState'
  return 'StartState'
}
