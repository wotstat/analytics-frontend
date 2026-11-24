type SelectionModifiers = Pick<MouseEvent, 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey'>

export function selectOptionWithModifiers<T>(
  selected: readonly T[],
  option: T,
  options: readonly T[],
  event: SelectionModifiers,
  fillRange = false,
): T[] {
  if (event.altKey) {
    const others = options.filter(value => value !== option)
    const allOthersSelected = selected.length === others.length && others.every(value => selected.includes(value))
    return allOthersSelected ? [option] : others
  }

  if (selected.includes(option)) return selected.filter(value => value !== option)

  if (event.shiftKey) {
    const index = options.indexOf(option)
    const indices = selected.map(value => options.indexOf(value)).filter(index => index >= 0)
    if (index < 0 || !indices.length) return [...selected, option]
    if (fillRange) return options.slice(Math.min(index, ...indices), Math.max(index, ...indices) + 1)

    const first = Math.min(...indices)
    const start = Math.min(first, index)
    const end = index < first ? Math.max(...indices) : index
    return [...new Set([...selected, ...options.slice(start, end + 1)])]
  }

  if (event.ctrlKey || event.metaKey) return [...selected, option]
  return [option]
}
