<template>
  <PopupWindow @close="onClose" v-if="visible">
    <div class="main">

      <img :src="MedalSrc" class="fetch-only">

      <div class="content downloading" v-if="status.type === 'downloading'">
        <h1>Загружаю модификации</h1>
        <div class="progress">
          <div class="bar" :style="{ width: `${((1 + status.index) / status.total) * 100}%` }"></div>
          <p>{{ (status.index + 1) }}/{{ status.total }}</p>
        </div>
        <p class="mod-name">{{ status.mod.split('/').pop() }}</p>
      </div>

      <div class="content done" v-else-if="status.type === 'done'">
        <h1>Готово!</h1>
        <p>Распакуйте архив в папку с игрой</p>
        <img :src="MedalSrc" class="medal">
      </div>

      <div class="content error" v-else>
        <h1>Ошибка</h1>
        <p>Не удалось загрузить модификации</p>
        <p v-if="status.type === 'error'">{{ status.error }}</p>
      </div>
    </div>
  </PopupWindow>
</template>


<script setup lang="ts">
import PopupWindow from '@/components/shared/PopupWindow.vue'
import { download } from '../../utils/downloader'
import { ref, watch } from 'vue'
import { exportArchive } from './exportArchive'

import MedalSrc from '../../assets/medal.webp'

const visible = ref(false)

const props = defineProps<{
  mods: string[],
  vendor: 'lesta' | 'wargaming'
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()


const { status, abortController } = download(props.mods, props.vendor)
setTimeout(() => {
  if (status.value.type === 'downloading') visible.value = true
}, 100)


function onClose() {

  if (status.value.type === 'downloading') {
    abortController.abort()
  }

  emit('close')
}

watch(status, (v, old) => {
  if (v.type == old.type) return

  if (v.type == 'done') {
    exportArchive(v.mods, props.vendor)
      .then(() => {
        if (!visible.value) emit('close')
      })
  }
})

</script>


<style lang="scss" scoped>
.main {
  width: 500px;
  height: 150px;
}

h1 {
  font-size: 2.5rem;
  margin: 0;
}

.content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  height: 100%;
}

.downloading {


  h1 {
    font-size: 1.5rem;
  }

  .progress {
    background: #4a4a4a;
    border-radius: 4px;
    overflow: hidden;
    flex: 1;
    width: 100%;
    position: relative;
    max-height: 25px;


    .bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(0deg, #ff3c00, #ff651d);

      transition: width 0.3s ease-in-out;
    }

    p {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 1rem;
      font-weight: bold;
    }
  }

  .mod-name {
    font-size: 1em;
    color: #a3a3a3;
    margin-top: -15px;
    text-align: center;
  }
}

.done {

  .medal {
    position: absolute;
    width: 110px;
    left: 15px;
    user-select: none;
    pointer-events: none;
  }
}
</style>