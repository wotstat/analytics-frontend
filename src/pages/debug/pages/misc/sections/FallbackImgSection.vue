<template>
  <DebugSection title="FallbackImg" id="fallback-img" source="src/shared/uiKit/fallbackImg/"
    description="Рабочая картинка, битый URL с фолбэком и без, кеш ошибок и его сброс. Отдельно — есть ли состояние загрузки и задаёт ли компонент размеры (нет).">

    <div class="debug-col">
      <span class="debug-label">Три исхода</span>
      <div class="debug-row">
        <div class="demo">
          <span class="debug-label">рабочая картинка</span>
          <div class="box clamped">
            <FallbackImg :src="workingImage" alt="рабочая картинка" />
          </div>
        </div>
        <div class="demo">
          <span class="debug-label">битый URL, fallback не задан</span>
          <div class="box clamped">
            <FallbackImg :src="brokenNoFallbackUrl" alt="битая картинка без фолбэка" />
          </div>
        </div>
        <div class="demo">
          <span class="debug-label">битый URL с fallback</span>
          <div class="box clamped">
            <FallbackImg :src="brokenWithFallbackUrl" :fallback="fallbackImage" alt="картинка с фолбэком" />
          </div>
        </div>
      </div>
      <p class="debug-note">
        Без пропа fallback обработчик onerror ничего не делает (в коде компонента — ранний return, если fallback не
        передан), поэтому на месте средней картинки остаётся именно сломанная иконка браузера, а не тихая пустота.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Кеш ошибок (store.ts — errorUrlSet)</span>
      <p class="debug-hint">
        Тот же кеш уже разобран на странице <RouterLink to="/debug/game/arenas#fallback">карт</RouterLink> вместе с
        MinimapBackground — здесь то же самое поведение, но напрямую через FallbackImg. errorUrlSet — обычный Set, не
        реактивное состояние; initSrc внутри FallbackImg считается один раз при создании компонента, поэтому запись в
        кеше видит только следующий заново смонтированный экземпляр, а не уже показанный.
      </p>
      <div class="debug-row">
        <button class="debug-btn" @click="regenerateCacheDemo">новый битый URL</button>
        <button class="debug-btn" @click="recheckCache">перечитать кеш</button>
        <button class="debug-btn" @click="forgetCacheUrl">сбросить (onErrorRemoveUrl) + remount</button>
      </div>
      <p class="debug-hint">
        isUrlMayValidImage(url): <span class="debug-value" :class="cacheIsValid ? 'true' : 'false'">{{ cacheIsValid
        }}</span>
        — само по себе не реактивно, значение обновляется только по кнопке «перечитать кеш»
      </p>
      <div class="debug-stage center short">
        <div class="box clamped" :key="cacheMountKey">
          <FallbackImg :src="cacheUrl" :fallback="fallbackImage" alt="демонстрация кеша" />
        </div>
      </div>
      <p class="debug-note">
        Сценарий: «новый битый URL» → картинка 404-ится → FallbackImg сам вызывает onErrorWithUrl и переключается на
        fallback → «перечитать кеш» покажет true. Повторный показ уже проваленного URL картинку заново не грузит: при
        создании компонента initSrc сразу берёт fallback по isUrlMayValidImage, минуя настоящий src и второй 404.
        «Сбросить + remount» удаляет URL из Set и форсит новый экземпляр — тот заново пробует настоящий (всё ещё
        битый) src и опять попадает в кеш; без remount само удаление из Set на экране ничего не изменило бы.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Состояние загрузки — его нет</span>
      <p class="debug-note">
        У FallbackImg нет ни спиннера, ни плейсхолдера, ни реактивного флага «грузится». Единственный связанный проп —
        нативный loading (lazy или eager), это просто атрибут тега img для браузерного планировщика загрузки, к
        отображению состояния компонент отношения не имеет.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Размеры — компонент их не задаёт</span>
      <p class="debug-hint">
        Тот же факт, что уже всплыл на странице карт: FallbackImg рисует img без единого правила про размер. Слева —
        как это выглядит без вмешательства потребителя, справа — с object-fit: contain снаружи.
      </p>
      <div class="debug-row">
        <div class="demo">
          <span class="debug-label">без CSS от потребителя</span>
          <div class="debug-stage">
            <div class="box small unclamped">
              <FallbackImg :src="workingImage" alt="без ограничений" />
            </div>
          </div>
        </div>
        <div class="demo">
          <span class="debug-label">с object-fit: contain</span>
          <div class="debug-stage">
            <div class="box small clamped">
              <FallbackImg :src="workingImage" alt="с ограничением" />
            </div>
          </div>
        </div>
      </div>
      <p class="debug-note">
        Картинка размером 200×200 в контейнере 90×90 без сдерживающего CSS рисуется в полную величину и вылезает за
        рамку блока — зажимать её обязан потребитель, как в клетчатом блоке справа.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'
import { isUrlMayValidImage, onErrorRemoveUrl } from '@/shared/uiKit/fallbackImg/store'
import { STATIC_URL } from '@/shared/external/externalUrl'

// Нейтральные SVG-картинки, чтобы не тащить сюда игровые ассеты других страниц.
function svgDataUri(inner: string, size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${inner}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const workingImage = svgDataUri(
  '<rect width="200" height="200" rx="20" fill="#2ecc71"/><path d="M50 105l35 35 65-75" stroke="#0b3d20" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  200,
)

const fallbackImage = svgDataUri(
  '<rect width="120" height="120" rx="14" fill="#555"/><circle cx="45" cy="42" r="14" fill="#999"/><path d="M22 92l30-34 22 22 16-18 30 30z" fill="#999"/>',
  120,
)

function randomBrokenUrl() {
  return `${STATIC_URL}/debug/does-not-exist-${Math.random().toString(36).slice(2)}.webp`
}

const brokenNoFallbackUrl = ref(randomBrokenUrl())
const brokenWithFallbackUrl = ref(randomBrokenUrl())
const cacheUrl = ref(randomBrokenUrl())
const cacheMountKey = ref(0)
const recheckTick = ref(0)

const cacheIsValid = computed(() => {
  void recheckTick.value // читаем только чтобы форсировать пересчёт по кнопке «перечитать»
  return isUrlMayValidImage(cacheUrl.value)
})

function regenerateCacheDemo() {
  cacheUrl.value = randomBrokenUrl()
  cacheMountKey.value++
}

function recheckCache() {
  recheckTick.value++
}

function forgetCacheUrl() {
  onErrorRemoveUrl(cacheUrl.value)
  cacheMountKey.value++
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

  &.small {
    width: 90px;
    height: 90px;
  }

  &.clamped :deep(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.unclamped {
  overflow: visible;
}
</style>
