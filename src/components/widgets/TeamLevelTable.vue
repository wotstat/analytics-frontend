<template>
  <ServerStatusWrapper :status="result.status" v-slot="{ showError, status }">
    <div class="container" ref="container" v-if="status != 'error'">

      <table class="hover-highlight">
        <thead>
          <tr>
            <th>Сетап боя</th>
            <th>-2</th>
            <th>-1</th>
            <th>ТОП</th>
            <th>Всего</th>
          </tr>
        </thead>


        <tbody>
          <tr v-for="(p, i) in processed?.slice(0, 3)" :class="status == 'loading' ? 'skeleton' : ''">
            <td class="ignore-skeleton">{{ { 0: 'Одноуровневый', 1: 'Двухуровневый', 2: 'Трёхуровневый' }[i] }}</td>
            <td class="text-effect red">{{ p[0] }}</td>
            <td class="text-effect orange">{{ p[1] }}</td>
            <td class="text-effect green">{{ p[2] }}</td>
            <td class="text-effect blue">{{ p[3] }}</td>
          </tr>


          <tr>
            <th>Всего</th>
            <td class="text-effect red"><b>{{ processed?.[3][0] }}</b></td>
            <td class="text-effect orange"><b>{{ processed?.[3][1] }}</b></td>
            <td class="text-effect green"><b>{{ processed?.[3][2] }}</b></td>
            <td></td>
          </tr>
        </tbody>


      </table>

    </div>

    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>

<script setup lang="ts">
import { usePercentProcessor } from '@/composition/usePercentProcessor';
import { StatParams, getQueryStatParamsCache, whereClause } from '@/composition/useQueryStatParams';
import { queryAsync } from '@/db';
import { useElementVisibility } from '@vueuse/core';
import { computed, ref, watchEffect } from 'vue';
import ServerStatusWrapper from '../ServerStatusWrapper.vue';


const { params } = defineProps<{
  params: StatParams
}>()

const container = ref<HTMLElement | null>(null);
const enabled = useElementVisibility(container);


const result = queryAsync<{
  battleType: 1 | 2 | 3,
  position: 0 | -1 | -2,
  percent: number
}>(`
select length(visibleLevels)       as battleType,
       position,
       sum(count)                 as count,
       count / sum(count) over () as percent
from (select visibleLevels,
             tankLevel,
             tankLevel - arrayMax(visibleLevels) as position,
             count()                             as count
      from Event_OnBattleResult
      ${params ? whereClause(params) : ''}
      group by visibleLevels, tankLevel)
group by battleType, position
order by battleType, position;
`, { enabled, settings: getQueryStatParamsCache(params) })

const processed = computed(() => {
  if (!result.value) return null

  const data = result.value.data

  const singleLevel = data.find(r => r.battleType == 1)
  const doubleLevelTop = data.find(r => r.battleType == 2 && r.position == 0)
  const doubleLevel = data.find(r => r.battleType == 2 && r.position == -1)

  const tripleLevelTop = data.find(r => r.battleType == 3 && r.position == 0)
  const tripleLevelMiddle = data.find(r => r.battleType == 3 && r.position == -1)
  const tripleLevel = data.find(r => r.battleType == 3 && r.position == -2)

  const res = [
    [null, null, singleLevel?.percent],
    [null, doubleLevel?.percent, doubleLevelTop?.percent],
    [tripleLevel?.percent, tripleLevelMiddle?.percent, tripleLevelTop?.percent],
  ].map(r => [...r, r.reduce((a, b) => a as number + (b ?? 0), 0)])

  res.push([
    res.reduce((a, b) => a as number + (b[0] ?? 0), 0),
    res.reduce((a, b) => a as number + (b[1] ?? 0), 0),
    res.reduce((a, b) => a as number + (b[2] ?? 0), 0),
  ])

  return res.map(r => r.map(t => t ? usePercentProcessor(1)(t) : null))
})

</script>


<style scoped lang="scss">
@use '/src/styles/table.scss' as *;

.container {
  overflow-x: auto;

  table {
    border-collapse: collapse;
    width: 100%;
    position: relative;
    z-index: 5;

    th,
    td {
      text-align: center;
      width: 20%;
      padding: 0 4px;
    }

    th:nth-child(1),
    td:nth-child(1),
    td:nth-child(4),
    th:nth-child(4) {
      border-right: $border;
    }

    tr {

      th,
      td {
        @for $i from 2 through 4 {
          &:nth-child(#{$i}) {
            // width: 5%;
          }
        }
      }

    }

    thead {
      border-bottom: $border;
    }

    tbody {
      tr:nth-child(3) {
        border-bottom: $border;
      }
    }
  }
}
</style>