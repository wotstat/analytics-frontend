<template>
  <Item>
    <template #icon>
      <Icon :icon="icon" class='icon' />
    </template>
    <template #value>
      <p class="value">{{ value }}</p>
    </template>
    <template #subline>
      <p class="text">{{ text }}</p>
    </template>
  </Item>
</template>


<script setup lang="ts">
import Item from './Item.vue'
import { IconType } from '@/shared/game/efficiencyIcon/utils'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'


const props = defineProps<{
  icon: IconType,
  value: string | number,
  text: string
}>()
</script>


<style lang="scss" scoped>
.icon {
  height: 100%;
}

.text {
  font-size: 14px;
  opacity: 0.7;
  line-height: 1.2;
}

:deep(.normal) {
  .text {
    margin-top: 2px;
  }
}

:deep(.small) {
  .icon {
    margin-left: -4px;
    opacity: 0.8;
  }
}
</style>