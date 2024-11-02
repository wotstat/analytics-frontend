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
          <tr v-for="line in data">
            <td v-if="!localizer">{{ line.titleName || line.title }}</td>
            <TableTitle v-else :title="localizer(line.title, line.titleName)" :leftAlign />
            <td class="n-mono text-effect gold">{{ line.count }}</td>

            <td v-if="displayOther && line.other" class="n-mono text-effect green"
              :class="getColor(line.other, line.percent)">
              {{ percentFormatter(line.percent) }}
              {{ Math.abs(line.other - line.percent) < 0.00001 ? '' : line.other > line.percent ? '↓' : '↑' }}
            </td>
            <td v-else class="n-mono text-effect green">{{ percentFormatter(line.percent) }}</td>


            <td v-if="displayOther && line.other" class="n-mono text-effect green">
              {{ percentFormatter(line.other) }}
            </td>
            <td v-if="byNumber" class="text-effect blue">
              {{ percentFormatter(Number(line.title) / byNumber * line.percent) }}
            </td>
          </tr>


          <tr>
            <th>Всего</th>
            <th class="n-mono text-effect gold">{{ data.reduce((a, v) => a + v.count, 0) }}</th>


            <th v-if="displayOther" class="n-mono text-effect" :class="getColor(otherSum, percentSum)">
              {{ percentFormatter(percentSum) }}
              {{ Math.abs(otherSum - percentSum) < 0.00001 ? '' : otherSum < percentSum ? '↑' : '↓' }} </th>
            <th v-else class="n-mono text-effect green">{{ percentFormatter(percentSum) }}</th>

            <th v-if="displayOther" class="n-mono text-effect green"> {{ percentFormatter(otherSum) }} </th>
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
import TableTitle from "./TableTitle.vue";
import { Status } from '@/db';
import { computed } from 'vue';

type LocalizedName = string | [name: string, region: string][]

const props = defineProps<{
  status: Status,
  data: {
    title: string,
    titleName?: LocalizedName,
    count: number,
    percent: number,
    other?: number
  }[],
  localizer?: (key: string, titleName?: LocalizedName) => string | { prefix?: string, postfix?: string, value: string },
  byNumber?: number,
  leftAlign?: boolean,
  showOther: boolean | undefined
}>()

const displayOther = computed(() => props.showOther !== false && props.data.some(line => line.other !== undefined));
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
@use '/src/styles/table.scss' as *;
@use '/src/styles/mixins.scss' as *;

.n-mono {
  font-variant-numeric: tabular-nums;
}

.container {
  overflow-x: auto;
}

.left-align {
  >* {
    text-align: left !important;
    ;
  }
}

table {
  width: 100%;
  border-collapse: collapse;


  &.by-number,
  &.with-other {

    th,
    td {
      @include less-large {
        width: 100px;

        &:first-child {
          width: 100px;
        }
      }
    }
  }

  th,
  td {

    text-align: center;
    padding: 0px 4px;
    width: 100px;
    text-wrap: nowrap;

    &:first-child {
      border-right: $border;
      width: 200px;
      text-wrap: balance;
    }

    @include less-large {
      width: 50px;

      &:first-child {
        width: 300px;
      }
    }
  }

  &:not(.with-other):not(.by-number) {

    th,
    td {
      &:not(:first-child) {
        width: 154px;
      }

      @include less-large {
        width: 50px;

        &:first-child {
          width: 300px;
        }
      }
    }
  }

  thead {
    border-bottom: $border;

    tr {
      th {
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