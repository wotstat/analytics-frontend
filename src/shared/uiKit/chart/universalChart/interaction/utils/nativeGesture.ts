export type NativeGestureEvent = UIEvent & {
  scale: number
  clientX: number
  clientY: number
}

// Safari also emits GestureEvent for touchscreen pinches on iOS/iPadOS.
// Only desktop macOS gestures are evidence of a trackpad.
export function isTrackpadGesture(event: Event): event is NativeGestureEvent {
  return typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac') &&
    navigator.maxTouchPoints === 0 && 'scale' in event &&
    typeof event.scale === 'number' && Number.isFinite(event.scale) && event.scale > 0
}
