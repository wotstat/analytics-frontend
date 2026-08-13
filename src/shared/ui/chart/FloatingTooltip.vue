<template>
  <PopoverStyled :target="target" :display="display" :placement="placement" :offset="props.offset"
    :viewport-offset="props.viewportOffset" :arrow-size="props.arrowSize ?? 7" :interactive="props.interactive ?? false"
    :class="props.class">
    <slot v-if="lastCtx" :ctx="lastCtx"></slot>
  </PopoverStyled>
</template>


<script setup lang="ts" generic="THit extends InteractionHit = InteractionHit">
import { ClassValue, computed, onUnmounted, shallowRef, watch } from 'vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { InteractionHit } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionHit'
import { CriticalFollower, DEFAULT_FOLLOW_OMEGA } from '@/shared/uiKit/chart/universalChart/utils/follower'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import { OffsetValue, PlacementParam, PlacementWithModifiers, TargetRect, VirtualElement } from '@/shared/uiKit/popover/utils'

type Anchor = 'pivot' | 'cursor' | 'pivot-x' | 'pivot-y'


const MAX_STEP_SECONDS = 0.05

const props = defineProps<{
  ctx: TooltipCtx<THit> | null
  anchor?: Anchor
  placement?: PlacementParam
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  arrowSize?: number
  interactive?: boolean
  hideDelay?: number
  animated?: boolean
  animationOmega?: number
  class?: ClassValue
}>()


const defaultPlacement: Record<Anchor, PlacementWithModifiers[]> = {
  'pivot': ['top-float', 'bottom-float'],
  'cursor': ['right-float', 'left-float'],
  'pivot-x': ['right-float', 'left-float'],
  'pivot-y': ['top-float', 'bottom-float'],
}

const placement = computed(() => props.placement ?? defaultPlacement[props.anchor ?? 'pivot'])

let followers: { x: CriticalFollower, y: CriticalFollower, time: number } | null = null

const lastCtx = shallowRef<TooltipCtx<THit> | null>(null)
const display = shallowRef(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.ctx, (ctx, previous) => {
  if (ctx) lastCtx.value = ctx
  if (ctx && !previous && !display.value) followers = null

  if (hideTimeout) clearTimeout(hideTimeout)
  hideTimeout = null

  if (ctx) display.value = true
  else if (display.value) hideTimeout = setTimeout(() => display.value = false, props.hideDelay ?? 0)
}, { immediate: true })

onUnmounted(() => {
  if (hideTimeout) clearTimeout(hideTimeout)
})

watch(() => props.animated, () => followers = null)

watch(() => props.animationOmega, omega => {
  if (!followers) return
  followers = {
    x: new CriticalFollower(followers.x.value, followers.x.velocity, omega ?? DEFAULT_FOLLOW_OMEGA),
    y: new CriticalFollower(followers.y.value, followers.y.velocity, omega ?? DEFAULT_FOLLOW_OMEGA),
    time: followers.time,
  }
})

const target: VirtualElement = {
  getBoundingClientRect(): TargetRect {
    const rect = anchorRect()
    const point = props.animated ? followPoint(rect) : rect
    return { ...rect, x: point.x - window.scrollX, y: point.y - window.scrollY }
  }
}

function anchorRect(): TargetRect {
  const ctx = props.ctx ?? lastCtx.value
  if (!ctx) return { x: 0, y: 0, width: 0, height: 0 }

  const anchor = props.anchor ?? 'pivot'
  const point = anchor === 'cursor' ? ctx.absoluteCursor : ctx.absolutePivot
  const box = ctx.absoluteChartBox

  switch (anchor) {
    case 'pivot-x': return { x: point.x, y: box.top, width: 0, height: box.bottom - box.top }
    case 'pivot-y': return { x: box.left, y: point.y, width: box.right - box.left, height: 0 }
    default: return { x: point.x, y: point.y, width: 0, height: 0 }
  }
}

function followPoint(rect: TargetRect) {
  const now = performance.now()

  if (!followers) {
    const omega = props.animationOmega ?? DEFAULT_FOLLOW_OMEGA
    followers = {
      x: new CriticalFollower(rect.x, 0, omega),
      y: new CriticalFollower(rect.y, 0, omega),
      time: now,
    }
    return rect
  }

  const dt = Math.min((now - followers.time) / 1000, MAX_STEP_SECONDS)
  if (dt <= 0) return { x: followers.x.value, y: followers.y.value }

  followers.time = now
  return {
    x: stepAxis(followers.x, rect.x, dt),
    y: stepAxis(followers.y, rect.y, dt),
  }
}

function stepAxis(follower: CriticalFollower, target: number, dt: number) {
  follower.step(target, dt)
  if (follower.settled(target, 1)) {
    follower.value = target
    follower.velocity = 0
  }

  return follower.value
}

</script>
