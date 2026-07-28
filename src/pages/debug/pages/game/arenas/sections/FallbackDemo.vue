<template>
  <DebugSection title="Фолбэк: арена без картинки" id="fallback"
    description="Отсутствующая арена и битый URL — миникарта обязана откатиться на fallback.webp, а не показать сломанную иконку браузера."
    source="src/shared/uiKit/fallbackImg/">

    <p class="debug-note">
      У миникарты фолбэк один на все случаи — <span class="debug-value">minimapBackground/fallback.webp</span>: он же
      подставляется и для несуществующей арены, и для битого URL. Похожий
      <span class="debug-value">fallback-minimap.webp</span> в репозитории тоже есть, но принадлежит селектору арен
      (<span class="debug-value">selectors/arena/arenaSelectorModal/</span>) и к этому компоненту отношения не имеет.
    </p>

    <div class="debug-row">
      <div class="demo">
        <span class="debug-label">несуществующий tag</span>
        <div class="box">
          <MinimapBackground tag="this-arena-does-not-exist-42" game="mt" />
        </div>
        <span class="debug-path">tag: this-arena-does-not-exist-42</span>
      </div>

      <div class="demo">
        <span class="debug-label">битый абсолютный URL (через FallbackImg)</span>
        <div class="box">
          <FallbackImg :src="brokenUrl" :fallback="FallbackImage" />
        </div>
        <span class="debug-path">{{ brokenUrl }}</span>
      </div>
    </div>

    <h3 class="cache-title">Кеш ошибок FallbackImg (isUrlMayValidImage)</h3>
    <p class="debug-hint">
      errorUrlSet в store.ts — обычный <span class="debug-value">Set</span>, не reactive-состояние. initSrc внутри
      FallbackImg считается один раз при создании компонента (не computed), поэтому кеш влияет только на то, с каким
      src компонент СОЗДАСТСЯ следующий раз — уже смонтированный компонент про запись в кеше не узнает.
    </p>

    <div class="debug-row">
      <button class="debug-btn" @click="regenerate">новый битый URL</button>
      <button class="debug-btn" @click="recheck">перечитать кеш</button>
      <button class="debug-btn" @click="forget">забыть ошибку (onErrorRemoveUrl) + remount</button>
    </div>

    <div class="debug-row">
      <span class="debug-hint">
        isUrlMayValidImage(url): <span class="debug-value" :class="isValid ? 'true' : 'false'">{{ isValid }}</span>
        (обновлено вручную кнопкой «перечитать», сам по себе не реактивен)
      </span>
    </div>

    <div class="debug-stage center short">
      <div class="box" :key="mountKey">
        <FallbackImg :src="cacheDemoUrl" :fallback="FallbackImage" />
      </div>
    </div>

    <p class="debug-note">
      <span class="debug-value">FallbackImg</span> не задаёт своей картинке никаких размеров — без CSS от потребителя
      она рисуется в натуральную величину (у fallback.webp это 1024px) и вылезает из контейнера. У
      <span class="debug-value">MinimapBackground</span> такой проблемы нет: он зажимает картинку сам.
    </p>

    <p class="debug-note">
      Сценарий: жми «новый битый URL» → картинка 404-ится → FallbackImg сам вызывает onErrorWithUrl и переключается на
      fallback.webp → «перечитать кеш» покажет true. Дальше «забыть ошибку» удаляет url из Set и форсит remount —
      компонент опять пробует настоящий (всё ещё битый) src, снова 404-ится и снова попадает в кеш. Без remount
      простое удаление из Set ничего на экране не поменяло бы.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import MinimapBackground from '@/shared/game/arenas/minimap/minimapBackground/MinimapBackground.vue'
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'
import { isUrlMayValidImage, onErrorRemoveUrl } from '@/shared/uiKit/fallbackImg/store'
import { STATIC_URL } from '@/shared/external/externalUrl'
import FallbackImage from '@/shared/game/arenas/minimap/minimapBackground/fallback.webp'

function randomBrokenUrl() {
  return `${STATIC_URL}/mt/latest/arenas/minimap/broken-${Math.random().toString(36).slice(2)}.webp`
}

const brokenUrl = ref(randomBrokenUrl())
const cacheDemoUrl = ref(randomBrokenUrl())
const mountKey = ref(0)
const recheckTick = ref(0)

const isValid = computed(() => {
  void recheckTick.value // читаем только чтобы форсировать пересчёт по клику «перечитать»
  return isUrlMayValidImage(cacheDemoUrl.value)
})

function regenerate() {
  cacheDemoUrl.value = randomBrokenUrl()
  mountKey.value++
}

function recheck() {
  recheckTick.value++
}

function forget() {
  onErrorRemoveUrl(cacheDemoUrl.value)
  mountKey.value++
  recheckTick.value++
}
</script>


<style scoped lang="scss">
.demo {
  display: flex;
  flex-direction: column;
  gap: 0.3em;
}

.box {
  width: 140px;
  height: 140px;

  :deep(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.cache-title {
  font-size: 0.95em;
  margin: 0.2em 0 0;
}
</style>
