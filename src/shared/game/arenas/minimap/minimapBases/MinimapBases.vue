<template>
  <div class="overlay" :arenaTag="tag">
    <img v-for="(point, i) in meta?.poi" class="poi-point" :style="pos(point.position)"
      :src="images[`Poi_${point.type}`]" :t="point.type">

    <img v-for="(base, i) in allyTeamSpawnPoints" class="spawn-point" :style="pos(base)"
      :src="images[`AllyTeamSpawnEntry_green_${i + 1}`]">
    <img v-for="(base, i) in enemyTeamSpawnPoints" class="spawn-point" :style="pos(base)"
      :src="images[`EnemyTeamSpawnEntry_red_${i + 1}`]">

    <img v-for="(base, i) in allyBases" class="team-base" :style="pos(base)"
      :src="images[`AllyTeamBaseEntry_green_${allyBases.length > 1 ? i + 1 : i}`]">
    <img v-for="(base, i) in enemyBases" class="team-base" :style="pos(base)"
      :src="images[`EnemyTeamBaseEntry_red_${enemyBases.length > 1 ? i + 1 : i}`]">

    <img v-for="(point, i) in meta?.control" class="control" :style="pos(point)"
      :src="images[`ControlPointEntry_${i}`]">
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { getArenaMeta, relativeMapPosition } from '../../arenas'
import { GameVendor } from '@/shared/game/wot'

const props = withDefaults(defineProps<{
  tag: string;
  game?: GameVendor;
  gameplay?: string;
  team?: number;
}>(), {
  game: 'mt',
  gameplay: 'ctf',
  team: 1
})

const meta = computed(() => getArenaMeta(props.game, props.tag, props.gameplay))

const images = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: string }>('./assets/*', { eager: true }))
    .map(([key, value]) => [key.replace('./assets/', '').replace('.png', ''), value.default])
)

const allyBases = computed(() => {
  if (!meta.value || !props.team) return []
  return meta.value.bases.filter(base => base.team == props.team).flatMap(base => base.positions)
})

const enemyBases = computed(() => {
  if (!meta.value || !props.team) return []
  return meta.value.bases.filter(base => base.team != props.team).flatMap(base => base.positions)
})

const allyTeamSpawnPoints = computed(() => {
  if (!meta.value || !props.team) return []
  return meta.value.spawn.filter(spawn => spawn.team == props.team).flatMap(spawn => spawn.positions)
})

const enemyTeamSpawnPoints = computed(() => {
  if (!meta.value || !props.team) return []
  return meta.value.spawn.filter(spawn => spawn.team != props.team).flatMap(spawn => spawn.positions)
})

function pos(position: { x: number, y: number }) {
  if (!meta.value) return { left: '0px', top: '0px' }
  const { x, y } = relativeMapPosition(position, meta.value!)
  return { left: `${x * 100}%`, top: `${y * 100}%` }
}

</script>


<style lang="scss" scoped>
.overlay {
  aspect-ratio: 1 / 1;
  pointer-events: none;
  user-select: none;
  overflow: hidden;

  .team-base,
  .spawn-point,
  .control,
  .poi-point {
    position: absolute;
    transform: translate(-50%, -50%) scale(var(--minimap-scale, 1));
    width: 20%;
  }

  .poi-point {
    width: 13%;
  }
}
</style>