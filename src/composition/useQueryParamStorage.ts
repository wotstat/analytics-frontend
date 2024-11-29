import { MaybeRefOrGetter, StorageLike, useLocalStorage, useStorage } from "@vueuse/core";
import { onDeactivated, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";




function useRouterStorage(): StorageLike {
  const router = useRouter();
  const route = useRoute();

  return {
    getItem: (key: string) => {
      if (key in route.query) {
        return route.query[key] as string;
      }
      return null;
    },
    setItem: (key: string, value: string) => {
      router.push({ query: { ...route.query, [key]: value } });
    },
    removeItem: (key: string) => {
      const query = { ...route.query };
      delete query[key];
      router.push({ query });
    }
  }
}

export function useQueryParamStorage<T>(key: string, value: MaybeRefOrGetter<T>, deactivatable?: boolean) {
  const ref = useStorage(key, value, useRouterStorage());

  if (deactivatable) {
    onDeactivated(() => ref.value = null)
    onUnmounted(() => ref.value = null)
  }

  return ref
}