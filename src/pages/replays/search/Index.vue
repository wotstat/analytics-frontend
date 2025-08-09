<template>
  <h2>Поиск реплеев</h2>
  <div class="tank-select">
    <p @click="displayPopup = true">Танк:</p>
    <VehicleSelectorBadges v-model="selectedVehicle" v-model:display-popup="displayPopup" />
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
import VehicleSelectorBadges from '@/components/vehicleSelector/VehicleSelectorBadges.vue'

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

const displayPopup = ref(false)

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

.tank-select {
  display: flex;
  align-items: baseline;
  font-size: 18px;
  margin-bottom: 1em;

  p {
    padding-right: 0.3em;
  }

}
</style>
