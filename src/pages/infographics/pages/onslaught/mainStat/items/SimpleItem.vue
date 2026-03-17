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
import { IconType } from '@/shared/game/efficiencyIcon/utils'
import Item from './Item.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'


const props = defineProps<{
  icon: IconType,
  value: string | number,
  text: string
}>()
</script>


<style lang="scss" scoped>
.icon {
  width: 55px;
  height: 55px;
}

.value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.text {
  font-size: 14px;
  opacity: 0.7;
  line-height: 1.2;
}
</style>