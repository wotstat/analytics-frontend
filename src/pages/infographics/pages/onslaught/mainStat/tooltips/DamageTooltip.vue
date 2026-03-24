<template>
  <div class="damage-tooltip">
    <div class="line">
      <Icon :icon="'shots'" class="icon" />
      <p>Выстрелов: <span class="value mt-font">{{ roundProcessor(shots) }}</span></p>
    </div>

    <div class="line">
      <Icon :icon="'hits'" class="icon" />
      <p>Попаданий: <span class="value mt-font">{{ roundProcessor(hits) }}</span></p>
    </div>

    <div class="line">
      <Icon :icon="'piercing'" class="icon" />
      <p>Пробитий: <span class="value mt-font">{{ roundProcessor(piercing) }}</span></p>
    </div>

    <hr>

    <div class="line">
      <p>Максимум: <span class="value mt-font">{{ maxDamage }}</span></p>
    </div>
  </div>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { createFixedProcessor } from '@/shared/utils/processors/processors'




const props = defineProps<{
  shots: number
  hits: number
  piercing: number
  maxDamage: number
}>()

const roundProcessor = createFixedProcessor(1)

</script>


<style lang="scss" scoped>
.damage-tooltip {
  margin-bottom: -5px;
  width: 160px;
}

.line {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;

  &.right {
    p {
      display: flex;
      align-items: baseline;

      .value {
        flex: 1;
        text-align: right;
      }
    }
  }

  .icon {
    height: 30px;
    margin: -10px;
    margin-right: -7px;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.3;
    flex: 1;
  }

  .value {
    font-weight: bold;
    font-size: 15px;
    line-height: 1;
  }
}

hr {
  margin: 5px 0;

  border: none;
  border-bottom: 1px solid var(--color-separator, #54545899);
}
</style>