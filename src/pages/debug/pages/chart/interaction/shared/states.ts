import { BaseState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/BaseState'
import { StartState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/StartState'
import { MouseHoverState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/MouseHoverState'
import { MousePanState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/MousePanState'
import { MousePressState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/MousePressState'
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
    note: 'Мышь входит в зону → MouseHoverState, без проверки mayHover. pointerdown пальцем запускает ожидание жеста даже без pan/hover, чтобы работал клик.',
  },
  {
    name: 'MouseHoverState',
    input: 'мышь',
    enter: 'pointerenter не-тач указателем',
    note: 'Ховер и колесо. При разрешённом пане мышь на pointerdown сразу уходит в MousePanState; без пана и для пера — в MousePressState.',
  },
  {
    name: 'MousePressState',
    input: 'мышь / перо',
    enter: 'pointerdown в MouseHoverState',
    note: 'Клик при отключённом пане или ожидание направления движения пера. Перо запускает пан первым движением в разрешённую сторону. Без пана смещение дальше 4 px отменяет клик.',
  },
  {
    name: 'MousePanState',
    input: 'мышь',
    enter: 'pointerdown мышью или первое движение пера',
    note: 'Пан начинается сразу. Ховер продолжает обновляться вместе с паном. Отпускание возвращает прошлый MouseHoverState и даёт click, если за всё нажатие смещение не превысило 4 px.',
  },
  {
    name: 'AwaitingTouchPanOrHover',
    input: 'палец',
    enter: 'касание в StartState',
    note: 'Отпускание до таймаута без смещения больше 4 px даёт click. Пан начинается первым движением в разрешённую сторону. Таймаут до ховера: 200 мс если пан разрешён, иначе 75 мс. Второй палец отменяет клик.',
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
    note: 'Пан пальцем без порога расстояния. При смещении до 4 px от исходного касания отпускание также даёт click; после пинча клика нет.',
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
  if (state instanceof MousePressState) return 'MousePressState'
  if (state instanceof MouseHoverState) return 'MouseHoverState'
  if (state instanceof AwaitingTouchPanOrHover) return 'AwaitingTouchPanOrHover'
  if (state instanceof TouchZoomState) return 'TouchZoomState'
  if (state instanceof TouchPanState) return 'TouchPanState'
  if (state instanceof TouchHoverState) return 'TouchHoverState'
  if (state instanceof StartState) return 'StartState'
  return 'StartState'
}
