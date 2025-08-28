<template>
  <div class="search">
    <Search class="search-icon" />
    <input type="text" :placeholder="placeholder ?? 'Поиск'" v-model="value" ref="searchInout" />
    <button class="clear-input" @click="value = ''" :class="value == '' ? 'empty' : ''">
      <X class="clear-icon" />
    </button>
  </div>
</template>


<script setup lang="ts">

import Search from './assets/search.svg'
import X from './assets/x.svg'

const props = defineProps<{
  placeholder?: string
}>()
const value = defineModel<string>({ required: true })
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