<template>
  <br>
  <p>Виджеты универсальные их можно добавлять как в OBS так и прямо в игру</p>
  <div class="flex center">
    <img src="https://raw.githubusercontent.com/WOT-STAT/wotstat-widgets/main/.github/hero.png" class="hero">
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

  <iframe :src="`${WIDGETS_URL}/iframe/collection`" frameborder="0" class="collection" ref="collection" :style="{
    height: `${height}px`
  }" @load="onCollectionLoad"></iframe>

  <PopupWindow :title="selectedTitle" v-if="selectedRoute" @close="onClosePreview">
    <iframe :src="`${WIDGETS_URL}/iframe/preview${selectedRoute}`" frameborder="0" class="preview"
      allow="clipboard-write" ref="preview" @load="onPreviewLoad"></iframe>
  </PopupWindow>
</template>


<script setup lang="ts">
import According from '@/components/According.vue';
import PopupWindow from '@/components/PopupWindow.vue';
import { useIframeContentBounding } from '@/composition/useIframeContentBounding';
import { useIframeMessages } from '@/composition/useIframeMessages';
import { computed, onDeactivated, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { VueComponent as InstructionGame } from "./instructionGame.md";
import { VueComponent as InstructionOBS } from "./instructionOBS.md";


const selectedTitle = ref<string>('');
const collection = ref<HTMLIFrameElement | null>(null);
const preview = ref<HTMLIFrameElement | null>(null);

const route = useRoute()
const router = useRouter()

const selectedRoute = computed(() => {
  const targetWidget = route.params.widget;

  if (Array.isArray(targetWidget) && targetWidget.length > 0) {
    return '/' + targetWidget.join('/');
  }

  if (targetWidget)
    return '/' + route.params.widget;

  return null
});


const { height } = useIframeContentBounding(collection);

const WIDGETS_URL = import.meta.env.VITE_WIDGETS_URL as string;

useIframeMessages(collection, data => {
  if (data.type === 'widget-click') {
    selectedTitle.value = data.title;

    router.push({
      query: { ...route.query },
      params: { widget: data.route.split('/').filter(Boolean) }
    });
  }
});

onDeactivated(() => {
  if (collection.value) {
    collection.value.style.opacity = '0';
  }

  if (selectedRoute.value) onClosePreview();
});

function onClosePreview() {
  router.push({
    query: { ...route.query },
    params: { widget: '' }
  });
}

function onCollectionLoad() {
  if (!collection.value) return;
  collection.value.style.opacity = '1';
}

function onPreviewLoad() {
  if (!preview.value) return;
  preview.value.style.opacity = '1';
}


</script>


<style lang="scss" scoped>
@import "@/styles/mixins.scss";

h4 {
  margin: 0;
}


.hero {
  max-width: 550px;
  width: 100%;
  height: auto;
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
  }
}

.collection {
  width: 100%;
  height: auto;
  background: transparent;
  margin-top: 2em;
  opacity: 0;
}

.preview {
  max-width: 100%;
  width: 900px;
  height: 700px;
  opacity: 0;

  @include less-small {
    height: 100%;
  }
}
</style>