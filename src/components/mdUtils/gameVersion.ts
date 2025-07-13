import { INSTALL_URL } from "@/utils/externalUrl";
import { useFetch } from "@vueuse/core";
import { computed } from "vue";

type GameVersion = {
  actual: string
  modsFolder: string
  version: string
}

const latestGameVersions = useFetch(`${INSTALL_URL}/api/latest-game-version`, {
  updateDataOnError: true,
}).json<{ lesta: GameVersion, wargaming: GameVersion }>()

export const gameVersionRU = computed(() => latestGameVersions.data.value?.lesta.modsFolder ?? 'Loading...')
export const gameVersionEU = computed(() => latestGameVersions.data.value?.wargaming.modsFolder ?? 'Loading...')

export const latestGameVersion = latestGameVersions.data