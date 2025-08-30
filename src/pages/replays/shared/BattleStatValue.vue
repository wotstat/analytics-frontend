<template>
  <div class="item-parent">
    <Tooltip highlight>
      <template #tooltip>
        <p class="tooltip">{{ tooltip }}</p>
      </template>
      <div class="item">
        <Icon :icon="icon" />
        <p>{{ value }}</p>
      </div>
    </Tooltip>
  </div>
</template>

<script lang="ts" setup>
import DmgIcon from '@/assets/efficiency-icon/dmg.png'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { IconType } from '@/shared/game/efficiencyIcon/utils'
import Tooltip from '@/components/shared/Tooltip.vue'


const props = defineProps<{
  icon: IconType
  value: string | number
  tooltip: string
}>()
</script>

<style scoped lang="scss">
.item-parent {
  display: flex;
  align-items: center;
  gap: 0.2em;
  line-height: 1.2;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.2em;
  line-height: 1.2;

  img {
    width: 40px;
    height: 40px;
    margin: -10px;
  }

  svg {
    width: 35px;
    height: 35px;
    margin: -5px;
  }
}

.tooltip {
  text-align: center;
  line-height: 1.2;
  margin: -0.2em 0;
}
</style>