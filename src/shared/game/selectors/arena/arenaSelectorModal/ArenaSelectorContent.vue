<template>
  <div class="loading" v-if="arenas.length == 0">
    <Loader />
  </div>
  <div class="modal-content" v-else-if="filtered.length !== 0">
    <div class="section" v-for="group in filtered">
      <h2 class="header">{{ group.header }}</h2>
      <div class="arenas">
        <div class="arena" v-for="arena in group.data" :tag="arena.tag" :mode="arena.battleMode"
          @click="onArenaClick(arena.tag)" :class="{ 'selected': selectedTags.has(arena.tag) }">
          <MinimapBackground :tag="arena.imageName" :game="game" :gameplay="arena.battleGameplay"
            :fallback="FallbackMinimap" class="minimap-background" />
          <MinimapBases class="minimap-bases" :tag="arena.tag" :game="game" :gameplay="arena.gameplay"
            v-if="typeof selectedTeams.get(arena.tag) == 'number'" :team="getTeam(selectedTeams.get(arena.tag))" />
          <div class="team-switcher mt-font"
            v-if="selectedTags.has(arena.tag) && arenasTeamCount(game, arena.tag, arena.gameplay) == 2" @click.stop>
            <button class="left" @click="selectTeam(arena.tag, 1)"
              :class="{ 'selected': selectedTeams.get(arena.tag) === 1 }">1</button>
            <button class="slash" @click="selectTeam(arena.tag, 'any')"
              :class="{ 'selected': selectedTeams.get(arena.tag) === 'any' }">/</button>
            <button class="right" @click="selectTeam(arena.tag, 2)"
              :class="{ 'selected': selectedTeams.get(arena.tag) === 2 }">2</button>
          </div>
          <div class="name mt-font">
            <span v-if="search == ''">{{ arena.name }}</span>
            <HighlightString v-else :text="arena.highlighted.highlightedString" />
          </div>
          <div class="version mt-font" v-if="compareVersion(arena.version, latestGameVersion) != 0">
            До {{ arena.version.join('.') }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="empty-list" v-else>
    <h5>Карт не найдено</h5>
    <button @click="emit('reset')">Очистить фильтр</button>
  </div>
</template>


<script setup lang="ts">
import { getArenaMeta, tagToImageName } from '@/shared/game/arenas/arenas'
import MinimapBackground from '@/shared/game/arenas/minimap/minimapBackground/MinimapBackground.vue'
import MinimapBases from '@/shared/game/arenas/minimap/minimapBases/MinimapBases.vue'
import { GameVendor } from '@/shared/game/wot'
import HighlightString from '@/shared/uiKit/highlightString/HighlightString.vue'
import { compareIntervals, Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'
import { computed } from 'vue'

import FallbackMinimap from './fallback-minimap.webp'
import { arenaToHash, hashToArena } from '../utils'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'

const props = defineProps<{
  game: GameVendor
  arenas: { region: string, battleMode: string, battleGameplay: string, tag: string, name: string, gameVersion: string, season: string }[]
  search: string
  season: 'winter' | 'summer' | 'desert' | null
  onlyActual: boolean
}>()

const emit = defineEmits<{
  (e: 'reset'): void
}>()

const selected = defineModel<Set<string>>({ default: new Set() })
const parsedSelected = computed(() => new Set([...selected.value.values()].map(tag => hashToArena(tag))))
const selectedTags = computed(() => new Set([...parsedSelected.value.values()].map(a => a.tag)))
const selectedTeams = computed(() => new Map<string, 'any' | number>(
  [...parsedSelected.value.values()].map(a => [a.tag, a.team])
))

type VersionParts = [number, number, number]
function compareVersion(a: VersionParts, b: VersionParts): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return -1
    if (a[i] > b[i]) return 1
  }
  return 0
}

function parseVersion(string: string): VersionParts {
  const parts = string.split('_')[1].split('.').map(p => parseInt(p))
  while (parts.length < 3) parts.push(0)
  return parts as VersionParts
}

const prepared = computed(() => props.arenas.map(arena => ({
  ...arena,
  version: parseVersion(arena.gameVersion),
  gameplay: arena.battleGameplay,
  imageName: tagToImageName(arena.tag),
  highlighted: new Highlighted((!arena.name || arena.name.endsWith('/name')) ? arena.tag : arena.name)
})))

