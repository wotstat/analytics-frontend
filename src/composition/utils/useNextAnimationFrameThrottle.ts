import { ref, Ref, toValue, watch } from 'vue'


export function useNextAnimationFrameThrottle<T>(value: Ref<T>): Ref<T> {
  const result = ref(toValue(value)) as Ref<T>

  let isRegistred = false

  function update() {
    isRegistred = false
    result.value = value.value
  }

  watch(value, () => {
    if (isRegistred) return
    requestAnimationFrame(() => update())
    isRegistred = true
  })


  return result
}