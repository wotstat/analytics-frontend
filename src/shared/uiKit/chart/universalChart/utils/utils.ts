

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