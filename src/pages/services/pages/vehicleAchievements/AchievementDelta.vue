<template>
  <span v-if="value !== null && value !== 0" class="delta" :class="value > 0 ? 'up' : 'down'">
    <TriangleUp class="triangle" />
    {{ spaceProcessor(Math.abs(value)) }}
  </span>
  <span v-else class="no-change" v-tooltip="value === null ? 'Нет данных за дату сравнения' : 'Без изменений'">–</span>
</template>

<script setup lang="ts">
import { spaceProcessor } from '@/shared/utils/processors/useSpaceProcessor'
import TriangleUp from './assets/triangle-up.svg'

defineProps<{ value: number | null }>()
</script>

<style scoped lang="scss">
.delta {
  white-space: nowrap;

  .triangle {
    display: inline-block;
    width: 0.6em;
    height: 0.6em;
  }

  &.up {
    color: #57ff6e;
  }

  &.down {
    color: #ff6060;

    .triangle {
      transform: rotate(180deg);
    }
  }
}

.no-change {
  color: #717171;
}
</style>
