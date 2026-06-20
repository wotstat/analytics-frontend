<template>
  <div class="page-selection mt-font">
    <template v-for="value in pages" :key="page == value ? 'active' : value" v-if="pages.length > 1">
      <div class="ellipsis" v-if="value === 'ellipsis'">...
      </div>
      <button @click="click(value)" v-else-if="page !== value">
        {{ value }}
      </button>
      <input type="number" :value="page" @input="onInput" v-else class="active mt-font" :placeholder="page.toFixed(0)"
        @blur="onBlur" />
    </template>
  </div>
</template>


<script setup lang="ts">
import { computed, triggerRef } from 'vue'

const props = defineProps<{
  start: number
  end: number
}>()

const page = defineModel({
  type: Number,
  default: 1,
})

function click(pageNum: number) {
  page.value = pageNum
}

function onInput(v: InputEvent) {
  const value = parseInt(v.target instanceof HTMLInputElement ? v.target.value : '')
  if (!isNaN(value) && value >= props.start && value <= props.end) {
    page.value = value
  }
}

function onBlur() {
  triggerRef(page)
}

const pages = computed(() => {
  const result: (number | 'ellipsis')[] = []

  const delta = props.end - props.start
  if (delta <= 7) {
    for (let i = props.start; i <= props.end; i++) result.push(i)
    return result
  }

  if (page.value < 6) {
    for (let i = props.start; i <= 6; i++) result.push(i)
    result.push('ellipsis')
    result.push(props.end)
    return result
  }

  if (page.value > props.end - 5) {
    result.push(props.start)
    result.push('ellipsis')
    for (let i = props.end - 5; i <= props.end; i++) result.push(i)
    return result
  }

  result.push(props.start)
  result.push('ellipsis')
  for (let i = page.value - 2; i <= page.value + 2; i++) result.push(i)
  result.push('ellipsis')
  result.push(props.end)

  return result
})

</script>


<style lang="scss" scoped>
.page-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;

  button {
    padding: 2px;
    width: 50px;
    font-size: 14px;
    line-height: 1;
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.07s;
    border: none;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  .active {
    box-sizing: border-box;
    background-color: var(--blue-color);
    border: none;
    padding: 2px;
    width: 50px;
    text-align: center;
    border-radius: 5px;
    font-size: 14px;
    line-height: 1;

    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  .ellipsis {
    width: 20px;
    text-align: center;
    line-height: normal;
  }


}
</style>