<template>
  <div ref="controls" class="column-limit">
    <span ref="background" class="background" :class="{ hovered: backgroundHovered }"></span>
    <span class="count">Выбрано {{ selectedCount }} из {{ maxSlots }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  selectedCount: number
  maxSlots: number
}>()

const controls = useTemplateRef<HTMLDivElement>('controls')
const background = useTemplateRef<HTMLSpanElement>('background')
const backgroundHovered = ref(false)
let animations: Animation[] = []

watch([() => props.selectedCount, () => props.maxSlots], () => {
  backgroundHovered.value = false
  cancelFeedback()
})

function setBackgroundHovered(hovered: boolean) {
  backgroundHovered.value = hovered
}

const BACKGROUND = 'rgba(255, 159, 10, 0.1)'

function showLimitFeedback() {
  if (!controls.value || !background.value) return
  cancelFeedback()

  const timing = { duration: 620, easing: 'ease-out' }
  const outline = '0 0 0 1px #FF9F0AFF'

  animations = [
    controls.value.animate({
      transform: [
        'translateX(0)',
        'translateX(-5px)',
        'translateX(3px)',
        'translateX(-2px)',
        'translateX(0)',
        'translateX(0)',
      ],
    }, timing),
    background.value.animate({
      boxShadow: [outline, outline, outline, outline, '0 0 0 2px transparent'],
      backgroundColor: [BACKGROUND, BACKGROUND, BACKGROUND, BACKGROUND, 'var(--column-limit-hover-background, transparent)'],
    }, timing),
  ]
}

function cancelFeedback() {
  for (const animation of animations) animation.cancel()
}

defineExpose({ setBackgroundHovered, showLimitFeedback })
</script>

<style scoped lang="scss">
.column-limit {
  --column-limit-end-padding: 2px;

  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding-inline: 5px var(--column-limit-end-padding);
  border-radius: 5px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  line-height: 1.3;

  .background {
    position: absolute;
    z-index: -1;
    inset-block: -3px;
    inset-inline: -1px calc(var(--column-limit-end-padding) - var(--column-limit-background-extra-end, 0px));
    pointer-events: none;
    border-radius: inherit;
    background-color: var(--column-limit-hover-background, transparent);
    transition: background-color 180ms ease-out;

    &.hovered {
      --column-limit-hover-background: v-bind(BACKGROUND);
    }
  }

  .count {
    color: rgba(255, 255, 255, 0.85);
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}
</style>
