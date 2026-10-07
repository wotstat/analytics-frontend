<template>
  <div class="settings">
    <div class="line-main">
      <NicknameInput @clear="emit('clearNickname')" class="nickname" v-model="nickname" v-if="props.showNameInput" />

      <div class="game-select">
        <div class="vr" v-if="props.showNameInput"></div>
        <button class="variant mt-font selectable" v-for="region in regions"
          :class="{ 'active': selectedRegion === region }" @click="changeRegion(region)" :key="region">
          {{ region }}
        </button>
      </div>
    </div>

    <div class="season-select">
      <div class="space flex-1"></div>
      <button class="variant mt-font selectable" v-for="season in currentSeasons.slice(0, 3)"
        :key="`${season.region}-${season.season}`" @click="changeSeason(season.season)"
        :class="{ 'active': season.season === selectedSeason }">
        {{ t(`season:${season.region.toLowerCase()}:${season.season}`) }}
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
import NicknameInput from './nicknameInput/NicknameInput.vue'
import { computed, watch, watchEffect } from 'vue'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/comp7/i18n.json'
import { regions, useOnslaughtQueryStorage, type OnslaughtRegion } from '../useOnslaughtQueryStorage'
import { LONG_CACHE, queryComputed, success } from '@/db'
import { getRegionIsoHourOffset } from '@/shared/game/comp7/utils'

const { t } = useI18n(i18n)

const props = defineProps<{
  showNameInput?: boolean
  showLive?: boolean
}>()

const emit = defineEmits<{ clearNickname: [] }>()
const queryStorage = useOnslaughtQueryStorage()

const seasons = defineModel<{ region: string, season: string, start: string }[]>('seasons')
const selectedSeason = defineModel<string | null>('season')
const selectedRegion = defineModel<OnslaughtRegion>('region')
const nickname = defineModel<string>('nickname')
const currentSeasons = computed(() => seasons.value?.filter(s => s.region === selectedRegion.value) || [])

function changeSeason(season: string) {
  queryStorage.patch({ season })
}

function changeRegion(region: OnslaughtRegion) {
  if (region === queryStorage.params.region.value) return
  const season = seasons.value?.find(item => item.region === region)?.season ?? null
  queryStorage.patch({ region, season })
}

const seasonsData = queryComputed<{ region: string, season: string, start: string }>(() => `
  select region, season,
        min(toStartOfDay(dateTime + interval ${getRegionIsoHourOffset(selectedRegion.value ?? 'RU')} hour)) as start
  from Event_OnComp7Info
  where region in ('RU', 'EU', 'NA', 'ASIA', 'CN', 'CT', 'RPT')
  group by region, season
  order by start desc
`, { cache: LONG_CACHE, proxyCache: true })

watchEffect(() => seasons.value = seasonsData.value?.data ?? [])

watch([queryStorage.params.region, queryStorage.params.season, seasonsData], () => {
  if (seasonsData.value.status !== success) return
  const region = queryStorage.params.region.value
  const requestedSeason = queryStorage.params.season.value
  const regionSeasons = seasonsData.value.data.filter(item => item.region === region)
  const season = regionSeasons.some(item => item.season === requestedSeason)
    ? requestedSeason
    : regionSeasons[0]?.season ?? null
  if (season !== requestedSeason) queryStorage.patch({ season }, { history: 'replace' })
}, { immediate: true })

</script>

<style lang="scss" scoped>
.settings {
  display: flex;
  align-items: center;
  gap: 5px;

  .vr {
    width: 1px;
    height: 30px;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .nickname {
    max-width: 200px;
    min-width: 100px;
    width: 200px;
  }

  .line-main,
  .game-select,
  .season-select {
    display: contents;
  }

  .variant {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    padding: 0 10px;
    line-height: 1;
    font-size: 14px;
    white-space: nowrap;

    .icon {
      height: 14px;
    }
  }

  .selectable {
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.07s;
    border: none;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    &.active {
      background-color: var(--blue-color);
    }
  }

  @media screen and (max-width: 600px) {
    flex-direction: column;

    .nickname {
      flex: 1;
      max-width: none;
    }

    .line-main {
      display: flex;
      align-items: center;
      gap: 5px;
      width: 100%;
    }

    .season-select {
      display: flex;
      align-items: center;
      gap: 5px;
      width: 100%;

      .space {
        display: none;
      }

      .variant {
        flex: 1;
      }
    }
  }

  @media screen and (max-width: 350px) {
    .season-select {
      flex-direction: column;

      .variant {
        min-height: 22px;
        width: 100%;
      }
    }
  }
}
</style>
