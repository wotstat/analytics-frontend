<template>
  <PopoverStyled :target="target" :display="display" :placement="placement" :offset="props.offset"
    :viewport-offset="props.viewportOffset" :arrow-size="props.arrowSize ?? 7" :interactive="props.interactive ?? false"
    :class="props.class" :snap-to-pixels="false">
    <slot v-if="lastCtx" :ctx="lastCtx"></slot>
  </PopoverStyled>
</template>


<script setup lang="ts" generic="THit extends InteractionHit = InteractionHit">
import { ClassValue, computed, onUnmounted, shallowRef, watch } from 'vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { InteractionHit } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionHit'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import { OffsetValue, PlacementParam, PlacementWithModifiers, TargetRect, VirtualElement } from '@/shared/uiKit/popover/utils'

type Anchor = 'pivot' | 'cursor' | 'pivot-x' | 'pivot-y'


const props = defineProps<{
  ctx: TooltipCtx<THit> | null
  anchor?: Anchor
  placement?: PlacementParam
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  arrowSize?: number
  interactive?: boolean
  hideDelay?: number
  class?: ClassValue
}>()


const defaultPlacement: Record<Anchor, PlacementWithModifiers[]> = {
  'pivot': ['top-float', 'bottom-float'],
  'cursor': ['right-float', 'left-float'],
  'pivot-x': ['right-float', 'left-float'],
  'pivot-y': ['top-float', 'bottom-float'],
}

const placement = computed(() => props.placement ?? defaultPlacement[props.anchor ?? 'pivot'])

const lastCtx = shallowRef<TooltipCtx<THit> | null>(null)
const display = shallowRef(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.ctx, ctx => {
  if (ctx) lastCtx.value = ctx

  if (hideTimeout) clearTimeout(hideTimeout)
  hideTimeout = null

  if (ctx) display.value = true
  else if (display.value) hideTimeout = setTimeout(() => display.value = false, props.hideDelay ?? 0)
}, { immediate: true })

onUnmounted(() => {
  if (hideTimeout) clearTimeout(hideTimeout)
})

const target = computed<VirtualElement>(() => {
  const rect = anchorRect()
  return {
    getBoundingClientRect: () => ({ ...rect, x: rect.x - window.scrollX, y: rect.y - window.scrollY }),
  }
})

function anchorRect(): TargetRect {
  const ctx = props.ctx ?? lastCtx.value
  if (!ctx) return { x: 0, y: 0, width: 0, height: 0 }

  const anchor = props.anchor ?? 'pivot'
  const point = anchor === 'cursor' ? ctx.absoluteCursorAnchor : ctx.absolutePivot
  const box = ctx.absoluteChartBox

  switch (anchor) {
    case 'pivot-x': return { x: point.x, y: box.top, width: 0, height: box.bottom - box.top }
    case 'pivot-y': return { x: box.left, y: point.y, width: box.right - box.left, height: 0 }
    default: return { x: point.x, y: point.y, width: 0, height: 0 }
  }
}

</script>
