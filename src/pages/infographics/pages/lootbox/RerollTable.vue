<template>
  <h3>Количество отказов (замен)</h3>
  <div class="card">
    <table class="hover-highlight full-screen-table"
      :class="showOther && data[0].totalCount != undefined ? 'with-other' : ''">
      <thead class="border-bottom">
        <tr>
          <th class="border-right">Название</th>
          <th>Количество</th>
          <th>Процент</th>
          <th v-if="showOther && data[0].totalCount != undefined">Должно быть</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in withPercent">
          <td class="border-right">{{ localizer(item.tag, item.locale).value }}</td>
          <td class="n-mono text-effect gold">{{ item.rerollCount }} / {{ item.count }}</td>

          <td v-if="showOther && item.other" class="n-mono text-effect green"
            :class="getColor(item.other, item.percent)">
            {{ (item.percent * 100).toFixed(2) }}%
            {{ Math.abs(item.other - item.percent) < 0.00001 ? '' : item.other > item.percent ? '↓' : '↑' }}
          </td>
          <td v-else class="n-mono text-effect green">{{ (item.percent * 100).toFixed(2) }}%</td>

          <td class="n-mono text-effect green" v-if="showOther && data[0].totalCount != undefined">
            {{ ((item.totalReroll ?? 0) / (item.totalCount ?? 1) * 100).toFixed(2) }}%
          </td>
        </tr>

      </tbody>
    </table>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'

type LocalizedName = string | [name: string, region: string][]

const props = defineProps<{
  data: {
    tag: string,
    count: number,
    rerollCount: number,
    locale: LocalizedName,
    totalCount?: number,
    totalReroll?: number
  }[],
  showOther?: boolean,
  localizer: (key: string, titleName?: LocalizedName) => { prefix?: string, postfix?: string, value: string },
}>()

const withPercent = computed(() => props.data.map(l => ({
  ...l,
  percent: l.rerollCount / l.count,
  other: l.totalReroll && l.totalCount ? l.totalReroll / l.totalCount : undefined
})))


function getColor(left: number, right: number) {
  return Math.abs(left - right) < 0.00001 ? 'yellow' : left > right ? 'red' : 'green'
}

</script>


<style lang="scss" scoped>
@use '/src/styles/table.scss' as *;
@use '/src/styles/mixins.scss' as *;

.full-screen-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    tr {
      th {
        padding-bottom: 5px;
      }
    }
  }

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

  &:not(.with-other) {

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

  th,
  td {
    text-align: center;
    padding: 0px 4px;
    width: 100px;
    text-wrap: nowrap;

    &:first-child {
      width: 200px;
      text-wrap: balance;
    }
  }
}
</style>