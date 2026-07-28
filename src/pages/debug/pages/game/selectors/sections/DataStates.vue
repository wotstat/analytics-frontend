<template>
  <DebugSection title="Данные списков: загрузка, пусто, битый список" id="data"
    description="Попапы принимают список пропом, поэтому здесь они смонтированы напрямую — без поповера и без запроса. Так видно ветки загрузки, пустого результата и падения на неразобранных данных."
    source="src/shared/game/selectors/vehicleSelector/VehiclePopup.vue">

    <p class="debug-note">
      Ни один селектор не смотрит на <span class="debug-value">status</span> из
      <span class="debug-value">queryAsync</span>: в попап уезжает только
      <span class="debug-value">.data</span>, а при ошибке запроса это пустой массив. Поэтому «загрузка» и «запрос
      упал» — визуально одно и то же состояние, и различить их можно только по консоли. Проверить руками: devtools →
      Network → Offline, затем перезагрузить страницу — крутилка останется навсегда. Ветка ошибки в этих компонентах
      просто не написана.
    </p>

    <div class="debug-col">
      <span class="debug-label">VehiclePopup</span>

      <div class="debug-row">
        <button class="debug-btn" v-for="variant in vehicleVariants" :key="variant.value"
          :class="{ active: vehicleSource === variant.value }" @click="vehicleSource = variant.value">
          {{ variant.title }}
        </button>

        <span class="debug-hint">строк: <span class="debug-value">{{ vehicleList.length }}</span></span>
        <span class="debug-hint">выбрано: <span class="debug-value">{{ vehicleSelected.size }}</span></span>
      </div>

      <div class="debug-stage">
        <PopupCard>
          <VehiclePopup :tank-list="vehicleList" v-model="vehicleSelected" />
        </PopupCard>
      </div>

      <p class="debug-note">
        Загрузка определяется как <span class="debug-value">tankList.length === 0</span>, и крутилка при этом лежит
        <b>поверх</b> уже отрисованной таблицы (<span class="debug-value">position: absolute</span>), а не вместо неё.
        Пустой результат — уже другая ветка: «Танков не найдено» + «Очистить фильтр», и она сбрасывает только внутренние
        фильтры.
      </p>

      <p class="debug-note">
        В фикстуре только регион RU. Нажми внутри попапа «WG» — список станет пустым, потому что попап фильтрует по
        <span class="debug-value">region == 'EU'</span>. Помни, что эта кнопка пишет в глобальный
        <span class="debug-value">preferredGame</span>: вернуть на «Lesta» надо руками, иначе остальные секции и весь
        сайт останутся в WG.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">GameVersionPopup</span>

      <div class="debug-row">
        <button class="debug-btn" v-for="variant in versionVariants" :key="variant.value"
          :class="{ active: versionSource === variant.value }" @click="versionSource = variant.value">
          {{ variant.title }}
        </button>

        <span class="debug-hint">строк: <span class="debug-value">{{ versionList.length }}</span></span>
        <span class="debug-hint">выбрано: <span class="debug-value">{{ versionSelected.size }}</span></span>
      </div>

      <div class="debug-stage">
        <RenderGuard :key="versionSource">
          <PopupCard>
            <GameVersionPopup :version-list="versionList" v-model="versionSelected" />
          </PopupCard>
        </RenderGuard>
      </div>

      <p class="debug-note">
        «Битый список» — не выдумка ради красного текста: <span class="debug-value">parseVersion</span> возвращает
        <span class="debug-value">null</span> на строке, не подходящей под регулярку, а группировка читает результат
        через <span class="debug-value">parsedVersion!</span>. Одна строка вида
        <span class="debug-value">1.44.0.1</span> (без <span class="debug-value">v.</span> и без
        <span class="debug-value">#</span>) роняет попап целиком — на боевой странице это утащило бы за собой всё
        дерево, здесь падение перехвачено локально.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">ArenaSelectorContent — тот же список карт, но без модалки</span>

      <div class="debug-row">
        <button class="debug-btn" v-for="variant in arenaVariants" :key="variant.value"
          :class="{ active: arenaSource === variant.value }" @click="arenaSource = variant.value">
          {{ variant.title }}
        </button>

        <label class="debug-control">
          <span class="debug-label">game</span>
          <select v-model="arenaGame">
            <option value="mt">mt</option>
            <option value="wot">wot</option>
          </select>
        </label>

        <label class="debug-control">
          <span class="debug-label">onlyActual</span>
          <input type="checkbox" v-model="onlyActual">
        </label>

        <label class="debug-control">
          <span class="debug-label">season</span>
          <select v-model="season">
            <option :value="null">null</option>
            <option value="summer">summer</option>
            <option value="winter">winter</option>
            <option value="desert">desert</option>
          </select>
        </label>
      </div>

      <div class="debug-row">
        <div class="search-box">
          <SearchLine v-model="arenaSearch" placeholder="Поиск по картам" />
        </div>

        <span class="debug-hint">строк: <span class="debug-value">{{ arenaList.length }}</span></span>
        <span class="debug-hint">выбрано: <span class="debug-value">{{ arenaSelected.size }}</span></span>
      </div>

      <div class="debug-stage">
        <div class="arena-box">
          <ArenaSelectorContent :arenas="arenaList" :game="arenaGame" :search="arenaSearch" :season="season"
            :only-actual="onlyActual" v-model="arenaSelected" @reset="onArenaReset" />
        </div>
      </div>

      <p class="debug-note">
        С <span class="debug-value">onlyActual</span> список режется по последней версии, найденной <b>в самом
          списке</b>: Руинберг в фикстуре помечен версией 1.43.0, поэтому появляется только со снятой галкой и с плашкой
        «До 1.43.0». Карта без локализации показывается тегом. Версия арены приходит строкой вида
        <span class="debug-value">ru_1.44.0</span> и разбирается как
        <span class="debug-value">split('_')[1]</span> — на строке без подчёркивания это упало бы так же, как у версий.
      </p>

      <p class="debug-note">
        Миникарты и их фоны — тема отдельной страницы (<a href="/debug/game/arenas">Карты</a>); здесь важно только то,
        что плитка кликается, выбранная получает синюю рамку, а у карт с двумя командами сверху появляется переключатель
        <b>1 / / 2</b>. Фоны тянутся со статик-сервера, поэтому на «полном списке» их подгрузка видна глазами.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehiclePopup from '@/shared/game/selectors/vehicleSelector/VehiclePopup.vue'
import GameVersionPopup from '@/shared/game/selectors/gameVersionSelector/GameVersionPopup.vue'
import ArenaSelectorContent from '@/shared/game/selectors/arena/arenaSelectorModal/ArenaSelectorContent.vue'
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import type { GameVendor } from '@/shared/game/wot'
import PopupCard from '../shared/PopupCard.vue'
import RenderGuard from '../shared/RenderGuard.vue'
import { arenaListFixture, brokenVersionListFixture, vehicleListFixture, versionListFixture } from '../shared/fixtures'
import { arenaRows, vehicleRows, versionRows } from '../shared/lists'

type Source = 'empty' | 'fixture' | 'full' | 'broken'

const vehicleVariants = [
  { value: 'empty', title: 'пусто (загрузка)' },
  { value: 'fixture', title: 'фикстура' },
  { value: 'full', title: 'полный список' },
] as const satisfies readonly { value: Source, title: string }[]

const versionVariants = [
  { value: 'empty', title: 'пусто (загрузка)' },
  { value: 'fixture', title: 'фикстура' },
  { value: 'full', title: 'полный список' },
  { value: 'broken', title: 'битый список' },
] as const satisfies readonly { value: Source, title: string }[]

const arenaVariants = [
  { value: 'empty', title: 'пусто (загрузка)' },
  { value: 'fixture', title: 'фикстура' },
  { value: 'full', title: 'полный список' },
] as const satisfies readonly { value: Source, title: string }[]

const vehicleSource = ref<Source>('fixture')
const versionSource = ref<Source>('fixture')
const arenaSource = ref<Source>('fixture')

const vehicleSelected = ref(new Set<string>())
const versionSelected = ref(new Set<string>())
const arenaSelected = ref(new Set<string>())

const arenaGame = ref<GameVendor>('mt')
const arenaSearch = ref('')
const season = ref<'winter' | 'summer' | 'desert' | null>(null)
const onlyActual = ref(true)

const vehicleList = computed(() => {
  if (vehicleSource.value === 'fixture') return vehicleListFixture
  if (vehicleSource.value === 'full') return vehicleRows.value
  return []
})

const versionList = computed(() => {
  if (versionSource.value === 'fixture') return versionListFixture
  if (versionSource.value === 'full') return versionRows.value
  if (versionSource.value === 'broken') return brokenVersionListFixture
  return []
})

const arenaList = computed(() => {
  if (arenaSource.value === 'fixture') return arenaListFixture
  if (arenaSource.value === 'full') return arenaRows.value
  return []
})

function onArenaReset() {
  arenaSearch.value = ''
  season.value = null
  onlyActual.value = true
}

</script>


<style scoped lang="scss">
.search-box {
  width: 220px;
}

.arena-box {
  max-width: 640px;
  max-height: 460px;
  overflow: auto;
  padding-right: 0.5em;
}
</style>