const groups = computed(() => {

  type Arena = typeof prepared.value[number]

  const groups = {
    ctf: [] as Arena[],
    ctf30x30: [] as Arena[],
    domination: [] as Arena[],
    assault: [] as Arena[],
    battleRoyale: [] as Arena[],
    comp7: [] as Arena[],
    epic: [] as Arena[],
    mapbox: [] as Arena[],
    historicalBattles: [] as Arena[],
    storyMode: [] as Arena[],
    whiteTiger: [] as Arena[],
    globalMap: [] as Arena[],
    other: [] as Arena[],
  }

  const usedTags = new Set<string>()
  const usedCategoriesTags = new Set<string>()
  const add = (arena: Arena, category: keyof typeof groups) => {
    const key = `${category}:${arena.region}:${arena.tag}`
    if (!usedCategoriesTags.has(key)) groups[category].push(arena)
    usedCategoriesTags.add(key)
    usedTags.add(`${arena.region}:${arena.tag}`)
  }


  for (const arena of prepared.value) {
    if (arena.battleMode === 'REGULAR' && arena.battleGameplay === 'ctf') add(arena, 'ctf')
    else if (arena.battleMode === 'REGULAR' && arena.battleGameplay === 'domination') add(arena, 'domination')
    else if (arena.battleMode === 'REGULAR' && arena.battleGameplay === 'assault') add(arena, 'assault')
    else if (arena.battleMode === 'EPIC_RANDOM' && arena.battleGameplay === 'ctf30x30') add(arena, 'ctf30x30')
    else if (arena.battleMode === 'BATTLE_ROYALE_SOLO') add(arena, 'battleRoyale')
    else if (arena.battleMode === 'COMP7') add(arena, 'comp7')
    else if (arena.battleGameplay === 'epic') add(arena, 'epic')
    else if (arena.battleMode === 'MAPBOX') add(arena, 'mapbox')
    else if (arena.battleMode === 'HISTORICAL_BATTLES') add(arena, 'historicalBattles')
    else if (arena.battleMode === 'WHITE_TIGER_2' || arena.battleMode === 'WHITE_TIGER') add(arena, 'whiteTiger')
    else if (arena.battleMode === 'STORY_MODE_REGULAR' ||
      arena.battleMode === 'STORY_MODE_ONBOARDING' ||
      arena.battleMode === 'STORY_MODE') add(arena, 'storyMode')
    else if (arena.battleMode === 'GLOBAL_MAP' && arena.battleGameplay === 'assault2') add(arena, 'globalMap')
  }

  for (const arena of prepared.value) if (!usedTags.has(`${arena.region}:${arena.tag}`)) add(arena, 'other')

  return [
    { header: 'Стандартный бой', items: groups.ctf },
    { header: 'Штурм', items: groups.assault },
    { header: 'Встречный бой', items: groups.domination },
    { header: 'Генеральное сражение', items: groups.ctf30x30 },
    { header: 'Линия Фронта', items: groups.epic },
    { header: 'Стальной Охотник', items: groups.battleRoyale },
    { header: 'Натиск', items: groups.comp7 },
    { header: 'Последний Waffenträger', items: groups.whiteTiger },
    { header: 'Разведка боем', items: groups.mapbox },
    { header: 'Исторические бои', items: groups.historicalBattles },
    { header: 'Сюжетный режим', items: groups.storyMode },
    { header: 'Глобальная карта', items: groups.globalMap },
    { header: 'Другие режимы', items: groups.other }
  ]
})

const latestGameVersion = computed(() => {
  const targetRegion = props.game == 'mt' ? 'RU' : 'EU'
  let latest: VersionParts = [0, 0, 0]
  for (const arena of prepared.value) {
    if (arena.region == targetRegion && compareVersion(arena.version, latest) > 0) latest = arena.version
  }
  return latest
})

const filtered = computed(() => {

  const search = props.search.trim().toLowerCase()
  const targetRegion = props.game == 'mt' ? 'RU' : 'EU'

  const filteredGroups = groups.value.map(arenas => {

    const data = arenas.items

    const prefiltered = data.filter(t => t.region == targetRegion &&
      (props.season === null || t.season === props.season) &&
      (!props.onlyActual || compareVersion(t.version, latestGameVersion.value) == 0))

    for (const arena of prefiltered) {
      arena.highlighted.setSubstring(search)
    }

    const filtered = prefiltered.filter(arena => !search || arena.highlighted.intervals.length > 0)

    function sorted() {
      if (search) return filtered.sort((a, b) => {
        const comp = compareIntervals(a.highlighted.intervals, b.highlighted.intervals)
        if (comp !== 0) return comp
        const versionComp = compareVersion(b.version, a.version)
        if (versionComp !== 0) return versionComp
        return a.highlighted.text.localeCompare(b.highlighted.text)
      })

      return filtered.sort((a, b) => {
        const versionComp = compareVersion(b.version, a.version)
        if (versionComp !== 0) return versionComp
        return a.highlighted.text.localeCompare(b.highlighted.text)
      })
    }

    return {
      header: arenas.header,
      data: sorted()
    }
  })

  return filteredGroups.filter(g => g.data.length > 0)
})

