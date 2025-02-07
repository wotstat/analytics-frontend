import { computed, toValue, WatchSource } from "vue";

export function playerNameProcessor(name: string | undefined) {
  if (!name) return undefined

  const removeParts = [
    '_Press',
    'Press'
  ]

  let result = name
  for (const removePart of removeParts) result = result.replace(removePart, '')

  return result.trim()
}

export function usePlayerNameProcessor(value: WatchSource<string | undefined>) {
  return computed(() => playerNameProcessor(toValue(value)))
}