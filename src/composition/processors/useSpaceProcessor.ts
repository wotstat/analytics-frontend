import { computed, toValue, WatchSource } from "vue";

export function spaceProcessor(value: string) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function useSpaceProcessor(value: WatchSource<number>) {
  return computed(() => spaceProcessor(toValue(value)))
}