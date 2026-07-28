export type ArrowDirection = 'top' | 'bottom' | 'left' | 'right'

const opposite: Record<ArrowDirection, ArrowDirection> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export function placementSideByArrow(direction?: ArrowDirection) {
  return direction ? opposite[direction] : '—'
}
