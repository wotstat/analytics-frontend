<template>
  <Transition name="fade">
    <div class="live" ref="item" v-if="show" v-tooltip.instant.bottom-float="'Новые бои загружаются автоматически'">LIVE
    </div>
  </Transition>
</template>


<script setup lang="ts">
import { vTooltip } from '@/shared/uiKit/tooltip/textTooltip'

const props = defineProps<{
  show: boolean
}>()

</script>


<style lang="scss" scoped>
.live {
  margin-left: 5px;
  padding: 0 6px;
  background-color: #2ca062;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 5px;
  cursor: help;
}

.tooltip {
  padding: 10px;
  font-size: 14px;
  color: white;
  max-width: 280px;
  line-height: 1.2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s, filter 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(3px);
}
</style>