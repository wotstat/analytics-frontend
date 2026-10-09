<template>
  <BadgesLine :tagToText="tagToText" v-model="selected" show-add-button @openSelectModal="openSelect" />
  <ArenaSelectorPopup :arenas="arenas.data" :visible-modal="visibleModal" @close="visibleModal = false"
    v-model="selected" :game="props.game" :allow-team-selection="props.allowTeamSelection" />
</template>


<script setup lang="ts">
import { ref } from 'vue'

import { LONG_CACHE, queryAsync } from '@/db'
import BadgesLine from '../components/badges/BadgesLine.vue'
import { getArenaName } from '@/shared/i18n/i18n'
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

const arenas = queryAsync<{ region: string, battleMode: string, battleGameplay: string, tag: string, gameVersion: string }>(`
select region, battleMode, battleGameplay, splitByChar('/', arenaTag)[2] as tag, argMax(gameVersion, dateTime) as gameVersion
from Event_OnBattleStart
where region in ('RU', 'EU')
group by arenaTag, region, battleGameplay, battleMode
`, { enabled: visibleModal, cache: LONG_CACHE, proxyCache: true })

const selected = defineModel<Set<string>>({ default: () => new Set() })

function tagToText(tag: string) {
  if (!props.allowTeamSelection) return getArenaName(tag)
  const info = hashToArena(tag)
  if (!info) return tag
  const name = getArenaName(info.tag)
  if (info.team == 'any') return name
  return `${name}/${info.team}`
}

</script>
