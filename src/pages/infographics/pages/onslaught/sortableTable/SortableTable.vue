<template>
  <table :style="{ '--cols': cols }">
    <thead>
      <tr>
        <th v-for="j in cols" :class="{
          'orderable': isOrderable ? isOrderable(j - 1) : true,
          'order-by': orderBy == j - 1,
          'asc': orderDirection == 'asc',
          'desc': orderDirection == 'desc',
        }">
          <button @click="click(j - 1)"></button>
          <slot v-bind="{ col: j - 1 }" name="head-cell"></slot>
          <div class="arrow"></div>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="line, i in displayedData" :key="line.index">
        <slot v-for="value, j in line.data" v-bind="{ value, index: line.index, row: i, col: j }" name="data-cell">
        </slot>
      </tr>
    </tbody>
  </table>
</template>


<script setup lang="ts" generic="T extends number | string | { sortKey: number | string }">
import { computed, ref } from 'vue'

const props = defineProps<{
  cols: number
  data: T[][]
  limit?: number
  isOrderable?: (index: number) => boolean
  defaultOrderBy?: number
  defaultOrderDirection?: 'asc' | 'desc'
}>()

const orderBy = ref(props.defaultOrderBy ?? 1)
const orderDirection = ref<'asc' | 'desc'>(props.defaultOrderDirection ?? 'desc')

const displayedData = computed(() => {
  const dataWithKeys = props.data.map((line, index) => {
    const value = line[orderBy.value]
    const sortKey = typeof value === 'object' && 'sortKey' in value ? value.sortKey : value
    return { line, sortKey, index }
  })

  const direction = orderDirection.value == 'asc' ? 1 : -1

  const comparator = (a: typeof dataWithKeys[0], b: typeof dataWithKeys[0]) => {
    if (typeof a.sortKey === 'string' && typeof b.sortKey === 'string') return a.sortKey.localeCompare(b.sortKey) * direction
    if (a.sortKey < b.sortKey) return -direction
    if (a.sortKey > b.sortKey) return direction
    return 0
  }

  const sortedData = dataWithKeys.sort(comparator)

  return sortedData
    .map(item => ({
      data: item.line,
      index: item.index
    }))
    .slice(0, props.limit ?? props.data.length)
})


function click(col: number) {

  if (props.isOrderable && !props.isOrderable(col)) return

  if (orderBy.value == col) {
    orderDirection.value = orderDirection.value == 'asc' ? 'desc' : 'asc'
  } else {
    orderBy.value = col
    orderDirection.value = 'desc'
  }
}
</script>


<style lang="scss" scoped>
table {
  width: 100%;
  border-collapse: collapse;

  thead {

    tr {

      td,
      th {
        width: calc((100% - 25%) / (var(--cols, 2) - 1));
      }

      td:first-child,
      th:first-child {
        width: 25%;
      }

      th {
        position: relative;

        button {
          display: none;
          position: absolute;
          inset: 0;
        }

        &.orderable {
          cursor: pointer;
          transition: background-color 0.1s;

          button {
            display: block;
          }


          @media (hover: hover) {
            &:hover {
              background-color: rgba(255, 255, 255, 0.025);

              &.order-by {
                background-color: rgba(255, 255, 255, 0.04);
              }
            }
          }
        }

        &.order-by {
          background-color: rgba(255, 255, 255, 0.025);

          .arrow {
            opacity: 0.8;

            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
            bottom: 0px;

            background-color: white;

            &::after {
              content: '';
              position: absolute;
              left: 50%;
              top: 0;
              transform: translate(-50%, 0%);
              width: 13px;
              height: 5px;
              background-color: white;
              clip-path: polygon(0 0, 100% 0, 50% 100%);
            }
          }

          &.asc {
            .arrow {
              &::after {
                top: auto;
                bottom: 0;
                transform: translate(-50%, 0%) rotate(180deg);
              }
            }
          }
        }
      }
    }
  }

  tbody {
    tr {
      &:nth-child(2n+1) {
        background-color: rgba(248, 252, 255, 0.025);
      }

      td {
        text-align: center;
      }
    }
  }
}
</style>