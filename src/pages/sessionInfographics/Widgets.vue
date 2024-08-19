<template>

  <h4>Как добавить виджет в игру</h4>
  <p>
    Чтоб добавить <b>любой</b> виджет прямо в игру вам необходим мод
    <a href="https://github.com/WOT-STAT/wotstat-widgets" target="_blank">wotstat-widgets</a>,
    скачайте его и с помощью уведомления в игре добавьте виджет в игру по ссылке.
    <a href="https://github.com/WOT-STAT/wotstat-widgets/releases/latest" target="_blank">СКАЧАТЬ</a>
  </p>
  <div class="flex center">
    <img src="https://raw.githubusercontent.com/WOT-STAT/wotstat-widgets/main/.github/hero.png" class="hero">
  </div>

  <h4>Как добавить в OBS (для стримеров)</h4>
  <p>
    Если вы добавляете виджет в OBS, ему всё ещё необходимо получать от игры информацию, для этого можете установить мод
    <a href="https://github.com/WOT-STAT/wotstat-widgets" target="_blank">wotstat-widgets</a> и никак его не
    настраивать ИЛИ установить легковесную альтернативу
    <a href="https://github.com/WOT-STAT/data-provider" target="_blank">data-provider</a>, она будет передавать данные,
    но не даст возможности добавить виджет в игру.
    <a href="https://github.com/WOT-STAT/data-provider/releases/latest" target="_blank">СКАЧАТЬ</a>
  </p>

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

h4 {
  margin-bottom: 0.5em;
}


.hero {
  max-width: 100%;
  max-height: 200px;
  height: auto;
  margin-top: 1em;
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