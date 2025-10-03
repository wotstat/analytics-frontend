<template>
  <div class="search">
    <Search class="search-icon" />
    <input name="search" type="text" :placeholder="placeholder ?? 'Поиск'" v-model="value" ref="searchInput" />
    <button class="clear-input" @click="value = ''" :class="value == '' ? 'empty' : ''">
      <X class="clear-icon" />
    </button>
  </div>
</template>


<script setup lang="ts">

import { useMediaQuery } from '@vueuse/core'
import Search from './assets/search.svg'
import X from './assets/x.svg'
import { onMounted, ref } from 'vue'

const searchInput = ref<HTMLInputElement | null>(null)

const props = defineProps<{
  placeholder?: string
  autofocus?: boolean
}>()

const value = defineModel<string>({ required: true })

const isPc = useMediaQuery('(hover: hover) and (pointer: fine)')

onMounted(() => {
  if (isPc.value && props.autofocus) setTimeout(() => searchInput.value?.focus(), 0)
})
</script>


<style lang="scss" scoped>
.search {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  display: flex;
  align-items: center;
  height: 30px;

  input {
    border: none;
    background-color: transparent;
    flex: 1;
    height: 100%;
    min-width: 0;
    font-size: 14px;
    padding: 0;
  }

  .search-icon {
    height: 15px;
    min-width: 15px;
    margin: 0 8px;
    fill: currentColor;
  }

  .clear-input {
    padding: 5px;
    margin: 0 2px;
    background-color: #d1d1d100;
    border: none;
    position: relative;
    cursor: pointer;
    transition: opacity 0.2s;

    &.empty {
      display: none;
      opacity: 0;
    }

    &:not(.empty):hover {
      .clear-icon {
        color: #d1d1d1;
      }
    }

    .clear-icon {
      display: block;
      height: 11px;
      fill: currentColor;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 2px;
      background-color: rgba(255, 255, 255, 0);
      border-radius: 20px;
      transition: background-color 0.2s;
    }

    &:hover {
      &::before {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
  }
}
</style>