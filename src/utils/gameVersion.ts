import { INSTALL_URL } from '@/utils/externalUrl'
import { useFetch } from '@vueuse/core'
type GameVersion = {
  actual: string
  modsFolder: string
  version: string
}

const latestGameVersions = useFetch(`${INSTALL_URL}/api/latest-game-version`, {
  updateDataOnError: true,
}).json<{ lesta: GameVersion, wargaming: GameVersion }>()

export const latestGameVersion = latestGameVersions.data