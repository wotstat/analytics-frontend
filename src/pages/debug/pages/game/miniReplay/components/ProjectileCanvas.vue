<template>
  <canvas ref="canvas" class="projectile-canvas"></canvas>
</template>


<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { worldToRelative } from '../model'
import type { PreparedReplay, PreparedShot, Vec3 } from '../types'

const props = defineProps<{
  replay: PreparedReplay
  tick: number
}>()

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let resizeObserver: ResizeObserver | null = null

function pointToCanvas(point: Pick<Vec3, 'x' | 'z'>, width: number, height: number) {
  const relative = worldToRelative(point, props.replay)
  return {
    x: relative.x * width,
    y: relative.y * height,
  }
}

function shotColor(shot: PreparedShot) {
  if (shot.shellType?.includes('HIGH_EXPLOSIVE')) return '#ffb65b'
  if (shot.shellType?.includes('HOLLOW_CHARGE')) return '#6fe7ff'
  if (shot.shellType?.includes('ARMOR_PIERCING_CR')) return '#f6f7b0'
  return '#fff5ce'
}

function draw() {
  const element = canvas.value
  if (!element) return

  const rect = element.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, rect.width)
  const height = Math.max(1, rect.height)
  const pixelWidth = Math.round(width * dpr)
  const pixelHeight = Math.round(height * dpr)

  if (element.width !== pixelWidth || element.height !== pixelHeight) {
    element.width = pixelWidth
    element.height = pixelHeight
  }

  const context = element.getContext('2d')
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)
  context.lineCap = 'round'

  const fadeTicks = 12
  for (const shot of props.replay.shots) {
    if (shot.startTick > props.tick) break
    if (shot.endTick + fadeTicks < props.tick) continue

    const duration = Math.max(1, shot.endTick - shot.startTick)
    const progress = Math.min(1, Math.max(0, (props.tick - shot.startTick) / duration))
    const fade = props.tick <= shot.endTick
      ? 1
      : 1 - (props.tick - shot.endTick) / fadeTicks
    const currentEnd = {
      x: shot.start.x + (shot.end.x - shot.start.x) * progress,
      z: shot.start.z + (shot.end.z - shot.start.z) * progress,
    }
    const start = pointToCanvas(shot.start, width, height)
    const end = pointToCanvas(currentEnd, width, height)
    const color = shotColor(shot)

    context.globalAlpha = Math.max(0, fade) * 0.22
    context.strokeStyle = color
    context.lineWidth = 5
    context.beginPath()
    context.moveTo(start.x, start.y)
    context.lineTo(end.x, end.y)
    context.stroke()

    context.globalAlpha = Math.max(0, fade) * 0.95
    context.lineWidth = 1.4
    context.beginPath()
    context.moveTo(start.x, start.y)
    context.lineTo(end.x, end.y)
    context.stroke()
  }

  for (const impact of props.replay.impacts) {
    const age = props.tick - impact.tick
    if (age < 0) break
    if (age > 18) continue

    const point = pointToCanvas(impact.position, width, height)
    const progress = age / 18
    const radius = 2 + progress * 7
    context.globalAlpha = (1 - progress) * (impact.kind === 'explosion' ? 0.95 : 0.55)
    context.fillStyle = impact.kind === 'explosion' ? '#ff8f42' : '#fff1aa'
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }

  context.globalAlpha = 1
}

watch(() => [props.tick, props.replay], draw, { flush: 'post' })

onMounted(() => {
  resizeObserver = new ResizeObserver(draw)
  if (canvas.value) resizeObserver.observe(canvas.value)
  draw()
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>


<style scoped lang="scss">
.projectile-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
