<template>

  <div class="center-container">
    <h1>Виджеты</h1>
    <br>
    <p>Виджеты универсальные их можно добавлять как в OBS так и прямо в игру</p>
    <div class="flex center">
      <img src="./hero.webp" class="hero">
    </div>
    <br>
    <According>
      <template #header>
        <h4>Как добавить виджет в игру</h4>
      </template>
      <template #panel>
        <div class="markdown">
          <InstructionGame />
        </div>
      </template>
    </According>

    <According>
      <template #header>
        <h4>Как добавить виджет в OBS (для стримеров)</h4>
      </template>
      <template #panel>
        <div class="markdown">
          <InstructionOBS />
        </div>
      </template>
    </According>

    <div class="collection-loading" v-if="isCollectionLoading">
      <div class="section" v-for="i in new Array(2).fill(0)">
        <div class="title skeleton"></div>
        <div class="items">
          <div class="item" v-for="i in new Array(3).fill(0)">
            <div class="info">
              <div class="title"></div>
              <div class="content"></div>
            </div>
            <div class="widget"></div>
          </div>
        </div>
      </div>
    </div>

    <iframe :src="`${WIDGETS_URL}/iframe/collection`" frameborder="0" class="collection" ref="collection" :style="{
      height: `${height}px`,
      minHeight: `${height}px`,
      opacity: isCollectionLoading ? 0 : 1
    }" @load="onCollectionLoad" v-if="showCollection"></iframe>

    <PopupWindow :title="selectedTitle" v-if="selectedRoute" @close="onClosePreview">
      <div class="loader" v-if="isPreviewLoading">
        <div class="top-text">
          <p class="skeleton"></p>
          <p class="skeleton"></p>
          <p class="skeleton"></p>
          <p class="skeleton"></p>
          <p class="skeleton"></p>
          <p class="skeleton"></p>
          <p class="skeleton"></p>
          <p class="skeleton"></p>
        </div>
        <div class="bottom-content">
          <div class="preview-content skeleton"></div>
          <div class="settings-content">
            <p class="skeleton"></p>
            <p class="skeleton"></p>
            <p class="skeleton"></p>
            <p class="skeleton"></p>
            <p class="skeleton"></p>
          </div>
        </div>
        <div class="url-line skeleton"></div>
      </div>
      <iframe :src="`${WIDGETS_URL}/iframe/preview${selectedRoute}`" frameborder="0" class="preview"
        :style="{ opacity: isPreviewLoading ? 0 : 1 }" allow="clipboard-write" ref="preview"
        @load="onPreviewLoad"></iframe>
    </PopupWindow>
  </div>
</template>


