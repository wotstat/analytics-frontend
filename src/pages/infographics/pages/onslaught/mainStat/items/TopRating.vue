<template>
  <Item>
    <template #icon>
      <RankIcon :rank="{ value: value, eliteRating: eliteRating }" :size="'medium'" :season :game class='icon' />
    </template>
    <template #value>
      <p>{{ value }}</p>
    </template>
    <template #subline>
      <p class="text">
        <span class="semi-transparent">Рекорд</span> <a @click.stop="emit('selectDay', day)">
          день {{ day }}</a>
      </p>
    </template>
  </Item>
</template>


<script setup lang="ts">
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import Item from './Item.vue'
import { GameVendor } from '@/shared/game/wot'

const props = defineProps<{
  value: number,
  eliteRating: number
  day: number
  season?: string
  game?: GameVendor
}>()

const emit = defineEmits<{
  (e: 'selectDay', dayIndex: number): void
}>()

</script>


<style lang="scss" scoped>
.icon {
  height: 100%;
}

.text {
  font-size: 14px;
  line-height: 1.2;

  .semi-transparent {
    opacity: 0.7;
  }

  a {
    cursor: pointer;
    color: #9ad7ff;
    white-space: nowrap;

    &:hover {
      text-decoration: underline;
    }
  }
}

:deep(.normal) {
  .text {
    margin-top: 2px;
  }

  .text,
  .value {
    margin-left: 8px;
  }
}

:deep(.small) {
  .icon {
    height: 80%;
    margin-left: -2px;
  }

  .value {
    margin-left: 2px;
  }
}
</style>