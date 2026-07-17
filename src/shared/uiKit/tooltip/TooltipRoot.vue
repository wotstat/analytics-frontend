<template>
  <Teleport to="body">
    <div id="tooltip-root">
      <PopoverStyled v-for="[group, [tooltip, display]] in displayedDelayedTooltips" :target="tooltip.target"
        :display="display" :key="group" :teleportTo="null" :exit-duration="HIDE_ANIMATION_DURATION"
        :class="{ 'tooltip-non-interactive': !tooltip.options.interactive }" :placement="tooltip.options.placement"
        :viewport-offset="tooltip.options.viewportOffset || undefined"
        :arrow-size="tooltip.options.arrowSize || undefined">
        <component :is="tooltip.component" />
      </PopoverStyled>
    </div>
  </Teleport>

</template>


<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import PopoverStyled from '../popover/PopoverStyled.vue'
import { DisplayedTooltip, displayedTooltips } from './tooltip'

const HIDE_ANIMATION_DURATION = 100

const props = defineProps<{}>()

const displayedDelayedTooltips = ref(new Map<string, [DisplayedTooltip, boolean]>())
const timeoutIds = new Map<string, number>()

watch(displayedTooltips, groups => {
  for (const [k, v] of displayedDelayedTooltips.value) {
    if (!groups.has(k)) {
      displayedDelayedTooltips.value.set(k, [v[0], false])
      const timeoutId = setTimeout(() => {
        displayedDelayedTooltips.value.delete(k)
        timeoutIds.delete(k)
      }, HIDE_ANIMATION_DURATION)
      timeoutIds.set(k, timeoutId)
    }
  }

  for (const [k, v] of groups) {
    if (timeoutIds.has(k)) {
      clearTimeout(timeoutIds.get(k))
      timeoutIds.delete(k)
    }

    displayedDelayedTooltips.value.set(k, [v, false])
    nextTick(() => displayedDelayedTooltips.value.set(k, [v, true]))
  }
}, { immediate: true, deep: true })

</script>


<style lang="scss" scoped>
:deep(.tooltip-non-interactive) {
  pointer-events: none;
}
</style>
