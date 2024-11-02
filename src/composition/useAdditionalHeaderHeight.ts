import { syncRefs, useElementBounding } from "@vueuse/core";
import { Ref, ref } from "vue";


const additionalHeaderHeight = ref(0)
export const headerHeight = ref(0)

export function useAdditionalHeaderHeight() {
  return { additionalHeaderHeight }
}

export function useDefaultHeaderHeight(header: Ref<HTMLElement | null>) {
  const { height } = useElementBounding(header);
  syncRefs(height, headerHeight)
}
