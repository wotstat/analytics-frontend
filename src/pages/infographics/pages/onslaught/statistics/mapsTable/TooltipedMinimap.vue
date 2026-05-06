<template>
  <div class="minimap" ref="minimap">
    <Minimap :tag="tag" :game="game" :gameplay="'comp7'" :showBases="false" />
    <PopoverAutoClose :target="minimap" v-model="hover" :placement="['top-float', 'right-float', 'bottom-float']"
      :viewport-offset="{ top: headerOffset + 10, bottom: 10, left: 10, right: 10 }" :arrow-size="5"
      :styles="{ 'pointer-events': 'none' }">
      <div class="tooltip">
        <Minimap :tag="tag" :game="game" :gameplay="'comp7'" />
      </div>
    </PopoverAutoClose>
  </div>
</template>


<script setup lang="ts">
import { headerOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import Minimap from '@/shared/game/arenas/minimap/Minimap.vue'
import { GameVendor } from '@/shared/game/wot'
import { ref } from 'vue'
import { useElementHover } from '@vueuse/core'

const props = defineProps<{
  tag: string;
  game?: GameVendor;
}>()

const minimap = ref<HTMLElement | null>(null)
const hover = useElementHover(minimap)
const t = ref<boolean>(true)
</script>


<style lang="scss" scoped>
.tooltip {
  width: 250px;
}
</style>