<template>
  <CanvasVue class="hover-canvas" @redraw="redraw" ref="canvasRef" />
</template>

<script setup lang="ts">

import CanvasVue from "@/components/Canvas.vue";
import { useQueryStatParams, whereClause } from "@/composition/useQueryStatParams";
import { query } from "@/db";
import { ArenaMeta } from "@/utils/arenas";
import { useDebounce } from "@vueuse/core";
import { type Range } from 'colorjs.io';
import { computed, ref, shallowRef, watch } from "vue";

const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null)

const props = defineProps<{
  colorRange: Range,
  efficiency: { expression: string, from: number, to: number },
  map: {
    meta: ArenaMeta | null,
    arena: string,
    team: number,
    gameplay: string,
  },
  period: { from: number, to: number },
}>()

const params = useQueryStatParams()


const cellCount = 50
const size = computed(() => {
  if (!props.map.meta) return null
  return {
    xStep: props.map.meta.boundingBox.width / cellCount,
    yStep: props.map.meta.boundingBox.height / cellCount,
    meta: props.map.meta,
    bottomLeft: {
      x: props.map.meta.boundingBox.x,
      z: props.map.meta.boundingBox.y,
    },
    topRight: {
      x: props.map.meta.boundingBox.x + props.map.meta.boundingBox.width,
      z: props.map.meta.boundingBox.y + props.map.meta.boundingBox.height,
    },
  }
})

const queryRequest = computed(() => {
  if (!size.value) return null

  console.log(size.value);

  return `
  with toFloat64(${props.efficiency.expression}) as efficiency
  select max2(0, min2(${cellCount - 1}, floor((gunPoint_x - ${size.value.bottomLeft.x}) / ${size.value.xStep}))) as x,
         max2(0, min2(${cellCount - 1}, floor((gunPoint_z - ${size.value.bottomLeft.x}) / ${size.value.yStep}))) as z,
       sumIf(efficiency, efficiency between ${props.efficiency.from} and ${props.efficiency.to}) as value,
       toUInt32(count()) as count
from Event_OnShot
where arenaTag = '${props.map.arena}'
      and team = ${props.map.team}
      and battleGameplay = '${props.map.gameplay}'
      and battleTime >= ${props.period.from * 1000}
      and battleTime <= ${props.period.to * 1000}
      // and efficiency >= ${props.efficiency.from}
      // and efficiency <= ${props.efficiency.to}
      ${whereClause(params, { withWhere: false })}
group by x, z
`})

const debouncedQueryRequest = useDebounce(queryRequest, 500)
watch(debouncedQueryRequest, async (request) => {
  if (!request) return

  const response = await query<{ x: number, z: number, count: number, value: number }>(request)
  const res = new Array(cellCount).fill(0).map(() => new Array(cellCount).fill(0)) as number[][]

  for (const row of response.data) {
    const x = row.x
    const z = row.z
    res[x][z] = row.value
  }

  currentHeatmap.value = res
  canvasRef.value?.redraw()
}, { immediate: true })

const currentHeatmap = shallowRef<number[][] | null>(null)

function redraw(ctx: CanvasRenderingContext2D, width: number, height: number) {

  const heatmap = currentHeatmap.value
  if (!heatmap) return

  const cellWidth = width / cellCount
  const cellHeight = height / cellCount

  const maxValue = Math.max(...heatmap.flat())

  for (let x = 0; x < cellCount; x++) {
    for (let y = 0; y < cellCount; y++) {
      const value = heatmap[x][y]

      ctx.globalAlpha = 0.5
      const color = props.colorRange(value / maxValue)
      ctx.fillStyle = color.toString()
      ctx.fillRect(x * cellWidth, height - y * cellHeight, cellWidth, -cellHeight)

      // ctx.strokeRect(x * cellWidth, height - y * cellHeight, cellWidth, -cellHeight)

      ctx.fillStyle = "white"
      ctx.font = "5px Arial"

      ctx.globalAlpha = 1
      // ctx.fillText(value.toFixed(1), x * cellWidth + 5, height - y * cellHeight - 5)

      // ctx.globalAlpha = 0.5
    }
  }
}
</script>