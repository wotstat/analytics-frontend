import { Ref } from "vue";

export function useIframeMessages(iframe: Ref<HTMLIFrameElement | null>, onMessage: (data: any) => void) {
  window.addEventListener("message", (event) => {
    if (event.source == iframe.value?.contentWindow) {
      onMessage(event.data);
    }
  })
}