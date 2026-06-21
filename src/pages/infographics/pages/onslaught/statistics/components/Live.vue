<template>
  <div class="live" ref="item">LIVE</div>
  <PopoverAutoClose :target="item" v-model="hover" :placement="['bottom-float']"
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
import { ref } from 'vue'

const props = defineProps<{}>()

const item = ref<HTMLElement | null>(null)
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
</style>