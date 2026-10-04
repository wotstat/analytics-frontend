<template>
  <BadgesLine :tagToText="tagToText" v-model="selected" show-add-button @openSelectModal="openSelect" />
  <ArenaSelectorPopup :arenas="arenas.data" :visible-modal="visibleModal" @close="visibleModal = false"
    v-model="selected" :game="props.game" :allow-team-selection="props.allowTeamSelection" />
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'

import { LONG_CACHE, queryAsync } from '@/db'
import BadgesLine from '../components/badges/BadgesLine.vue'
import { selectTagArenasLocalization } from '@/shared/i18n/i18n'
import ArenaSelectorPopup from './arenaSelectorModal/ArenaSelectorPopup.vue'
import { hashToArena } from './utils'
import type { GameVendor } from '@/shared/game/wot'

const props = withDefaults(defineProps<{
  game?: GameVendor
  allowTeamSelection?: boolean
}>(), { allowTeamSelection: true })

const visibleModal = ref(false)

function openSelect() {
  visibleModal.value = true
}

const arenas = queryAsync<{ region: string, battleMode: string, battleGameplay: string, tag: string, name: string, gameVersion: string, season: string }>(`
with
    arenas as (
      select region, battleMode, battleGameplay, splitByChar('/', arenaTag)[2] as tag, argMax(gameVersion, dateTime) as gameVersion
      from Event_OnBattleStart
      where region in ('RU', 'EU')
      group by arenaTag, region, battleGameplay, battleMode
    ),
    locals as (${selectTagArenasLocalization}),
    seasons as (select tag, season from ArenasLatest)
select region, battleMode, battleGameplay, tag, gameVersion, name, season
from arenas
left any join locals using tag
left any join seasons using tag
`, { cache: LONG_CACHE })

const arenaNames = computed(() => new Map(arenas.value.data.map(a => [a.tag, a.name])))

const selected = defineModel<Set<string>>({ default: () => new Set() })

function tagToText(tag: string) {
  if (!props.allowTeamSelection) return arenaNames.value.get(tag) || tag
  const info = hashToArena(tag)
  if (!info) return tag
  const name = arenaNames.value.get(info.tag) || info.tag
  if (info.team == 'any') return name
  return `${name}/${info.team}`
}

</script>
