<template>
  <PopupWindow @close="onClose" v-if="visible">
    <div class="main">

      <img :src="Tada1Src" class="fetch-only">
      <img :src="Tada2Src" class="fetch-only">

      <div class="content downloading" v-if="status.type === 'downloading'">
        <h1>Загружаю модификации</h1>
        <div class="progress">
          <div class="bar" :style="{ width: `${((1 + status.index) / status.total) * 100}%` }"></div>
          <p>{{ (status.index + 1) }}/{{ status.total }}</p>
        </div>
        <p class="mod-name">{{ status.mod.split('/').pop() }}</p>
      </div>

      <div class="content unpacking" v-else-if="unpackState.type === 'unpacking'">
        <h1>Распаковка в игру</h1>
        <div class="progress">
          <div class="bar" :style="{ width: `${((1 + unpackState.index) / unpackState.total) * 100}%` }"></div>
          <p>{{ (unpackState.index + 1) }}/{{ unpackState.total }}</p>
        </div>
        <p class="mod-name">{{ unpackState.mod }}</p>
      </div>


      <div class="content done" v-else-if="unpackState.type === 'done'">
        <h1>Готово!</h1>
        <p>Модификации успешно установлены.</p>

        <img :src="Tada1Src" class="tada tada-1" draggable="false" @click="tada1Effect">
        <img :src="Tada2Src" class="tada tada-2" draggable="false" @click="tada2Effect">
      </div>


      <div class="content error" v-else>
        <h1>Ошибка</h1>
        <p>Не удалось загрузить модификации</p>
        <p v-if="status.type === 'error'">{{ status.error }}</p>
      </div>

      <div class="full">
        <Confetti ref="confetti" />
      </div>
    </div>
  </PopupWindow>
</template>


<script setup lang="ts">
import PopupWindow from '@/components/shared/PopupWindow.vue'
import { download } from '../utils/downloader'
import { defineAsyncComponent, ref, watch } from 'vue'

import Tada1Src from '../assets/tada-1.webp'
import Tada2Src from '../assets/tada-2.webp'

const Confetti = defineAsyncComponent(() => import('@/pages/install/components/Confetti.vue'))

const confetti = ref<InstanceType<typeof Confetti> | null>(null)

type UnpackState = { type: 'not-started' } |
{ type: 'unpacking', index: number, total: number, mod: string } |
{ type: 'done' } |
{ type: 'error', error: string };


const visible = ref(false)
const unpackState = ref<UnpackState>({ type: 'not-started' })

const props = defineProps<{
  mods: string[],
  vendor: 'lesta' | 'wargaming',
  installMod: (filename: string, mod: Blob) => Promise<void>
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()


const { status, abortController } = download(props.mods, props.vendor)
setTimeout(() => {
  if (status.value.type === 'downloading') visible.value = true
}, 100)

async function unpack(mods: { filename: string, blob: Blob }[]) {

  for (let i = 0; i < mods.length; i++) {
    const mod = mods[i]
    unpackState.value = { type: 'unpacking', index: i, total: mods.length, mod: mod.filename }

    try {
      await props.installMod(mod.filename, mod.blob)
    } catch (e) {
      unpackState.value = { type: 'error', error: `Не удалось установить модификацию ${mod.filename}` }
      console.error('Error installing mod:', e)
      return
    }
  }

  unpackState.value = { type: 'done' }

  effect()
}

function onClose() {

  if (status.value.type === 'downloading') {
    abortController.abort()
  }

  emit('close')
}

watch(status, (v, old) => {
  if (v.type == old.type) return

  if (v.type == 'done') {
    visible.value = true
    unpack(v.mods)
  }
})


function effect() {

  function fire() {
    tada1Effect()
    tada2Effect()
  }

  setTimeout(() => fire(), 150)
  setTimeout(() => fire(), 150)
}

function tada1Effect() {
  if (!confetti.value) return
  if (!confetti.value.start) return

  confetti.value.start({
    particleCount: 100,
    spread: 170,
    angle: 130,
    decay: 0.92,
    startVelocity: 20,
    origin: { y: 0.39, x: 0.89 },

    colors: ['#df2b44', '#df2b44', '#74ac4e', '#fecd4d', '#ab8edc']
  })
}


function tada2Effect() {
  if (!confetti.value) return
  if (!confetti.value.start) return

  confetti.value.start({
    particleCount: 100,
    spread: 180,
    angle: 50,
    decay: 0.92,
    startVelocity: 20,
    origin: { y: 0.6, x: 0.1 },
    colors: ['#fec204', '#fec204', '#f54336', '#f48fb2', '#fa9000', '#06aaf1', '#f29200']
  })
}

</script>


<style lang="scss" scoped>
.main {
  width: 500px;
  height: 150px;
  margin: -2 0px;
  position: relative;
}

.full {
  position: absolute;
  inset: -20px;
  overflow: hidden;
  pointer-events: none;
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

.downloading,
.unpacking {


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

  .tada {
    z-index: 50;
    position: absolute;
    width: 75px;
    user-select: none;
    transition: transform 0.3s ease-in-out;
    animation: scale-easeOutElastic 1.5s linear;

    @keyframes scale-easeOutElastic {
      0% {
        transform: scale(0);
        opacity: 0;
      }

      16% {
        transform: scale(1.32);
      }

      28% {
        transform: scale(0.87);
        opacity: 1;
      }

      44% {
        transform: scale(1.05);
      }

      59% {
        transform: scale(0.98);
      }

      73% {
        transform: scale(1.01);
      }

      88% {
        transform: scale(1);
      }

      100% {
        transform: scale(1);
      }

    }

    &:hover {
      transform: scale(1.1);
    }

    &:active {
      transition: transform 0.1s ease-in-out;
      transform: scale(0.9);
    }
  }

  .tada-1 {
    top: 20px;
    right: 5px;
  }

  .tada-2 {
    top: 60px;
    left: 5px;
  }

}
</style>