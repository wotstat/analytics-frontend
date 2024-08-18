import { ref, Ref, watchEffect } from "vue";
import { useIframeMessages } from "./useIframeMessages";

export function useIframeContentBounding(iframe: Ref<HTMLIFrameElement | null>) {

  const height = ref(0);
  const width = ref(0);


  useIframeMessages(iframe, (data) => {
    if (data.type == 'documentBounding') {
      height.value = data.value.height;
      width.value = data.value.width
    }
  })

  return { height, width };

}