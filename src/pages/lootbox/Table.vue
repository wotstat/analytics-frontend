<template>
  <ServerStatusWrapper :status="status" v-slot="{ showError, status }">
    <div class="container" ref="container" v-if="status != 'error'">

      <table class="hover-highlight" :class="[displayOther ? 'with-other' : '', byNumber ? 'by-number' : '']">
        <thead>
          <tr>
            <th>Название</th>
            <th>Количество</th>
            <th>Процент</th>
            <th v-if="displayOther">У других</th>
            <th v-if="byNumber">На {{ byNumber }}</th>
          </tr>
        </thead>


        <tbody>
          <!-- <tr v-for="(p, i) in processed?.slice(0, 3)" :class="status == 'loading' ? 'skeleton' : ''">
            <td class="ignore-skeleton">{{ { 0: 'Одноуровневый', 1: 'Двухуровневый', 2: 'Трёхуровневый' }[i] }}</td>
            <td class="text-effect red">{{ p[0] }}</td>
            <td class="text-effect orange">{{ p[1] }}</td>
            <td class="text-effect green">{{ p[2] }}</td>
            <td class="text-effect blue">{{ p[3] }}</td>
          </tr> -->

          <tr v-for="line in data">
            <td>{{ localizer ? localizer(line.title) : line.title }}</td>
            <td class="n-mono text-effect gold">{{ line.count }}</td>
            <td class="n-mono text-effect green">{{ percentFormatter(line.percent) }}</td>
            <td class="n-mono text-effect" :class="getColor(line.other, line.percent)"
              v-if="displayOther && line.other">
              {{ percentFormatter(line.other) }}
              {{ Math.abs(line.other - line.percent) < 0.00001 ? '' : line.other > line.percent ? '↓' : '↑' }}
            </td>
            <td v-if="byNumber" class="text-effect blue">
              {{ percentFormatter(Number(line.title) / byNumber * line.percent) }}
            </td>
          </tr>


          <tr>
            <th>Всего</th>
            <th class="n-mono text-effect gold">{{ data.reduce((a, v) => a + v.count, 0) }}</th>
            <th class="n-mono text-effect green">{{ percentFormatter(percentSum) }}</th>
            <th v-if="displayOther" class="n-mono text-effect" :class="getColor(otherSum, percentSum)">
              {{ percentFormatter(otherSum) }}
              {{ otherSum > percentSum ? '↓' : otherSum < percentSum ? '↑' : '' }} </th>
            <th v-if="byNumber" class="n-mono text-effect blue">
              {{ percentFormatter(data.reduce((a, v) => a + (Number(v.title) * v.percent / (byNumber ?? 1)), 0)) }}
            </th>
          </tr>
        </tbody>


      </table>

    </div>

    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>

<script lang="ts" setup>

import ServerStatusWrapper from '@/components/ServerStatusWrapper.vue';
import { Status } from '@/db';
import { computed } from 'vue';

const props = defineProps<{
  status: Status,
  data: {
    title: string,
    count: number,
    percent: number,
    other?: number
  }[],
  localizer?: (key: string) => string,
  byNumber?: number
}>()

const displayOther = computed(() => props.data.some(line => line.other !== undefined));
const percentSum = computed(() => props.data.reduce((a, v) => a + v.percent, 0));
const otherSum = computed(() => props.data.reduce((a, v) => a + (v.other ?? 0), 0));

function percentFormatter(value: number) {
  if (value === 0) return '-';
  return (Math.round(value * 100 * 1000) / 1000).toFixed(3) + '%';
}

function getColor(left: number, right: number) {
  return Math.abs(left - right) < 0.00001 ? 'yellow' : left > right ? 'red' : 'green';
}


</script>

<style lang="scss" scoped>
@import '/src/styles/table.scss';

.n-mono {
  font-variant-numeric: tabular-nums;
}

.container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {

    text-align: center;
    padding: 0px 4px;

    &:first-child {
      border-right: $border;
    }
  }

  &.with-other:not(.by-number),
  &.by-number:not(.with-other) {
    tr {
      th {
        width: 25%;
      }
    }
  }

  &.with-other.by-number {
    tr {
      th {
        width: 20%;
      }
    }
  }

  thead {
    border-bottom: $border;

    tr {
      th {
        width: 33%;
        padding-bottom: 5px;
      }
    }
  }

  tbody {
    tr {

      &:last-child {
        border-top: $border;

        td,
        th {
          padding-top: 2px;
        }
      }
    }
  }
}
</style>