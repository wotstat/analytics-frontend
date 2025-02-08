import { useLocalStorage } from "@vueuse/core";

export const preferredLogProcessor = useLocalStorage('bob25-preferred-log-processor', false);