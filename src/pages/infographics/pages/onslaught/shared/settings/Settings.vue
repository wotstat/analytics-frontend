<template>
  <div class="settings">
    <div class="line-main">
      <NicknameInput :syncToRoute="true" class="nickname" v-model="nickname" v-if="props.showNameInput" />

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
      <button class="variant mt-font selectable" v-for="season in currentSeasons"
        :key="`${season.region}-${season.season}`" @click="selectedSeason = season.season"
        :class="{ 'active': season.season === selectedSeason }">
        {{ t(`season:${season.region.toLowerCase()}:${season.season}`) }}
      </button>
    </div>
  </div>

</template>


<script setup lang="ts">
import NicknameInput from './nicknameInput/NicknameInput.vue'
import { computed, shallowRef, watch, watchEffect } from 'vue'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/comp7/i18n.json'
import { useRoute, useRouter } from 'vue-router'
import { loading, LONG_CACHE_SETTINGS, queryAsync } from '@/db'
import { getRegionIsoHourOffset } from '@/shared/game/comp7/utils'

const { t } = useI18n(i18n)

const props = defineProps<{
  showNameInput?: boolean
}>()

const route = useRoute()
const router = useRouter()

const regions = ['RU', 'EU', 'NA', 'ASIA', 'CN'] as const

const seasons = defineModel<{ region: string, season: string, start: string, end: string }[]>('seasons')
const selectedSeason = defineModel<string | null>('season')
const selectedRegion = defineModel<'RU' | 'EU' | 'NA' | 'ASIA' | 'CN' | 'CT'>('region')
const nickname = defineModel<string>('nickname')
const currentSeasons = computed(() => seasons.value?.filter(s => s.region === selectedRegion.value) || [])

selectedSeason.value = typeof route.query.season === 'string' ? route.query.season : null
selectedRegion.value = typeof route.query.region === 'string' ? route.query.region as any : 'RU'

function changeRegion(target: 'RU' | 'EU' | 'NA' | 'ASIA' | 'CN' | 'CT') {
  selectedRegion.value = target
  const seasonsForRegion = seasons.value?.filter(s => s.region === target) || []
  if (!seasonsForRegion.length) {
    selectedSeason.value = null
    return
  }

  selectedSeason.value = seasonsForRegion[0].season
}

watchEffect(() => {
  router.push({
    query: {
      ...route.query,
      region: selectedRegion.value,
      season: selectedSeason.value,
    },
  })
})

const seasonsData = queryAsync<{ region: string, season: string, start: string, end: string }>(`
  select region, season,
        min(toStartOfDay(dateTime + interval ${getRegionIsoHourOffset(selectedRegion.value ?? 'RU')} hour)) as start,
        max(toStartOfDay(dateTime + interval ${getRegionIsoHourOffset(selectedRegion.value ?? 'RU')} hour)) as end
  from Event_OnComp7Info
  where region in ('RU', 'EU', 'NA', 'ASIA', 'CN', 'CT')
  group by region, season
  order by start desc
`, { settings: LONG_CACHE_SETTINGS })

watchEffect(() => seasons.value = seasonsData.value?.data ?? [])

watch(seasons, () => {
  const seasonList = seasonsData.value?.data.filter(s => s.region === selectedRegion.value).map(s => s.season) ?? []
  if (seasonList.includes(selectedSeason.value ?? '')) return

  if (seasonsData.value.status == loading) return

  selectedSeason.value = seasonList.length > 0 ? seasonList[0] : null
})

</script>

<style lang="scss">
html {
  scrollbar-gutter: stable;
}
</style>

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