<template>
  <div class="bbox-side">
    <table class="debug-table bbox-table" v-if="meta">
      <tbody>
        <tr>
          <th>bbox.bottomLeft</th>
          <td>{{ meta.bbox.bottomLeft.x }}, {{ meta.bbox.bottomLeft.y }}</td>
        </tr>
        <tr>
          <th>bbox.upperRight</th>
          <td>{{ meta.bbox.upperRight.x }}, {{ meta.bbox.upperRight.y }}</td>
        </tr>
        <tr>
          <th>размер (ш×в), м</th>
          <td>{{ width }} × {{ height }}</td>
        </tr>
        <tr>
          <th>relativeMapPosition</th>
          <td>x={{ rel?.x.toFixed(3) }}, y={{ rel?.y.toFixed(3) }}</td>
        </tr>
        <tr>
          <th>внутри bbox?</th>
          <td :class="inside ? 'true' : 'false'">{{ inside }}</td>
        </tr>
      </tbody>
    </table>
    <p class="debug-hint" v-else>Нет меты для game={{ game }} tag={{ tag }} gameplay={{ gameplay }}.</p>

    <div class="stage-box">
      <Minimap :tag="tag" :game="game" :gameplay="gameplay">
        <div class="marker" v-if="rel" :style="markerStyle" />
      </Minimap>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import Minimap from '@/shared/game/arenas/minimap/Minimap.vue'
import { getArenaMeta, relativeMapPosition } from '@/shared/game/arenas/arenas'
import { GameVendor } from '@/shared/game/wot'

const props = defineProps<{
  tag: string
  game: GameVendor
  gameplay: string
  pointX: number
  pointY: number
}>()

const meta = computed(() => getArenaMeta(props.game, props.tag, props.gameplay))
const width = computed(() => meta.value ? meta.value.bbox.upperRight.x - meta.value.bbox.bottomLeft.x : 0)
const height = computed(() => meta.value ? meta.value.bbox.upperRight.y - meta.value.bbox.bottomLeft.y : 0)

const rel = computed(() => {
  if (!meta.value) return null
  return relativeMapPosition({ x: props.pointX, y: props.pointY }, meta.value)
})

const inside = computed(() => !!rel.value && rel.value.x >= 0 && rel.value.x <= 1 && rel.value.y >= 0 && rel.value.y <= 1)

const markerStyle = computed(() => rel.value ? { left: `${rel.value.x * 100}%`, top: `${rel.value.y * 100}%` } : {})
</script>


<style scoped lang="scss">
.bbox-side {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.bbox-table th {
  white-space: nowrap;
  text-align: left;
}

.bbox-table td {
  text-align: left;
  font-family: var(--debug-mono);
  font-size: 12px;
}

.stage-box {
  position: relative;
  width: 240px;
  height: 240px;
  overflow: visible;
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ff3355;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #000a;
  pointer-events: none;
  z-index: 5;
}
</style>
