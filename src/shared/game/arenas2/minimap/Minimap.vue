<template>
  <div class="minimap">
    <MinimapBackground :tag="tag" :gameplay="gameplay" :game="game" :format="'webp'" class="background" />
    <MinimapBases :tag="tag" :gameplay="gameplay" :allyTeam="team" />
    <div class="overlay">
      <slot />
    </div>
  </div>
</template>


<script setup lang="ts">
import { GameVendor } from '../../wot'
import MinimapBackground from './minimapBackground/MinimapBackground.vue'
import MinimapBases from './minimapBases/MinimapBases.vue'

const props = withDefaults(defineProps<{
  game?: GameVendor;
  gameplay?: string;
  tag: string;
  team?: number;
}>(), {
  game: 'mt',
  gameplay: 'ctf',
  team: 1
})

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