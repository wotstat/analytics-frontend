<template>
  <div class="base-overlays-container" v-if="gameplayType">
    <img v-for="(base, i) in gameplayType.teamBasePositions[allyTeamIndex]" class="base" :style="getStyle(base)"
      :src="images[`AllyTeamBaseEntry_green_${i}`]">
    <img v-for="(base, i) in gameplayType.teamBasePositions[enemyTeamIndex]" class="base" :style="getStyle(base)"
      :src="images[`EnemyTeamBaseEntry_red_${i}`]">

    <img v-for="(base, i) in gameplayType.teamSpawnPoints[allyTeamIndex]" class="spawn" :style="getStyle(base)"
      :src="images[`AllyTeamSpawnEntry_green_${i + 1}`]">
    <img v-for="(base, i) in gameplayType.teamSpawnPoints[enemyTeamIndex]" class="spawn" :style="getStyle(base)"
      :src="images[`EnemyTeamSpawnEntry_red_${i + 1}`]">

    <img v-if="gameplayType.controlPoint" class="controll" :style="getStyle(gameplayType.controlPoint)"
      src="./assets/bases/ControlPointEntry_0.png">
  </div>
</template>

<script setup lang="ts">
import { convertCoordinate, loadArenaMeta } from '@/utils/arenas';
import { computedAsync } from '@vueuse/core';
import { computed, watchEffect } from 'vue';

const props = defineProps<{
  arenaTag: string;
  gameplay: string;
  allyTeam: number
}>();

const meta = computedAsync(async () => await loadArenaMeta(props.arenaTag), null);
const gameplayType = computed(() => meta.value?.gameplayTypes[props.gameplay]);

const allyTeamIndex = computed(() => props.allyTeam - 1)
const enemyTeamIndex = computed(() => props.allyTeam === 1 ? 1 : 0)

const images = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: string }>('./assets/bases/*', { eager: true }))
  .map(([key, value]) => [key.replace('./assets/bases/', '').replace('.png', ''), value.default])
);


function getStyle(v: { x: number, y: number }) {
  const bbox = meta.value?.boundingBox;
  if (!bbox) return;

  const { x, y } = convertCoordinate(v, bbox)
  return { left: `${x * 100}%`, top: `${y * 100}%` }
}
</script>

<style scoped lang="scss">
.base-overlays-container {
  width: 100%;
  height: 100%;
  user-select: none;

  .base,
  .spawn,
  .controll {
    position: absolute;
    transform: translate(-50%, -50%);
  }

  .base {
    width: 12%;
  }

  .spawn {
    width: 15%;
  }

  .controll {
    width: 15%;
  }
}
</style>