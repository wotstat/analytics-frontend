import { INSTALL_URL } from '@/shared/external/externalUrl'
import { useFetch } from '@vueuse/core'
import { computed, ref, watch, watchEffect } from 'vue'


export type ModInfo = {
  tag: string
  source: { url: string, name: string }
  support?: 'mt-only' | 'wot-only'
  required?: string[]
}

export const analyticsMod: ModInfo = {
  tag: 'wotstat.analytics',
  source: { url: '', name: '' }
}

export const positionsMod: ModInfo = {
  tag: 'wotstat.positions',
  source: { url: '', name: '' }
}

export const widgetsMod: ModInfo = {
  tag: 'wotstat.widgets',
  source: { url: '', name: '' }
}

export const otherMods: ModInfo[] = [
  { tag: 'wotstat.lootbox-open-multiplier', source: { url: 'https://github.com/wotstat/lootbox-open-multiplier', name: 'GitHub' }, support: 'mt-only' },
  { tag: 'wotstat.data-provider', source: { url: 'https://github.com/wotstat/wotstat-data-provider', name: 'GitHub' } },
  { tag: 'izeberg.modssettingsapi', source: { url: 'https://github.com/IzeBerg/modssettingsapi', name: 'GitHub' }, required: ['me.poliroid.modslistapi'] },
  { tag: 'me.poliroid.modslistapi', source: { url: 'https://gitlab.com/wot-public-mods/mods-list', name: 'GitLab' } },
]

export const otherModsMap = new Map<string, ModInfo>(otherMods.map(mod => [mod.tag, mod]))

export type Mod = {
  id: string
  filename: string
  version: string
  hash: string
  url: string
  date: string
}

export const latestMods = useFetch(`${INSTALL_URL}/api/mods-latest`, {
  updateDataOnError: true
}).json<Record<string, { mtmod: Mod, wotmod: Mod }>>()



export const latestModsMap = ref(new Map<string, { mtmod: Mod, wotmod: Mod }>())
export const lestaLatestMods = ref(new Map<string, Mod>())
export const wotLatestMods = ref(new Map<string, Mod>())


watch(latestMods.data, data => {
  if (!data) {
    latestModsMap.value.clear()
    lestaLatestMods.value.clear()
    wotLatestMods.value.clear()
    return
  }

  latestModsMap.value = new Map(Object.entries(data))
  lestaLatestMods.value = new Map(Object.entries(data).map(([key, value]) => [key, value.mtmod]))
  wotLatestMods.value = new Map(Object.entries(data).map(([key, value]) => [key, value.wotmod]))
})