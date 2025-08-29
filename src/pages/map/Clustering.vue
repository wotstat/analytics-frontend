<template>
  <CanvasVue class="hover-canvas" @redraw="redraw"
    :key="renderKey + props.blurRadius + '_' + props.clusterPercentile" />
</template>

<script setup lang="ts">
import CanvasVue from '@/components/Canvas.vue'
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams'
import { query, queryComputed } from '@/db'
import { ArenaMeta } from '@/utils/arenas'
import { useDebounce } from '@vueuse/core'
import { type Range } from 'colorjs.io'
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import { blur, findIslands } from './utils'
import { BloomColor } from '@/pages/infographics/shared/bloomColors'

const renderKey = ref(0)

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
  cellsCount: number,
  blurRadius: number,
  clusterPercentile: number,
}>()

const params = useQueryStatParams()

const queryRequest = computed(() => {
  if (!props.map.meta) return null
  const cellCount = props.cellsCount

  const x = props.map.meta.boundingBox.x
  const z = props.map.meta.boundingBox.y

  const xStep = props.map.meta.boundingBox.width / cellCount
  const yStep = props.map.meta.boundingBox.height / cellCount

  return `
  with toFloat64(${props.efficiency.expression}) as efficiency
  select max2(0, min2(${cellCount - 1}, floor((gunPoint_x - ${x}) / ${xStep}))) as x,
         max2(0, min2(${cellCount - 1}, floor((gunPoint_z - ${z}) / ${yStep}))) as z,
       sumIf(efficiency, efficiency between ${props.efficiency.from} and ${props.efficiency.to}) as value2,
       toUInt32(sumIf(personal.damageDealt, arrayMax(results.shotDamage) > 0)) as value,
       toUInt32(count()) as count
from Event_OnShot
join WOT.Event_OnBattleResult Result on Event_OnShot.onBattleStartId = Result.onBattleStartId
where arenaTag = '${props.map.arena}'
      and team = ${props.map.team}
      and battleGameplay = '${props.map.gameplay}'
      and battleTime >= ${props.period.from * 1000}
      and battleTime <= ${props.period.to * 1000}
      ${whereClause(params, { withWhere: false })}
      and duration > 60 * 5
      // and result = 'lose'
      // and tankLevel = 10
      // and personal.damageDealt > 3000
      // and arrayFirstIndex(t -> t.2 = personal.damageDealt, arrayReverseSort(t-> t.2, arrayFilter(t -> t.1 = playerTeam, arrayZip(playersResults.team, playersResults.damageDealt)))) < 3
group by x, z
having count > 1
`})

const response = queryComputed<{ x: number, z: number, value: number }>(() => queryRequest.value)
const heatmapData = shallowRef<{ x: number, z: number, value: number }[]>([])

watch(response, (v) => {
  heatmapData.value = v.data
  renderKey.value++
  console.log('got')
}, { deep: true })

watch(queryRequest, () => {
  heatmapData.value = []
  renderKey.value++
  console.log('reset')

}, { deep: true })


const threshold = 0.02

function redraw(ctx: CanvasRenderingContext2D, width: number, height: number) {
  if (heatmapData.value.length == 0) return
  const cellCount = props.cellsCount

  const grid = new Array(cellCount).fill(0).map(() => new Array(cellCount).fill({ value: 0 })) as { value: number }[][]
  const cellWidth = width / cellCount
  const cellHeight = height / cellCount

  for (const { x, z, value } of heatmapData.value) {
    grid[x][z] = { value }
  }

  const blurred = blur(grid.map(t => t.map(t => t.value)), props.blurRadius)
  const max = Math.max(...blurred.map(row => Math.max(...row)))
  if (max === 0) return

  for (let x = 0; x < cellCount; x++) {
    for (let z = 0; z < cellCount; z++) {
      const value = blurred[x][z]
      if (value / max < threshold) continue

      const color = props.colorRange(value / max * 2)
      ctx.fillStyle = color.toString()
      ctx.fillRect(x * cellWidth, height - z * cellHeight, cellWidth, -cellHeight)

      ctx.strokeStyle = 'black'
      ctx.lineWidth = 0.1
      ctx.strokeRect(x * cellWidth, height - z * cellHeight, cellWidth, -cellHeight)
    }
  }

  const islands = findIslands(blurred.map(row => row.map(value => value / max < threshold ? 0 : 1)))
  for (const island of islands) island.processGrid(grid)
  const maxIslandValue = Math.max(...islands.map(island => island.totalValue / island.points.length))
  const sumIslandValue = islands.reduce((acc, island) => acc + island.totalValue, 0)

  islands.sort((a, b) => b.totalValue - a.totalValue)

  let currentClustersSum = 0
  for (const island of islands) {
    if (currentClustersSum / sumIslandValue > props.clusterPercentile) break
    currentClustersSum += island.totalValue
    const density = island.totalValue / island.points.length / maxIslandValue
    const color = props.colorRange(density)
    ctx.fillStyle = color.toString()

    for (const point of island.points) {
      ctx.fillRect(point.x * cellWidth, height - point.y * cellHeight, cellWidth, -cellHeight)
    }

    ctx.strokeStyle = BloomColor.blue.main
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    for (const line of island.traceOutline()) {
      ctx.beginPath()
      for (const point of line) {
        ctx.lineTo(point.x * cellWidth, height - point.y * cellHeight)
      }
      ctx.closePath()
      ctx.stroke()
    }

  }

}

</script>