import { InteractionDirection } from '../BaseInteractionController'

export function isPrimaryPress(event: PointerEvent): boolean {
  return event.isPrimary && event.button === 0 && event.buttons === 1
}

export function allowDirection(direction: InteractionDirection, dx: number, dy: number): boolean {
  if (direction === 'all') return true
  if (direction === 'horizontal') return Math.abs(dx) > Math.abs(dy)
  if (direction === 'vertical') return Math.abs(dy) > Math.abs(dx)
  return false
}
