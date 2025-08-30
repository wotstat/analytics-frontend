<template>
  <BadgesLinePopover :tagToText="t => getTankName(t, true)" v-model="vehicles">
    <GameVersionPopup :versionList="versions.data" v-model="vehicles" />
  </BadgesLinePopover>
</template>


<script setup lang="ts">
import { getTankName } from '@/utils/i18n'
import BadgesLinePopover from '../badges/BadgesLinePopover.vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import GameVersionPopup from './GameVersionPopup.vue'



const versions = queryAsync<{ region: string, version: string }>(`
  select region, gameVersionFull as version
  from GameVersions
  group by region, gameVersionFull
`, { settings: CACHE_SETTINGS })

const vehicles = defineModel<Set<string>>({ default: new Set() })

</script>