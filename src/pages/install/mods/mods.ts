import { INSTALL_URL } from '@/shared/external/externalUrl'
import { useFetch } from '@vueuse/core'
import { ref, watch } from 'vue'


export type ModInfo = {
  tag: string
  source: { url: string, name: string }
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

export const lestaMods: ModInfo[] = [
  { tag: 'wotstat.lootbox-open-multiplier', source: { url: 'https://github.com/wotstat/lootbox-open-multiplier', name: 'GitHub' } },
  { tag: 'wotstat.data-provider', source: { url: 'https://github.com/wotstat/wotstat-data-provider', name: 'GitHub' } },
  { tag: 'izeberg.modssettingsapi', source: { url: 'https://github.com/IzeBerg/modssettingsapi', name: 'GitHub' }, required: ['me.poliroid.modslistapi'] },
  { tag: 'me.poliroid.modslistapi', source: { url: 'https://gitlab.com/wot-public-mods/mods-list', name: 'GitLab' } },
]
export const lestaModsMap = new Map<string, ModInfo>(lestaMods.map(mod => [mod.tag, mod]))

export const wgMods: ModInfo[] = [
  { tag: 'wotstat.data-provider', source: { url: 'https://github.com/wotstat/wotstat-data-provider', name: 'GitHub' } },
  { tag: 'izeberg.modssettingsapi', source: { url: 'https://github.com/IzeBerg/modssettingsapi', name: 'GitHub' }, required: ['me.poliroid.modslistapi'] },
  { tag: 'me.poliroid.modslistapi', source: { url: 'https://gitlab.com/wot-public-mods/mods-list', name: 'GitLab' }, required: ['net.openwg.gameface'] },
  { tag: 'net.openwg.gameface', source: { url: 'https://gitlab.com/openwg/wot.gameface', name: 'GitLab' } },
]
export const wgModsMap = new Map<string, ModInfo>(wgMods.map(mod => [mod.tag, mod]))

export const otherModsUnion = (() => {
  const union = new Map<string, {
    source: ModInfo['source'],
    required: Set<string>,
  }>()

  for (const mod of lestaMods) union.set(mod.tag, {
    source: mod.source,
    required: new Set(mod.required || [])
  })

  for (const mod of wgMods) {
    const existing = union.get(mod.tag)
    if (existing) {
      for (const req of mod.required || []) existing.required.add(req)
    } else {
      union.set(mod.tag, {
        source: mod.source,
        required: new Set(mod.required || [])
      })
    }
  }

  return [...union.entries()].map(([tag, mod]) => ({
    tag,
    source: mod.source,
    required: [...mod.required],
    support: lestaModsMap.has(tag) ? (wgModsMap.has(tag) ? undefined : 'mt-only') : 'wot-only' as 'mt-only' | 'wot-only' | undefined
  }))
})()

export const otherModsUnionMap = new Map<string, {
  source: ModInfo['source'],
  required: string[],
  support: 'mt-only' | 'wot-only' | undefined
}>(otherModsUnion.map(mod => [mod.tag, mod]))

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


export const latestModsMap = ref(new Map<string, { mtmod?: Mod, wotmod?: Mod }>())
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