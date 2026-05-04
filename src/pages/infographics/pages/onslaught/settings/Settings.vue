<template>
  <div class="settings">
    <div class="line-main">
      <NicknameInput :syncToRoute="true" class="nickname" v-model="nickname" />

      <div class="game-select">
        <div class="vr"></div>
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
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/comp7/i18n.json'

const { t } = useI18n(i18n)

const props = defineProps<{
  seasons: { region: string, season: string }[]
}>()

const regions = ['RU', 'EU', 'NA', 'ASIA'] as const

const selectedSeason = defineModel<string | null>('season')
const selectedRegion = defineModel<'RU' | 'EU' | 'NA' | 'ASIA'>('region')
const nickname = defineModel<string>('nickname')
const currentSeasons = computed(() => props.seasons.filter(s => s.region === selectedRegion.value) || [])

// watch(selectedRegion, () => {
//   if (!currentSeasons.value?.length) return
//   selectedSeason.value = currentSeasons.value[0].season
// }, { immediate: true })

function changeRegion(target: 'RU' | 'EU' | 'NA' | 'ASIA') {
  selectedRegion.value = target
  if (!currentSeasons.value?.length) return
  selectedSeason.value = currentSeasons.value[0].season
}

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
    font-size: 0.9em;
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
      // background-color: var(--blue-thin-color);
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