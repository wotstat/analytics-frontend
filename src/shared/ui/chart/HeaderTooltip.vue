<template>
  <div class="header-tooltip" ref="headerTooltip">
    <div class="items">

      <div class="left" :class="{ hidden: isLeftHidden }" ref="leftHeaderItem">
        <slot name="left"></slot>
      </div>

      <div class="center" :class="{ hidden: isCenterHidden }" ref="centerHeaderItem">
        <div class="item">
          <slot name="center"></slot>
        </div>
      </div>

      <div class="right" :class="{ hidden: isRightHidden }" ref="rightHeaderItem">
        <slot name="right"></slot>
      </div>

    </div>

    <Transition name="fade">
      <div class="tooltip" v-if="props.ctx" :style="{ left: tooltipPosition + 'px' }" ref="tooltip">
        <slot name="tooltip" v-bind="{ ctx: props.ctx }"></slot>
      </div>
    </Transition>
  </div>
</template>


<script setup lang="ts">
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { useElementBounding, useElementSize } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const headerTooltip = ref<HTMLDivElement | null>(null)
const tooltip = ref<HTMLDivElement | null>(null)

const leftHeaderItem = ref<HTMLDivElement | null>(null)
const centerHeaderItem = ref<HTMLDivElement | null>(null)
const rightHeaderItem = ref<HTMLDivElement | null>(null)

const props = defineProps<{
  ctx: TooltipCtx | null
  hide?: 'intersect' | 'always'
  hideLeft?: 'intersect' | 'always'
  hideCenter?: 'intersect' | 'always'
  hideRight?: 'intersect' | 'always'
}>()

const { left: containerLeft, right: containerRight } = useElementBounding(headerTooltip)
const leftBounds = useElementBounding(leftHeaderItem)
const centerBounds = useElementBounding(centerHeaderItem)
const rightBounds = useElementBounding(rightHeaderItem)
const tooltipBounds = useElementBounding(tooltip)

const tooltipPosition = computed(() => {
  if (!props.ctx) return 0
  const tooltipWidth = tooltipBounds.width.value
  const pos = props.ctx.pivot.x - containerLeft.value - tooltipWidth / 2
  return Math.max(0, Math.min(pos, containerRight.value - containerLeft.value - tooltipWidth))
})

watch([() => props.ctx, tooltipPosition], () => {
  tooltipBounds.update()
  leftBounds.update()
  centerBounds.update()
  rightBounds.update()
}, { flush: 'post' })

type Bounds = ReturnType<typeof useElementBounding>

function intersectsTooltip(bounds: Bounds) {
  return (
    bounds.left.value < tooltipBounds.right.value &&
    bounds.right.value > tooltipBounds.left.value &&
    bounds.top.value < tooltipBounds.bottom.value &&
    bounds.bottom.value > tooltipBounds.top.value
  )
}

function useHidden(mode: () => 'intersect' | 'always' | undefined, bounds: Bounds) {
  return computed(() => {
    if (!props.ctx) return false
    if ((mode() ?? 'intersect') === 'always') return true
    return intersectsTooltip(bounds)
  })
}

const isLeftHidden = useHidden(() => props.hideLeft ?? props.hide, leftBounds)
const isCenterHidden = useHidden(() => props.hideCenter ?? props.hide, centerBounds)
const isRightHidden = useHidden(() => props.hideRight ?? props.hide, rightBounds)
</script>


<style lang="scss" scoped>
.header-tooltip {
  position: relative;

  .tooltip {
    position: absolute;
    left: 0;
    bottom: 0;
  }
}

.items {
  display: flex;

  .center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  // Скрываем элемент, не убирая его из потока — так его геометрия остаётся
  // измеримой для проверки пересечения с тултипом.
  .left,
  .center,
  .right {
    transition: opacity 0.2s, filter 0.2s;

    &.hidden {
      opacity: 0;
      filter: blur(2px);
      pointer-events: none;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, filter 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(2px);
}
</style>