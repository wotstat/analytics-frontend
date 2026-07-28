<template>
  <DebugSection title="Фолбэки и ошибки загрузки" id="fallback"
    source="src/shared/uiKit/fallbackImg/FallbackImg.vue, store.ts"
    description="Несуществующий тег, битый URL, кеш ошибок по URL и повторный показ того же URL.">

    <div class="debug-col">
      <p class="debug-label">несуществующий тег техники</p>
      <div class="debug-row">
        <div class="debug-stage short">
          <VehicleImage tag="ussr:NOT_A_REAL_TANK_XYZ" size="preview" game="mt" class="w200" />
        </div>
        <div class="debug-stage short">
          <VehicleImage tag="ussr:NOT_A_REAL_TANK_XYZ" size="preview" game="wot" class="w200" />
        </div>
      </div>
      <p class="debug-hint">
        Тега нет ни в одном атласе — картинка 404, <span class="debug-value">FallbackImg</span> подменяет её на
        <span class="debug-value">vehicleFallbackUrl('preview')</span> автоматически. Слева <span
          class="debug-value">game="mt"</span>,
        справа <span class="debug-value">game="wot"</span> — картинка фолбэка одна и та же.
      </p>
      <p class="debug-note">
        <span class="debug-value">vehicleFallbackUrl</span> не принимает <span class="debug-value">game</span> и
        всегда обращается к <span class="debug-value">/mt/latest/vehicles/{size}/no-image.*</span>, даже когда
        основная картинка была <span class="debug-value">wot</span>. Похоже на недосмотр: если когда-нибудь у mt и
        wot заведут разные заглушки — для wot будет показываться чужая.
      </p>
    </div>

    <div class="debug-col">
      <p class="debug-label">битый URL напрямую через FallbackImg</p>

      <div class="debug-row">
        <button class="debug-btn" @click="addInstance">показать ещё раз тот же битый URL ({{ instances }})</button>
        <button class="debug-btn" @click="resetCache">сбросить кеш ошибки для этого URL</button>
        <button class="debug-btn" @click="refreshStatus">обновить статус</button>
        <span class="debug-hint">
          кеш (store.ts): <span class="debug-value">{{ cachedAsError ? 'URL помечен битым' : 'URL не в кеше' }}</span>
        </span>
      </div>

      <div class="debug-row">
        <div class="debug-stage short" v-for="i in instances" :key="i">
          <FallbackImg :src="brokenUrl" :fallback="fallbackUrl" class="w150" />
        </div>
      </div>

      <p class="debug-path">{{ brokenUrl }}</p>

      <p class="debug-note">
        Ошибка кешируется по <b>URL</b> в модульном <span class="debug-value">Set</span> (<span
          class="debug-value">errorUrlSet</span>),
        общем для всех <span class="debug-value">FallbackImg</span> на странице. Первый экземпляр реально шлёт запрос
        и реагирует на событие <span class="debug-value">@error</span>, а не на конкретный HTTP-статус — в Chromium
        кросс-доменный ответ на битый URL блокируется как ORB (<span
          class="debug-value">net::ERR_BLOCKED_BY_ORB</span>) раньше, чем код увидит статус, хотя сам сервер отдаёт
        404. Каждый следующий, смонтированный уже после этого
        (кнопка выше), сразу стартует с <span class="debug-value">initSrc = fallback</span> — см.
        <span class="debug-value">isUrlMayValidImage</span> — и лишнего запроса не делает. Статус не реактивный
        (обычный Set, не ref) — обновляется только по кнопке.
      </p>
    </div>

    <div class="debug-col">
      <p class="debug-label">медленная / повторная загрузка</p>
      <div class="debug-row">
        <button class="debug-btn" @click="nonce++">перезагрузить с новым URL (мимо кэша браузера)</button>
      </div>
      <div class="debug-stage short">
        <FallbackImg :key="nonce" :src="bustedUrl" :fallback="fallbackUrl" class="w200" />
      </div>
      <p class="debug-note">
        У <span class="debug-value">FallbackImg</span> нет состояния загрузки — пока сеть не ответила, на месте
        картинки просто пусто (ни скелетона, ни спиннера). Кнопка меняет <span class="debug-value">:key</span>,
        компонент пересоздаётся и тянет картинку заново мимо HTTP-кэша — заметен пустой промежуток.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'
import { isUrlMayValidImage, onErrorRemoveUrl } from '@/shared/uiKit/fallbackImg/store'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import { vehicleFallbackUrl, vehicleUrl } from '@/shared/game/vehicles/vehicle/utils'

const brokenUrl = vehicleUrl('mt:__DEBUG_BROKEN_TAG__', 'preview')
const fallbackUrl = vehicleFallbackUrl('preview')

const instances = ref(1)
const cachedAsError = ref(false)

function refreshStatus() {
  cachedAsError.value = !isUrlMayValidImage(brokenUrl)
}

function addInstance() {
  instances.value++
}

function resetCache() {
  onErrorRemoveUrl(brokenUrl)
  refreshStatus()
}

const nonce = ref(0)
const bustedUrl = computed(() => `${vehicleUrl('ussr:R45_IS-7', 'preview')}?bust=${nonce.value}`)
</script>


<style scoped lang="scss">
.w200 {
  width: 200px;
}

.w150 {
  width: 150px;
}
</style>
