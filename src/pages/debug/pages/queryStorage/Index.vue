<template>
  <DebugPage title="Query storage" description="Общие refs, вложенные владельцы, KeepAlive, история и отложенная запись URL."
    source="src/shared/ui/queryStorage/useQueryStorage.ts">
    <DebugSection title="Текущее состояние" description="URL меняется после debounce; значения под контролами меняются сразу."
      source="src/shared/ui/queryStorage/useQueryStorage.ts">
      <pre class="debug-value query-url">{{ route.fullPath }}</pre>
      <label class="debug-control">Сезон <input type="text" v-model="season" /></label>
      <label class="debug-control">Слайдер <input v-model.number="shot" type="range" min="0" max="100" @change="storage.flush('shot')" /></label>
      <p>Выстрел: {{ shot }}</p>
      <label class="debug-control"><input v-model="visible" type="checkbox" /> Видимость: {{ visible }}</label>
      <p>Набор: {{ [...items].join(', ') || 'пусто' }}</p>
      <div class="debug-row">
        <button class="debug-btn" @click="items.add(items.size + 1)">Добавить в Set</button>
        <button class="debug-btn" @click="items.clear()">Очистить Set</button>
        <button class="debug-btn" @click="storage.patch({ season: 'Новый сезон', shot: 75 }, { history: 'push', debounce: 0 })">Применить пару</button>
        <button class="debug-btn" @click="storage.flush()">Записать сейчас</button>
        <button class="debug-btn" @click="resetThroughUrl">Сбросить через URL</button>
        <button class="debug-btn" @click="router.back()">Назад</button>
        <button class="debug-btn" @click="router.forward()">Вперёд</button>
      </div>
    </DebugSection>
    <DebugSection title="Владельцы и KeepAlive"
      source="src/pages/debug/pages/queryStorage/Nested.vue"
      description="Оба поля никнейма связаны. URL сохраняет nickname до скрытия последнего владельца. Скрывайте компоненты во время ввода, не дожидаясь debounce.">
      <div class="debug-row">
        <label><input v-model="showFirst" type="checkbox" /> Первый владелец</label>
        <label><input v-model="showNested" type="checkbox" /> Вложенный владелец в KeepAlive</label>
      </div>
      <Nickname v-if="showFirst" caption="Первый никнейм" />
      <KeepAlive><Nested v-if="showNested" /></KeepAlive>
    </DebugSection>
    <DebugSection title="Переход между страницами"
      source="src/shared/ui/queryStorage/queryStorageCoordinator.ts"
      description="Повторный клик сохраняет фильтры. На синхронном переходе адрес браузера меняется сразу на итоговый: общие параметры остаются, остальные исчезают. При долгой загрузке страницы параметры восстанавливаются после лоадера. Назад/Вперёд и перезагрузка читают URL.">
      <RouterLink to="/debug/query-storage">Повторно открыть этот стенд</RouterLink>
      <RouterLink to="/debug/options-select">Перейти на другой стенд</RouterLink>
      <RouterLink to="/session">Перейти в инфографику с общим никнеймом</RouterLink>
      <a href="/debug/query-storage?nickname=Игрок-из-ссылки&amp;debug-shot=42&amp;debug-visible=0">Открыть ссылку с перезагрузкой</a>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useQueryStorage } from '@/shared/ui/queryStorage/useQueryStorage'
import DebugPage from '../../shared/DebugPage.vue'
import DebugSection from '../../shared/DebugSection.vue'
import Nickname from './Nickname.vue'
import Nested from './Nested.vue'
import { demoParams } from './params'

const route = useRoute()
const router = useRouter()
const storage = useQueryStorage(demoParams)
const { season, shot, visible, items } = storage.params
const showFirst = ref(true)
const showNested = ref(true)

function resetThroughUrl() {
  void router.push({ query: {
    nickname: '',
    'debug-season': '',
    'debug-shot': '0',
    'debug-visible': '1',
    'debug-items': ''
  } })
}
</script>

<style scoped>
.query-url {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
