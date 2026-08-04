<template>
  <BadgesLinePopover v-model="versions" :close-on-outside-window="closeOnOutsideWindow" :tag-to-key="versionToKey"
    :tag-to-text="tagToText">
    <GameVersionPopup :versionList="versionsList.data" v-model="versions" :with-region="withRegion"
      :show-minor="showMinor" :show-patches="showPatches" :show-versions="showVersions" />
  </BadgesLinePopover>
</template>


<script setup lang="ts">
import BadgesLinePopover from '../components/badges/BadgesLinePopover.vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import GameVersionPopup from './GameVersionPopup.vue'
import { CloseOnOutsideWindow } from '@/shared/uiKit/popover/utils'

type OptionalRegionVersion = { region?: string, version: string }

const props = withDefaults(defineProps<{
  closeOnOutsideWindow?: CloseOnOutsideWindow
  withRegion?: boolean
  showVersions?: boolean
  showPatches?: boolean
  showMinor?: boolean
}>(), {
  withRegion: false,
  showVersions: true,
  showPatches: true,
  showMinor: true
})

const versionsList = queryAsync<{ region: string, version: string }>(`
  select region, gameVersionFull as version
  from GameVersions
  group by region, gameVersionFull
`, { settings: CACHE_SETTINGS })

const versions = defineModel<Set<OptionalRegionVersion>>({ default: () => new Set() })

function versionToKey({ region, version }: OptionalRegionVersion): string {
  return region ? `${region}_${version}` : version
}

function tagToText({ region, version }: OptionalRegionVersion): string {
  return region ? `[${region}] ${version}` : version
}

</script>
