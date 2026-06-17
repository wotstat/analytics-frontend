

export type Classes = string | string[]

export function classNames(...classes: (Classes | false | null | undefined)[]): string[] {
  const result: string[] = []
  for (const cls of classes) {
    if (!cls) continue
    if (typeof cls === 'string') {
      result.push(...cls.split(/\s+/).flatMap(t => t.split('.')).filter(Boolean))
    } else if (Array.isArray(cls)) {
      result.push(...cls.flatMap(c => classNames(c)))
    }
  }
  return result
}

export function joinClasses(...classes: (Classes | false | null | undefined)[]): Classes {
  return classNames(...classes).join(' ')
}

export function addClasses(element: { classList: { add(...classes: string[]): void } }, ...classes: (Classes | false | null | undefined)[]) {
  element.classList.add(...classNames(...classes))
}

export type Offset4Side =
  undefined |
  number |
  [number, number] |
  { horizontal?: number, vertical?: number } |
  { top?: number, right?: number, bottom?: number, left?: number }

export type NormalizedOffset4Side = { top: number, right: number, bottom: number, left: number }

export function unwrapOffset(offset: Offset4Side): NormalizedOffset4Side {
  if (!offset) return { top: 0, right: 0, bottom: 0, left: 0 }

  if (typeof offset === 'number') {
    return { top: offset, right: offset, bottom: offset, left: offset }
  }

  if (Array.isArray(offset)) {
    const [a, b] = offset
    return { top: a, right: b ?? a, bottom: a, left: b ?? a }
  }

  if ('horizontal' in offset || 'vertical' in offset) {
    const { horizontal = 0, vertical = 0 } = offset
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal }
  }

  if ('top' in offset || 'right' in offset || 'bottom' in offset || 'left' in offset) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = offset
    return { top, right, bottom, left }
  }

  return { top: 0, right: 0, bottom: 0, left: 0 }
}