export function openByPointer(element: HTMLElement | null | undefined) {
  element?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
}

export function closeByPointer(element: HTMLElement | null | undefined) {
  element?.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
}
