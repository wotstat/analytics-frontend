<template>
  <h2>Поиск реплеев</h2>
  <div class="filter">
    <div class="left">
      <div class="arena-select">
        Карта:
      </div>
      <div class="tank-select badge-selector">
        <p>Танк:</p>
        <VehicleSelectorBadges v-model="selectedVehicle" />
      </div>
    </div>
    <div class="separator vertical"></div>
    <div class="right">
      <div class="game-select">
        Игра:
        <GameSelector />
      </div>
      <div class="game-version badge-selector">
        <p>Версия:</p>
        <GameVersionSelectorBadges v-model="selectedGameVersion" />
      </div>
    </div>
  </div>
  <div class="battles">
    <Battle v-bind="info" />
    <Battle v-bind="{ ...info, meta: { ...info.meta, result: 'lose', tankTag: 'germany:G121_Grille_15_L63' } }" />
    <Battle v-bind="{ ...info, meta: { ...info.meta, result: 'tie' } }" />
    <Battle v-bind="info" />
    <Battle v-bind="info" />
    <Battle v-bind="info" />
    <Battle v-bind="info" />
  </div>
</template>

<script setup lang="ts">


import { ref } from 'vue'
import Battle from '../shared/Battle.vue'
import VehicleSelectorBadges from '@/pages/shared/searchFilters/vehicleSelector/VehicleSelectorBadges.vue'
import GameSelector from '@/pages/shared/gameSelector/GameSelector.vue'
import GameVersionSelectorBadges from '@/pages/shared/searchFilters/gameVersionSelector/GameVersionSelectorBadges.vue'


const info = {
  meta: {
    title: 'Хороший боя на 24к дамага',
    region: 'RU',
    team: '1',
    result: 'win',
    version: '1.31.0.1',
    date: '21.09.2025 10:14',
    player: 'Renou',
    arena: 'spaces/05_prohorovka',
    tankTag: 'ussr:R159_SU_130PM',
    battleMode: 'REGULAR'
  },
  stats: {
    damage: 1234,
    assist: 1234,
    blocked: 1234,
    kills: 1234,
    xp: 1234,
    lifetime: 1234,
    spot: 4
  },
  utils: {
    downloadCount: 24,
  }
} as const

const selectedVehicle = ref(new Set<string>())
const selectedGameVersion = ref(new Set<string>())

</script>


<style scoped lang="scss">
h2 {
  margin-top: 1em;
}

.battles {
  display: grid;
  grid-template-columns: repeat(1, minmax(500px, 1fr));
  gap: 1.3em;
}

.filter {
  display: flex;
  margin-bottom: 1em;

  .left,
  .right {
    flex: 1;
  }

  .separator.vertical {
    width: 1px;
    background-color: rgb(255, 255, 255, 0.1);
    margin: 0 1em;
  }

}

.badge-selector {
  display: flex;
  align-items: baseline;
  font-size: 18px;

  p {
    padding-right: 0.3em;
  }
}

.tank-select {}
</style>
