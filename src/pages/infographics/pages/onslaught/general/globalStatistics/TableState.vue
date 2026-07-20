<template>
  <div class="state" :class="state.status">
    <Loader v-if="state.status === 'loading'" :is-loading="true" />
    <p v-else-if="state.status === 'empty'">По выбранным условиям данных нет</p>
    <div v-else-if="state.status === 'error'">
      <b>Не удалось загрузить данные</b>
      <p>{{ state.reason }}</p>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import Loader from '../../shared/Loader.vue'
import type { StatisticsLoadState } from './types'

defineProps<{
  state: StatisticsLoadState<T>
}>()
</script>

<style scoped lang="scss">
.state {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  text-align: center;

  &.loading {
    min-height: 3px;
  }

  &.error {
    align-items: flex-start;
    flex-direction: column;
    color: #e68484;
    text-align: left;

    p {
      margin: 3px 0 0;
      color: rgba(255, 255, 255, 0.55);
      overflow-wrap: anywhere;
    }
  }

  :deep(.loader) {
    width: 100%;
    height: 2px;
  }
}
</style>
