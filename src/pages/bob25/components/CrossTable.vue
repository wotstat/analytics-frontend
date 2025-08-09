<template>
  <div class="line">
    <h3>{{ title }}</h3>
    <table class="cross-table bold mt3-font" ref="table" cellspacing="0" cellpadding="0" :style="{
      '--hovered-i': hovered?.i,
      '--hovered-j': hovered?.j
    }" :class="{
      [`hovered-row-${hovered?.i}`]: hovered?.i,
      [`hovered-col-${hovered?.j}`]: hovered?.j
    }">
      <tbody>
        <tr>
          <td class="empty">
            <div class="drop-down-container">
              <DropDown :variants="crossPeriodVariants" v-model="crossTablePeriod" />
            </div>
          </td>
          <td v-for="(item, i) in bloggerNamesArray">
            <BloggerName :blogger="i" small-bloom />
          </td>
        </tr>
        <tr v-for="(item, blogRowIndex) in bloggerNamesArray">
          <td>
            <BloggerName :blogger="blogRowIndex" small-bloom />
          </td>
          <td v-for="(item, blogColIndex) in bloggerNamesArray" :class="{
            'red': percents[blogRowIndex][blogColIndex] == Math.min(...percents[blogRowIndex].filter(t => t != 0)),
            'green': percents[blogRowIndex][blogColIndex] == Math.max(...percents[blogRowIndex].filter(t => t != 0))
          }">
            <template v-if="blogRowIndex != blogColIndex">
              {{ format(percents[blogRowIndex][blogColIndex]) }}%
            </template>
            <template v-else>
              –
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
import BloggerName from './blogger/BloggerName.vue'
import { bloggerNamesArray } from './bloggerNames'
import DropDown from '@/components/dropdown/DropDown.vue'
import { crossPeriodVariants, crossTablePeriod } from '../store'


const table = ref<HTMLTableElement | null>(null)
const hovered = ref<{ i: number, j: number } | null>(null)
const disposer: (() => void)[] = []

const props = defineProps<{
  percents: number[][],
  title: string,
  digits: number
}>()

function hover(i: number, j: number) {
  hovered.value = { i, j }
}

function unHover(i: number, j: number) {
  if (hovered.value?.i == i && hovered.value?.j == j) {
    hovered.value = null
  }
}

function format(value: number) {
  return (Math.round(100 * value * Math.pow(10, props.digits)) / Math.pow(10, props.digits)).toFixed(props.digits)
}

watch(table, (t, old) => {

  if (disposer.length) {
    disposer.forEach(d => d())
    disposer.length = 0
  }

  if (t) {
    const rows = t.rows
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].cells.length; j++) {
        const cell = rows[i].cells[j]

        const pointerover = () => hover(i, j)
        const pointerout = () => unHover(i, j)
        disposer.push(() => {
          cell.removeEventListener('pointerover', pointerover)
          cell.removeEventListener('pointerout', pointerout)
        })
        cell.addEventListener('pointerover', pointerover)
        cell.addEventListener('pointerout', pointerout)

      }
    }
  }
})


</script>


<style lang="scss" scoped>
h3 {
  margin: 0;
  margin-bottom: 5px;
}

table {
  width: 100%;
  color: white;

  td {
    padding: 5px;
    text-align: center;
    width: 20%;

    h2 {
      margin: 0;
      font-size: 18px;

      @media screen and (max-width: 900px) {
        font-size: 16px;
      }

      @media screen and (max-width: 600px) {
        font-size: 14px;
      }
    }

    &:not(.empty) {
      background-color: rgba(102, 102, 102, 0.15);
    }

    &.empty {
      position: relative;

      .drop-down-container {
        position: absolute;
        inset: 0;
        font-weight: normal;
        text-align: left;
        padding-right: 3px;
        padding-top: 1px;
      }
    }

    &.red {
      color: rgb(255, 226, 223);
    }

    &.green {
      color: rgb(228, 255, 229);
    }
  }

  tr {
    position: relative;

    td {
      position: relative;
    }
  }

  $border-radius: 15px;

  tr {
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background-color: transparent;
      border-radius: $border-radius;
      pointer-events: none;
      z-index: -1;
    }

    td {
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background-color: transparent;
        pointer-events: none;
        z-index: -1;
      }
    }

    &:last-child td::after {
      border-bottom-left-radius: $border-radius;
      border-bottom-right-radius: $border-radius;
    }

    &:first-child td::after {
      border-top-left-radius: $border-radius;
      border-top-right-radius: $border-radius;
    }
  }


  &.hovered-row-1 tr:nth-child(2)::after,
  &.hovered-row-2 tr:nth-child(3)::after,
  &.hovered-row-3 tr:nth-child(4)::after,
  &.hovered-row-4 tr:nth-child(5)::after,
  &.hovered-col-1 td:nth-child(2)::after,
  &.hovered-col-2 td:nth-child(3)::after,
  &.hovered-col-3 td:nth-child(4)::after,
  &.hovered-col-4 td:nth-child(5)::after {
    background-color: rgba(255, 255, 255, 0.025);
  }

  tr:first-child td:last-child {
    border-top-right-radius: $border-radius;
  }

  tr:first-child td:nth-child(2) {
    border-top-left-radius: $border-radius;
  }

  tr:last-child td:last-child {
    border-bottom-right-radius: $border-radius;
  }

  tr:last-child td:first-child {
    border-bottom-left-radius: $border-radius;
  }

  tr:nth-child(2) td:first-child {
    border-top-left-radius: $border-radius;
  }
}
</style>