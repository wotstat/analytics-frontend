<template>
  <Item>
    <template #icon>
      <Icon :icon="'winrate'" class='icon' />
    </template>
    <template #value>
      <p class="value">{{ processor(value) }}</p>
    </template>
    <template #subline>
      <p class="text">{{ text }}</p>
    </template>
  </Item>
</template>


<script setup lang="ts">
import Item from './Item.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { createPercentProcessor } from '@/shared/utils/processors/processors'


const props = defineProps<{
  value: number,
  text: string
}>()

const processor = createPercentProcessor(2)
</script>


<style lang="scss" scoped>
.icon {
  width: 55px;
  height: 55px;
}

.text {
  font-size: 14px;
  opacity: 0.7;
  line-height: 1.2;
  margin-top: 2px;
}
</style>