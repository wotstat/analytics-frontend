<template>
  <div class="minimap">
    <MinimapBackground :tag="tag" :size="size" :gameplay="gameplay" :game="game" :format="'webp'" class="background" />
    <MinimapBases :tag="tag" :gameplay="gameplay" :game="game" :team="props.team" v-if="showBases" />
    <div class="overlay" ref="overlay" v-if="slots.default">
      <slot v-bind="{ width, height }" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { useSlots, useTemplateRef } from 'vue'
import { GameVendor } from '../../wot'
import MinimapBackground from './minimapBackground/MinimapBackground.vue'
import MinimapBases from './minimapBases/MinimapBases.vue'
import { useElementSize } from '@vueuse/core'

const props = withDefaults(defineProps<{
  game?: GameVendor;
  gameplay?: string;
  size?: 'small' | 'medium';
  tag: string;
  team?: number;
  showBases?: boolean;
}>(), {
  game: 'mt',
  gameplay: 'ctf',
  team: 1,
  showBases: true
})

const overlay = useTemplateRef('overlay')
const { width, height } = useElementSize(overlay)

const slots = useSlots()

</script>


<style lang="scss" scoped>
.minimap {
  position: relative;
  width: 100%;
  height: 100%;

  .background {
    width: 100%;
  }

  .overlay {
    position: absolute;
    inset: 0;
  }
}
</style>