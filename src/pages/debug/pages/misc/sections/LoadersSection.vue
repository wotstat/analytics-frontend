<template>
  <DebugSection title="Loader и PageLoader" id="loaders" source="src/shared/ui/loaders/"
    description="Loader — спиннер без единого пропа, размер и цвет только через ambient CSS. PageLoader — то же самое, что подставляет роутер на время ленивой загрузки страницы.">

    <div class="debug-col">
      <span class="debug-label">Loader на разном фоне</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">размер (font-size)</span>
          <input type="range" min="8" max="64" v-model.number="loaderSize">
          <span class="debug-value">{{ loaderSize }}px</span>
        </label>
      </div>

      <div class="debug-grid loader-grid">
        <div class="swatch dark">
          <Loader :style="{ fontSize: loaderSize + 'px' }" />
        </div>
        <div class="swatch light">
          <Loader :style="{ fontSize: loaderSize + 'px' }" />
        </div>
        <div class="swatch brand">
          <Loader :style="{ fontSize: loaderSize + 'px' }" />
        </div>
      </div>

      <p class="debug-note">
        У Loader нет пропсов вообще: ни size, ни color. Размер задаётся через font-size обёртки — все тени спиннера
        нарисованы в em. Цвет — через CSS color, по умолчанию почти белый (rgba(255,255,255,0.87)), поэтому на светлом
        фоне слева он почти не виден без переопределения снаружи.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">PageLoader — как его показывает роутер при ленивой загрузке страницы</span>

      <p class="debug-hint">
        Тот же вызов, что и в src/routes.ts: defineAsyncComponent с loadingComponent — PageLoader, delay — 200 мс,
        suspensible — true. Первые 200 мс после начала загрузки ничего не показывается вообще — защита от мигания на
        быстрых чанках, — а уже потом появляется PageLoader.
      </p>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">искусственная задержка «чанка», мс</span>
          <input type="range" min="0" max="3000" step="100" v-model.number="fakeDelay">
          <span class="debug-value">{{ fakeDelay }}</span>
        </label>
        <button class="debug-btn" @click="remount">запустить заново</button>
      </div>

      <div class="debug-stage">
        <component :is="asyncDemo" :key="mountKey" />
      </div>

      <p class="debug-note">
        При задержке около 0–200 мс защитная пауза delay может успеть проскочить всю загрузку целиком, и PageLoader
        мелькнуть не успеет — для наглядного спиннера выставляй задержку побольше.
      </p>

      <p class="debug-note">
        PageLoader — это ровно Loader внутри блока с фиксированной высотой 200px, без единого пропа. Высоту снаружи не
        поменять; на странице с другой высотой контента спиннер всегда будет в блоке именно такого размера.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { defineAsyncComponent, h, ref, shallowRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import PageLoader from '@/shared/ui/loaders/pageLoader/PageLoader.vue'

const loaderSize = ref(14)
const fakeDelay = ref(1500)
const mountKey = ref(0)

function makeAsyncDemo() {
  const delay = fakeDelay.value
  return defineAsyncComponent({
    loader: () => new Promise<any>(resolve => setTimeout(() => resolve({
      render: () => h('p', { class: 'debug-hint' }, 'страница «загрузилась» (здесь просто заглушка вместо чанка)'),
    }), delay)),
    loadingComponent: PageLoader,
    delay: 200,
    suspensible: true,
  })
}

const asyncDemo = shallowRef(makeAsyncDemo())

function remount() {
  mountKey.value++
  asyncDemo.value = makeAsyncDemo()
}

</script>


<style scoped lang="scss">
.loader-grid {
  --debug-grid-min: 140px;
}

.swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  border-radius: 6px;
  border: 1px solid var(--debug-border);

  &.dark {
    background: #0c0c10;
  }

  &.light {
    background: #f2f2f2;
  }

  &.brand {
    background: var(--blue-color);
  }
}
</style>
