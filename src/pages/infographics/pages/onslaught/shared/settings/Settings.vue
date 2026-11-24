<template>
  <div class="settings">
    <div class="line-main">
      <NicknameInput v-if="props.showNameInput"
        @clear="emit('clearNickname')"
        class="nickname"
        v-model="nickname" />

      <div class="vr" v-if="props.showNameInput"></div>
      <RegionSelector :model-value="selectedRegion" @update:model-value="changeRegion" class="regions" />
    </div>

    <OptionButtons
      :model-value="selectedSeason"
      :options="seasonOptions"
      @update:model-value="changeSeason"
      class="seasons mt-font">
      <template #default="{ option }">{{ t(`season:${selectedRegion?.toLowerCase()}:${option}`) }}</template>
    </OptionButtons>
  </div>
</template>


<script setup lang="ts">
import NicknameInput from './nicknameInput/NicknameInput.vue'
import { computed, watch, watchEffect } from 'vue'
import RegionSelector from '@/shared/game/components/selectors/region/RegionSelector.vue'
import OptionButtons from '@/shared/uiKit/selection/OptionButtons.vue'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/domain/comp7/i18n.json'
import { useOnslaughtQueryStorage, type OnslaughtRegion } from '../useOnslaughtQueryStorage'
import { LONG_CACHE, queryComputed, success } from '@/db'
import { getRegionIsoHourOffset } from '@/shared/game/domain/comp7/utils'

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
const seasonOptions = computed(() => (seasons.value ?? [])
  .filter(item => item.region === selectedRegion.value)
  .slice(0, 3)
  .map(item => item.season))

function changeSeason(season: string) {
  queryStorage.patch({ season })
}

function changeRegion(region: OnslaughtRegion) {
  if (region === queryStorage.params.region.value) return
  const season = seasons.value?.find(item => item.region === region)?.season ?? null
  queryStorage.patch({ regions: new Set([region]), season })
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
  $main-line-height: 30px;

  display: flex;
  align-items: center;
  gap: 5px;
  min-height: $main-line-height;

  .vr {
    width: 1px;
    height: $main-line-height;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .nickname {
    max-width: 200px;
    min-width: 100px;
    width: 200px;
  }

  .line-main {
    display: contents;
  }

  .regions,
  .seasons {
    --option-buttons-wrap: nowrap;
  }

  .seasons {
    margin-left: auto;
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
      min-height: $main-line-height;
    }

    .seasons {
      --option-button-flex: 1 1 auto;
      width: 100%;
      margin-left: 0;
    }
  }

  @media screen and (max-width: 350px) {
    .seasons {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
