<template>
  <div class="minimap" ref="minimap">
    <Minimap :tag="tag" :game="game" :gameplay="'comp7'" :showBases="false" v-tooltip-target.instant />

    <DefineTooltip :placement="['top-float', 'right-float', 'bottom-float']" :arrow-size="7"
      :viewport-offset="popoverViewportOffset">
      <div class="tooltip">
        <Minimap :tag="tag" :game="game" :team="team" :gameplay="'comp7'" />
      </div>
    </DefineTooltip>
  </div>
</template>


<script setup lang="ts">
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import Minimap from '@/shared/game/arenas/minimap/Minimap.vue'
import { GameVendor } from '@/shared/game/wot'
import { defineTooltip } from '@/shared/uiKit/tooltip/tooltip'

const props = defineProps<{
  tag: string;
  team?: number;
  game?: GameVendor;
}>()

const { DefineTooltip, vTooltipTarget } = defineTooltip()
</script>


<style lang="scss" scoped>
.tooltip {
  width: 250px;
}
</style>