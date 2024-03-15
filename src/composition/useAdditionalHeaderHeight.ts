import { ref } from "vue";


const additionalHeaderHeight = ref(0)

export function useAdditionalHeaderHeight() {
  return { additionalHeaderHeight }
}