<script setup lang="ts">
import According from '@/components/According.vue'
import PopupWindow from '@/components/PopupWindow.vue'
import { useIframeContentBounding } from '@/composition/useIframeContentBounding'
import { useIframeMessages } from '@/composition/useIframeMessages'
import { computed, onDeactivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { VueComponentWith as InstructionGameWith } from './instructionGame/index.md'
import { VueComponentWith as InstructionOBSWith } from './instructionOBS/index.md'
import { allMdComponents } from '@/components/mdUtils/getAllMdComponents'
import { useMeta } from '@/composition/useMeta'
import { WIDGETS_URL } from '@/utils/externalUrl'

useMeta({
  title: 'Виджеты',
  description: 'Виджеты универсальные их можно добавлять как в OBS так и прямо в игру Мир Танков и World of Tanks',
  keywords: 'виджеты, виджеты для стримеров, виджеты для игр, виджеты для стрима, виджеты для трансляции, виджеты мир танков'
})

const InstructionGame = InstructionGameWith(allMdComponents)
const InstructionOBS = InstructionOBSWith(allMdComponents)

const selectedTitle = ref<string>('')
const collection = ref<HTMLIFrameElement | null>(null)
const preview = ref<HTMLIFrameElement | null>(null)
const isPreviewLoading = ref(true)
const isCollectionLoading = ref(true)

const route = useRoute()
const router = useRouter()

function currentPreviewRoute() {
  const targetWidget = route.params.widget

  if (Array.isArray(targetWidget) && targetWidget.length > 0) {
    return '/' + targetWidget.join('/')
  }

  if (targetWidget)
    return '/' + route.params.widget

  return null
}

const showCollection = ref(currentPreviewRoute() === null)

const selectedRoute = computed(() => {
  return currentPreviewRoute()
})

watch(selectedRoute, (value, old) => {
  if (value && !old) isPreviewLoading.value = true
})


const { height } = useIframeContentBounding(collection)

useIframeMessages(collection, data => {
  if (data.type === 'widget-click') {
    selectedTitle.value = data.title

    router.push({
      query: { ...route.query },
      params: { widget: data.route.split('/').filter(Boolean) }
    })
  } else if (data.type === 'collection-mounted') {
    if (collection.value)
      isCollectionLoading.value = false
  }
})

useIframeMessages(preview, data => {
  if (data.type === 'readme-loaded') {
    const attributes = data.attributes as Record<string, string>
    if ('title' in attributes) selectedTitle.value = attributes.title
  } else if (data.type === 'preview-mounted') {
    if (preview.value) isPreviewLoading.value = false
  } else if (data.type === 'preview-component-loaded') {
    showCollection.value = true
  }
})

onDeactivated(() => {
  if (collection.value)
    isCollectionLoading.value = false

  if (selectedRoute.value) onClosePreview()
})

function onClosePreview() {
  showCollection.value = true
  router.push({
    query: { ...route.query },
    params: { widget: '' }
  })
}

function onCollectionLoad() {
  if (!collection.value) return
  isCollectionLoading.value = false
}

function onPreviewLoad() {
  if (!preview.value) return
  isPreviewLoading.value = false
}


</script>


<style lang="scss" scoped>
@use "/src/styles/mixins.scss" as *;
@use '/src/styles/textColors.scss' as *;


.center-container {
  max-width: 1100px;

  @media screen and (max-width: 1250px) {
    max-width: 100%;
  }
}

h1 {
  margin: 0;
}

h4 {
  margin: 0;
}


.hero {
  max-width: 550px;
  width: 100%;
  height: auto;
  aspect-ratio: 1652/736;
  margin-top: 1em;
  border-radius: 0.5em;
}

.markdown {
  :deep(.markdown-alert-important) {
    background-color: #302a32
  }

  :deep(img) {
    &.add-widget {
      max-width: 550px;
      width: 100%;
      min-width: 0;
    }

    &.widget-compare {
      image-rendering: pixelated;
      width: 100%;
      min-width: 0;

      @media (-webkit-device-pixel-ratio: 1) {
        max-width: 866px;
      }

      @media (-webkit-device-pixel-ratio: 2) {
        max-width: 433px;
      }

      @media (-webkit-device-pixel-ratio: 3) {
        max-width: 288px;
      }
    }

    &.srgb-compare {
      width: 100%;
      min-width: 0;

      max-width: 433px;
    }
  }
}

.collection {
  width: 100%;
  height: auto;
  background: transparent;
  margin-top: 2em;
  opacity: 0;
}

.collection-loading {
  display: flex;
  flex-direction: column;
  gap: 40px;
  margin-top: 40px;

  .section {
    .title {
      height: 30px;
      margin: 6px 0;
      width: 200px;
      border-radius: 10px;
      @include text-skeleton(#8181813e, #aaaaaa3e)
    }

    .items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      grid-auto-rows: 150px;
      gap: 10px;

      .item {
        background-color: #353535;
        padding: 20px;
        border-radius: 20px;
        display: flex;
        gap: 10px;

        .info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;

          .title {
            height: 20px;
            width: 100%;
            border-radius: 10px;
            @include text-skeleton(#8181813e, #aaaaaa3e)
          }

          .content {
            height: 20px;
            width: 100%;
            border-radius: 10px;
            @include text-skeleton(#8181813e, #aaaaaa3e)
          }
        }
      }

      .widget {
        width: 150px;
        border-radius: 10px;
        @include text-skeleton(#8181813e, #aaaaaa3e)
      }
    }
  }
}

.preview {
  max-width: 100%;
  width: 1000px;
  height: 900px;

  transition: opacity 0.2s;

  @include less-small {
    height: 100%;
  }
}

.loader {
  position: absolute;
  inset: 0;
  margin-top: 64.2px;
  height: 900px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  padding-top: 0;

  gap: 20px;

  .skeleton {
    border-radius: 10px;
    @include text-skeleton(#8181813e, #aaaaaa3e);
  }

  .top-text {
    flex: 1;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 50%;

    p {
      height: 25px;
      width: 100%;
      border-radius: 20px;

      &:first-child {
        margin-top: 8px;
      }
    }
  }

  .bottom-content {
    flex: 1;
    display: flex;
    gap: 20px;

    .preview-content {
      flex: 1;
    }

    .settings-content {
      width: 300px;

      p {
        height: 20px;
        width: 100%;
        border-radius: 50px;
        margin: 7px 0;

        &:first-child {
          margin-top: 0;
          height: 30px;
        }
      }
    }

  }

  .url-line {
    height: 56px;
  }
}
</style>