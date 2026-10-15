<template>
  <div ref="root" class="render-view" :class="{ fullscreen: !embedded }">
    <CardSurface v-if="context" ref="surface" :context />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onErrorCaptured, onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'
import CardSurface from '../cards/CardSurface.vue'
import { parsePageUrl, type MetaFormat, type PageMeta, type RenderContext } from '../utils'
import { resolveBrowserMeta } from '../context/browser'

declare global {
  interface Window {
    prepare?: (request: { url: string, format: MetaFormat, meta?: PageMeta, signal?: AbortSignal }) => Promise<void>
  }
}

const props = defineProps<{ embedded?: boolean }>()
const root = useTemplateRef<HTMLDivElement>('root')
const surface = useTemplateRef<InstanceType<typeof CardSurface>>('surface')
const context = shallowRef<RenderContext | null>(null)
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

let busy = false
let renderError: Error | null = null
let lifecycle: AbortController | null = null

onErrorCaptured(error => {
  if (!busy) return
  renderError ??= error instanceof Error ? error : new Error('Card rendering failed', { cause: error })
  return false
})

const prepare: NonNullable<Window['prepare']> = async ({ url: input, format, meta: preparedMeta, signal: requestSignal }) => {
  const lifecycleSignal = lifecycle?.signal

  if (!root.value || !lifecycleSignal || lifecycleSignal.aborted) throw new Error('Renderer is not mounted')
  const signal = requestSignal ? AbortSignal.any([lifecycleSignal, requestSignal]) : lifecycleSignal
  signal.throwIfAborted()
  if (busy) throw new Error('Renderer is already preparing a card')
  if (format !== 'og' && format !== 'twitter') throw new Error('Unknown image format')

  const url = parsePageUrl(input)
  busy = true
  renderError = null

  let cancel = () => { }
  const cancelled = new Promise<never>((_, reject) => {
    cancel = () => reject(signal.reason)
    signal.addEventListener('abort', cancel, { once: true })
  })
  const wait = <T>(promise: Promise<T>) => Promise.race([promise, cancelled])

  try {
    const meta = preparedMeta ?? await wait(resolveBrowserMeta(url))
    if (!meta.hasImage) throw new Error('This page has no meta image')
    context.value = null
    await wait(nextTick())

    context.value = { url: url.href, format, meta }
    await wait(nextTick())
    if (!surface.value) throw new Error('Card did not mount')

    await wait(surface.value.waitUntilReady())
    await wait(nextTick())
    await wait(document.fonts.ready)
    await wait(Promise.all([...root.value.querySelectorAll('img')].map(image => image.decode())))
    await wait(frame())
    await wait(frame())

    if (renderError) throw renderError
    if (!root.value.querySelector('.meta-card-surface')?.firstElementChild) throw new Error('Card did not mount')
  } catch (error) {
    context.value = null
    throw error
  } finally {
    signal.removeEventListener('abort', cancel)
    busy = false
    renderError = null
  }
}

onMounted(() => {
  lifecycle = new AbortController()
  window.prepare = prepare
  if (!props.embedded) document.documentElement.classList.add('meta-renderer')
})

onUnmounted(() => {
  lifecycle?.abort(new Error('Renderer is unmounted'))
  lifecycle = null
  context.value = null
  if (window.prepare === prepare) delete window.prepare
  if (!props.embedded) document.documentElement.classList.remove('meta-renderer')
})
</script>

<style lang="scss">
html.meta-renderer {

  &,
  body {
    margin: 0;
    padding: 0;
    background: #303236;
  }

  * {
    box-sizing: border-box;
  }
}
</style>

<style scoped lang="scss">
.render-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #303236;

  &.fullscreen {
    position: fixed;
    inset: 0;
  }
}
</style>
