<template>
  <DebugPage title="Query storage" description="Общие refs, вложенные владельцы, KeepAlive, история и отложенная запись URL."
    source="src/shared/uiKit/queryStorage/useQueryStorage.ts">
    <DebugSection title="Текущее состояние" description="URL меняется после debounce; значения под контролами меняются сразу."
      source="src/shared/uiKit/queryStorage/useQueryStorage.ts">
      <pre class="debug-value query-url">{{ route.fullPath }}</pre>
      <label class="debug-control">Сезон <input type="text" v-model="season" /></label>
      <label class="debug-control">Слайдер <input v-model.number="shot" type="range" min="0" max="100" @change="storage.flush('shot')" /></label>
      <p>Выстрел: {{ shot }}</p>
      <div class="debug-row">
        <button class="debug-btn" @click="changeShot(-1)">Предыдущий выстрел</button>
        <button class="debug-btn" @click="changeShot(1)">Следующий выстрел</button>
      </div>
      <p>Кнопки обходят debounce через queryStorageSync. Ожидающий ввод никнейма сохраняет свою задержку.</p>
      <label class="debug-control"><input v-model="visible" type="checkbox" /> Видимость: {{ visible }}</label>
      <p>Набор: {{ [...items].join(', ') || 'пусто' }}</p>
      <p>Исходный default набора: {{ [...demoParams.items.default].join(', ') || 'пусто' }}</p>
      <div class="debug-row">
        <button class="debug-btn" @click="items.add(items.size + 1)">Добавить в Set</button>
        <button class="debug-btn" @click="items.clear()">Очистить Set</button>
        <button class="debug-btn" @click="applyPair">Применить пару</button>
        <button class="debug-btn" @click="storage.flush()">Записать сейчас</button>
        <button class="debug-btn" @click="resetThroughUrl">Сбросить через URL</button>
        <button class="debug-btn" @click="router.back()">Назад</button>
        <button class="debug-btn" @click="router.forward()">Вперёд</button>
      </div>
    </DebugSection>
    <DebugSection title="Контекст кодека"
      description="Источник хранит снимок региона. В URL совпадение обозначается _, в памяти — полный регион. Сравнение регистрируется раньше зависимости; регион и источники имеют debounce 800/300 мс."
      source="src/shared/uiKit/queryStorage/queryStorageCoordinator.ts">
      <p>Регион: {{ contextBase.region.value }}. Источники: {{ contextComparison.sources.value.join(', ') || 'пусто' }}</p>
      <label><input v-model="contextOwner" type="checkbox" /> Владелец региона</label>
      <div class="debug-row">
        <button class="debug-btn" @click="contextBase.region.value = 'RU'">Контекст RU</button>
        <button class="debug-btn" @click="contextBase.region.value = 'EU'">Контекст EU</button>
        <button class="debug-btn" @click="contextComparison.sources.value.push(contextBase.region.value)">Добавить источник</button>
        <button class="debug-btn" @click="contextComparison.sources.value = []">Очистить источники</button>
        <button class="debug-btn" @click="contextStorage.flush('sources')">Записать контекст сейчас</button>
      </div>
    </DebugSection>
    <DebugSection title="Стандартные параметры" id="standard-params"
      source="src/shared/uiKit/queryStorage/params.ts"
      description="Фабрики объединяют сериализатор, default и настройки URL. SetOf принимает массив default и создаёт Set; массив сохраняет повторы, дата округляется до дня.">
      <p>Дата: {{ date.toISOString() }}</p>
      <p>Массив: {{ JSON.stringify(labels) }}</p>
      <p>SetOf регионов: {{ [...regions].join(', ') || 'пусто' }}</p>
      <div class="debug-row">
        <button class="debug-btn" @click="date = new Date(date.getTime() + 86_400_000)">Следующий день</button>
        <button class="debug-btn" @click="labels.push('танк')">Добавить повтор в массив</button>
        <button class="debug-btn" @click="regions.add('EU')">Добавить EU в SetOf</button>
        <button class="debug-btn" @click="regions.delete('EU')">Убрать EU из SetOf</button>
        <button class="debug-btn" @click="resetThroughUrl">Сбросить через URL</button>
      </div>
    </DebugSection>
    <DebugSection title="Копирование default"
      source="src/shared/uiKit/queryStorage/utils/queryParamUtils.ts"
      description="Объект задан напрямую. Изменение вложенного объекта и массива не меняет исходный default; сброс через URL восстанавливает новую копию.">
      <p>Модель: {{ JSON.stringify(snapshot) }}</p>
      <p>Исходный default: {{ JSON.stringify(demoParams.snapshot.default) }}</p>
      <div class="debug-row">
        <button class="debug-btn" @click="snapshot.nested.count++">Изменить вложенный объект</button>
        <button class="debug-btn" @click="snapshot.values.push(snapshot.values.length + 1)">Добавить в массив</button>
        <button class="debug-btn" @click="resetThroughUrl">Сбросить через URL</button>
      </div>
    </DebugSection>
    <Serializers />
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
      source="src/shared/uiKit/queryStorage/queryStorageCoordinator.ts"
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
import { queryStorageSync, useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import DebugPage from '../../shared/DebugPage.vue'
import DebugSection from '../../shared/DebugSection.vue'
import Nickname from './Nickname.vue'
import Nested from './Nested.vue'
import Serializers from './Serializers.vue'
import { demoParams, contextRegion, contextSources } from './params'

const route = useRoute()
const router = useRouter()
const storage = useQueryStorage(demoParams)
const { season, shot, visible, items, snapshot, date, labels, regions } = storage.params
// Намеренно регистрируем зависимый параметр первым.
const contextOwner = ref(true)
const contextStorage = useQueryStorage({ sources: contextSources })
const contextComparison = contextStorage.params
const { params: contextBase } = useQueryStorage({ region: contextRegion }, { enabled: contextOwner })
const showFirst = ref(true)
const showNested = ref(true)

function changeShot(delta: number) {
  queryStorageSync(() => {
    shot.value = Math.max(0, Math.min(100, shot.value + delta))
  })
}

function applyPair() {
  queryStorageSync(() => {
    storage.patch({ season: 'Новый сезон', shot: 75 }, { history: 'push' })
  })
}

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
