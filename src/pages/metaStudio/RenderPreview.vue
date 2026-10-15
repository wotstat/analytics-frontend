<template>
  <div class="render-preview">
    <div class="render-stage">
      <div ref="container" class="render-viewport" :style="{ aspectRatio: `${size.width} / ${size.height}` }">
        <MetaApp
          embedded
          class="preview-app"
          :style="{ width: `${size.width}px`, height: `${size.height}px`, transform: `scale(${scale})` }"
          @vue:mounted="run" />
      </div>
    </div>
    <p class="render-size">{{ size.width }} × {{ size.height }} px</p>
    <div class="render-controls">
      <button :disabled="running" @click="run">Перезапустить</button>
      <span>{{ running ? 'Ожидание готовности карточки' : 'Автоматически при изменении ссылки или формата' }}</span>
    </div>
    <ol class="render-log">
      <li v-for="entry in history" :key="entry.id" :class="{ error: entry.error }">
        <div class="result-line">
          <time>{{ entry.completedAt }}</time>
          <span>{{ entry.error ? 'Ошибка prepare' : 'prepare завершён' }} · {{ entry.duration.toFixed(1) }} мс</span>
        </div>
        <p v-if="entry.error">{{ entry.error }}</p>
        <p class="request">{{ entry.format === 'og' ? 'Open Graph' : 'X / Twitter' }} · {{ entry.url }}</p>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import MetaApp from '@/meta/renderer/App.vue'
import { formats, type MetaFormat, type PageMeta } from '@/meta/utils'

const props = defineProps<{ url: string, format: MetaFormat, meta: PageMeta }>()
const container = useTemplateRef<HTMLDivElement>('container')
const { width } = useElementSize(container)
const size = computed(() => formats[props.format])
const scale = computed(() => width.value / size.value.width)
const running = ref(false)
const history = shallowRef<{
  id: number
  url: string
  format: MetaFormat
  completedAt: string
  duration: number
  error: string
}[]>([])
let active = true
let sequence = 0
let rerun = false
let hotUpdated = false
let currentController: AbortController | null = null

const run = async () => {
  if (!active) return
  if (running.value) {
    rerun = true
    currentController?.abort(new Error('Preparation was superseded'))
    return
  }
  rerun = false
  hotUpdated = false
  const { url, format, meta } = props
  const startedAt = performance.now()
  const controller = new AbortController()
  currentController = controller
  let error = ''
  running.value = true

  try {
    if (!window.prepare) throw new Error('Renderer is not mounted')
    await window.prepare({ url, format, meta, signal: controller.signal })
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause)
  } finally {
    if (currentController === controller) currentController = null
    running.value = false
  }

  const duration = performance.now() - startedAt
  if (!active) return
  if (!controller.signal.aborted) {
    history.value = [{
      id: ++sequence,
      url,
      format,
      completedAt: new Date().toLocaleTimeString('ru-RU'),
      duration,
      error,
    }, ...history.value].slice(0, 10)
  }

  if (error && hotUpdated) rerun = true
  if (rerun) void run()
}

const recoverAfterHotUpdate = () => {
  if (running.value) {
    hotUpdated = true
    return
  }
  if (history.value[0]?.error) void run()
}

import.meta.hot?.on('vite:afterUpdate', recoverAfterHotUpdate)
watch(() => [props.url, props.format, props.meta], () => void run(), { flush: 'post' })
onUnmounted(() => {
  active = false
  currentController?.abort(new Error('Preview is unmounted'))
  import.meta.hot?.off('vite:afterUpdate', recoverAfterHotUpdate)
})
</script>

<style scoped lang="scss">
.render-preview {
  .render-size {
    margin: 10px 0 0;
    color: var(--studio-muted, #9b9b9b);
    font-size: 11px;
  }

  .render-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 16px;

    button {
      border: 0;
      border-radius: 4px;
      padding: 6px 12px;
      background: var(--studio-surface, #2c2c2c);
      color: var(--studio-text, #e6e6e6);
      font: inherit;
      font-size: 12px;
      cursor: pointer;

      &:hover {
        background: var(--studio-hover, #3c3c3c);
      }

      &:disabled {
        opacity: .5;
        cursor: default;
      }
    }

    > span {
      font-size: 11px;
      color: var(--studio-muted, #9b9b9b);
    }
  }

  .render-stage {
    padding: 24px;
    background: var(--studio-canvas, #1d1d1d);
    border-radius: 4px;

    .render-viewport {
      width: 100%;
      overflow: hidden;
      background: #303236;

      .preview-app {
        transform-origin: left top;
      }
    }

    @media (max-width: 500px) {
      padding: 12px;
    }
  }

  .render-log {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
    max-height: 240px;
    overflow: auto;

    li {
      padding: 10px 0;
      font-size: 11px;
      line-height: 1.5;
      color: var(--studio-text, #e6e6e6);

      &.error {
        color: #e7aa8c;
      }

      .result-line {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;

        time {
          color: var(--studio-muted, #9b9b9b);
          font-variant-numeric: tabular-nums;
        }
      }

      p {
        margin: 5px 0 0;
        overflow-wrap: anywhere;

        &.request {
          color: var(--studio-muted, #9b9b9b);
          font-family: var(--studio-mono, monospace);
          font-size: 10px;
        }
      }
    }
  }
}
</style>
