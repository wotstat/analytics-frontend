<template>
  <iframe :src="`${WIDGETS_URL}/iframe/collection`" frameborder="0" class="collection" ref="collection" :style="{
    height: `${height}px`
  }" @load="onCollectionLoad"></iframe>

  <PopupWindow :title="selectedTitle" v-if="selectedRoute" @close="selectedRoute = null">
    <iframe :src="`${WIDGETS_URL}/iframe/preview${selectedRoute}`" frameborder="0" class="preview"
      allow="clipboard-write" ref="preview" @load="onPreviewLoad"></iframe>
  </PopupWindow>
</template>


<script setup lang="ts">
import PopupWindow from '@/components/PopupWindow.vue';
import { useIframeContentBounding } from '@/composition/useIframeContentBounding';
import { useIframeMessages } from '@/composition/useIframeMessages';
import { computed, onDeactivated, ref } from 'vue';

const selectedRoute = ref<string | null>(null);
const selectedTitle = ref<string>('');
const collection = ref<HTMLIFrameElement | null>(null);
const preview = ref<HTMLIFrameElement | null>(null);

const { height } = useIframeContentBounding(collection);

const WIDGETS_URL = import.meta.env.VITE_WIDGETS_URL as string;

useIframeMessages(collection, data => {
  if (data.type === 'widget-click') {
    selectedTitle.value = data.title;
    selectedRoute.value = data.route;
  }
});

onDeactivated(() => {
  if (collection.value) {
    collection.value.style.opacity = '0';
  }
  selectedRoute.value = null;
});

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