function onArenaClick(tag: string) {
  if (selectedTags.value.has(tag)) selected.value.delete([...selected.value].find(t => hashToArena(t).tag === tag)!)
  else selectTeam(tag, 'any')
}

function selectTeam(tag: string, team: 'any' | number) {
  const existing = [...selected.value].find(t => hashToArena(t).tag === tag)
  if (existing) selected.value.delete(existing)
  selected.value.add(arenaToHash({ tag, team }))
}

const arenaTeamsCountCache = new Map<string, number>()
function arenasTeamCount(game: GameVendor, tag: string, gameplay: string) {
  if (arenaTeamsCountCache.has(`${game}:${tag}:${gameplay}`)) return arenaTeamsCountCache.get(`${game}:${tag}:${gameplay}`)!
  const meta = getArenaMeta(game, tag, gameplay)
  if (!meta) return 0
  const teams = new Set()
  meta.bases.map(b => b.team).forEach(t => teams.add(t))
  meta.spawn.map(s => s.team).forEach(t => teams.add(t))
  arenaTeamsCountCache.set(`${game}:${tag}:${gameplay}`, teams.size)
  return teams.size
}

function getTeam(team: 'any' | number | undefined) {
  if (team === 'any') return undefined
  return team
}

</script>


<style lang="scss" scoped>
h2 {
  margin: 10px 0 15px 0;
  font-size: 1em;
}

.section {
  &:not(:first-child) {
    margin-top: 50px;
  }
}

.arenas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;

  .arena {
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    aspect-ratio: 1 / 1;
    cursor: pointer;

    &.selected {
      border-color: var(--blue-color);

      &::before {
        content: '';
        position: absolute;
        inset: -2px;
        background: var(--blue-color);
        pointer-events: none;
        border-radius: 1px;
      }

      box-shadow: 0 0 20px rgba(44, 79, 255, 0.1);
    }

    .minimap-background,
    .minimap-bases {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .name {
      user-select: none;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 15px;
      color: rgb(255, 252, 241);
      padding-bottom: 6px;
      padding-top: 20px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 20%, rgba(0, 0, 0, 0));

      :deep(.highlight) {
        color: var(--blue-thin-color-hover);
      }

      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .version {
      user-select: none;
      position: absolute;
      top: 14px;
      right: -1px;
      font-size: 11px;

      line-height: 1;
      padding: 2px 6px;
      padding-right: 2px;

      color: rgb(255, 252, 241);
      background: rgb(11, 99, 213);

      border-radius: 10px;
      border-bottom-right-radius: 0;
      border-top-right-radius: 0;
    }

    .team-switcher {
      $border-radius: 5px;

      position: absolute;
      left: 50%;
      top: -1px;
      display: flex;
      user-select: none;
      transform: translateX(-50%) translateY(-50%);
      background-color: var(--blue-color);
      border-radius: calc(1px + $border-radius);
      padding: 1px;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);

      &::before {
        content: '';
        position: absolute;
        inset: 1.5px;
        background-color: #1a1a1a;
        border-radius: $border-radius;
      }

      button {
        border: none;
        border-radius: 0;
        padding: 1px 9px;
        font-weight: bold;
        font-size: 14px;
        z-index: 1;

        &.left {
          border-top-left-radius: $border-radius;
          border-bottom-left-radius: $border-radius;
        }

        &.right {
          border-top-right-radius: $border-radius;
          border-bottom-right-radius: $border-radius;
        }

        &.selected {
          background-color: var(--blue-color);
        }
      }
    }
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;

  h5 {
    margin: 0;
    font-size: 1em;
  }

  button {
    background-color: transparent;

    color: var(--blue-thin-color);
    font-size: 0.9em;
    border: none;
    transition: color 0.2s;

    &:hover {
      color: var(--blue-thin-color-hover);
    }
  }

}
</style>