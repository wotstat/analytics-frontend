<template>
  <div class="item-parent">
    <Tooltip highlight>
      <template #tooltip>
        <p class="tooltip">{{ tooltip }}</p>
      </template>
      <div class="item">
        <img :src="DmgIcon" alt="damage">
        <p>{{ value }}</p>
      </div>
    </Tooltip>
  </div>
</template>

<script lang="ts" setup>
import DmgIcon from '@/assets/efficiency-icon/dmg.png'
import Tooltip from '@/components/Tooltip.vue';

const props = defineProps<{
  // icon: string
  value: string
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
}

.tooltip {
  text-align: center;
  line-height: 1.2;
  margin: -0.2em 0;
}
</style>