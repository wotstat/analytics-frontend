<template>
  <MetaCard :title="name" brand="Виджеты WotStat" :subtitle="subtitle"
    footer="Мир танков · World of Tanks" footer-right="">
    <template v-if="hasPreview" #content-full>
      <div class="widget-card" :class="{ wide: isWide }" :style="{ '--widget-aspect-ratio': size.width / size.height }">
        <div class="info">
          <h1 ref="heading">{{ name }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <div ref="stage" class="preview">
          <span v-if="failed">Не удалось загрузить виджет</span>
          <div class="widget" :style="{
            width: `${size.width}px`,
            height: `${size.height}px`,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }">
            <iframe ref="iframe" :style="{
              width: `${size.width + size.insets.left + size.insets.right}px`,
              height: `${size.height + size.insets.top + size.insets.bottom}px`,
              top: `${-size.insets.top}px`,
              left: `${-size.insets.left}px`,
            }" />
          </div>
        </div>
      </div>
    </template>
  </MetaCard>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import type { RenderContext } from '@/meta/utils'
import { useMetaReady } from '@/meta/cards/useMetaReady'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'
import { getWidgetPreviewUrl } from './widgetCatalog'
import { prepareWidgetPreview, type WidgetPreviewSize } from './prepareWidgetPreview'

const props = defineProps<{ context: RenderContext, title: string, description: string, hasPreview: boolean }>()
const name = ref(props.title)
const subtitle = ref(props.description)
const failed = ref(false)
const size = ref<WidgetPreviewSize>({ width: 640, height: 400, insets: { top: 0, right: 0, bottom: 0, left: 0 } })
const titleWidth = ref(0)

const heading = useTemplateRef<HTMLHeadingElement>('heading')
const iframe = useTemplateRef<HTMLIFrameElement>('iframe')
const stage = useTemplateRef<HTMLDivElement>('stage')
const { width, height } = useElementSize(stage)

const isWide = computed(() => size.value.width / size.value.height >= 1.5
  && width.value > 0 && titleWidth.value > width.value)
const scale = computed(() => Math.min(width.value / size.value.width, height.value / size.value.height))

useMetaReady(async ({ signal }) => {
  if (!props.hasPreview) return
  if (!iframe.value) throw new Error('Widget iframe did not mount')

  const textMetrics = document.createElement('canvas').getContext('2d')!

  try {
    await prepareWidgetPreview(iframe.value, getWidgetPreviewUrl(new URL(props.context.url)), signal, async value => {
      size.value = value
      await nextTick()

      textMetrics.font = getComputedStyle(heading.value!).font
      titleWidth.value = textMetrics.measureText(name.value).width
      await nextTick()
    }, info => {
      name.value = info.name
      subtitle.value = info.description
    })
  } catch (error) {
    failed.value = true
    throw error
  }
})
</script>

<style scoped lang="scss">
.widget-card {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: stretch;

  &.wide {
    flex: none;
    grid-template-areas: 'title title' 'description preview';
    row-gap: 32px;
    align-items: center;

    .info {
      display: contents;

      h1 {
        grid-area: title;
      }

      p {
        grid-area: description;
        margin: 0;
      }
    }

    .preview {
      grid-area: preview;
      aspect-ratio: var(--widget-aspect-ratio);
      margin-block: 0;
    }
  }

  .info {
    align-self: center;

    h1 {
      margin: 0;
      font-size: 60px;
      line-height: 1.08;
      overflow-wrap: anywhere;
    }

    p {
      margin: 24px 0 0;
      font-size: 26px;
      line-height: 1.4;
      color: var(--meta-card-muted);
    }
  }

  .preview {
    position: relative;
    min-width: 0;
    min-height: 0;
    margin-block: 48px;
    display: grid;
    place-items: center;
    color: var(--meta-card-muted);
    font-size: 22px;

    .widget {
      position: absolute;
      top: 50%;
      left: 50%;
      pointer-events: none;

      iframe {
        position: absolute;
        border: 0;
      }
    }
  }
}
</style>
