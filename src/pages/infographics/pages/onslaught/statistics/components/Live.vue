<template>
  <Transition name="fade">
    <div class="live" ref="item" v-if="show">LIVE</div>
  </Transition>

  <PopoverAutoClose v-if="show" :target="item" v-model="hover" :placement="['bottom-float']"
    :viewport-offset="{ top: headerOffset, bottom: 10, left: 10, right: 10 }" :arrow-size="7" :offset="{ top: 7 }"
    :class="'comp7-tooltip'">
    <div class="tooltip">
      Новые бои загружаются автоматически
    </div>
  </PopoverAutoClose>
</template>


<script setup lang="ts">
import { headerOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { useElementHover } from '@vueuse/core'
import { useTemplateRef } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const item = useTemplateRef<HTMLElement>('item')
const hover = useElementHover(item)

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