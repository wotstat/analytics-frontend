<template>
  <DebugSection title="Все четыре в одном ряду" id="filters-row"
    description="Согласованность: одинаковая ли высота, как выравниваются между собой и не перекрывают ли друг друга поповерами. Разметка «как в бою» повторяет фильтр поиска реплеев."
    source="src/pages/replays/search/Index.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">раскладка</span>
        <select v-model="layout">
          <option value="battle">как в бою (два столбца)</option>
          <option value="row">все четыре в один ряд</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">align-items</span>
        <select v-model="align">
          <option value="baseline">baseline</option>
          <option value="center">center</option>
          <option value="flex-start">flex-start</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="300" max="1200" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <button class="debug-btn" @click="fillSome">заполнить выбором</button>
      <button class="debug-btn" @click="clearAll">очистить</button>
    </div>

    <div class="debug-stage">
      <div class="filter" :class="layout" :style="{ width: `${width}px`, alignItems: align }">
        <div class="group">
          <div class="cell">
            <p>Карта:</p>
            <div class="control" ref="arenaCell">
              <ArenaSelectorBadges v-model="arenas" />
            </div>
          </div>

          <div class="cell">
            <p>Танк:</p>
            <div class="control" ref="vehicleCell">
              <VehicleSelectorBadges v-model="vehicles" />
            </div>
          </div>
        </div>

        <div class="separator"></div>

        <div class="group">
          <div class="cell">
            <p>Игра:</p>
            <div class="control" ref="gameCell">
              <GameSelector v-model="game" />
            </div>
          </div>

          <div class="cell">
            <p>Версия:</p>
            <div class="control" ref="versionCell">
              <GameVersionSelectorBadges v-model="versions" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>селектор</th>
          <th>height</th>
          <th>top</th>
          <th>width</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in measures" :key="row.title">
          <th>{{ row.title }}</th>
          <td>{{ Math.round(row.height) }}</td>
          <td>{{ Math.round(row.top) }}</td>
          <td>{{ Math.round(row.width) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Ровно та же табличка отвечает на вопрос «одинаковой ли они высоты»: нет. Пустая строка бейджей — 20px (высота
      кнопки «выбрать»), <span class="debug-value">GameSelector</span> — 40px, и с каждым переносом бейджей строка
      подрастает ещё на ~22px. Поэтому в бою ячейки выровнены по
      <span class="debug-value">baseline</span>, а не по центру: переключи align-items и сравни — при
      <span class="debug-value">center</span> подписи «Карта:»/«Танк:» разъезжаются по вертикали, при
      <span class="debug-value">baseline</span> первая строка бейджей стоит на одной линии с подписью.
    </p>

    <p class="debug-note">
      Заполни выбором и сузь контейнер: ячейки растут в высоту независимо, поэтому ряд из четырёх селекторов не
      сохраняет ни высоту, ни выравнивание — соседние ячейки просто расползаются. Никакой общей сетки у фильтра нет,
      это четыре независимых flex-строки.
    </p>

    <p class="debug-note">
      Поповеры друг друга не перекрывают, потому что не могут быть открыты одновременно: клик по соседнему селектору
      сначала приходит как <span class="debug-value">pointerDownOutside</span> в открытый попап и закрывает его. Проверь
      это по порядку: открой попап техники → щёлкни по «+» версий → должен остаться открытым ровно один попап. Модалка
      карт, наоборот, живёт по своим правилам и накрывает всё содержимое страницы.
    </p>

    <p class="debug-note">
      Тач: ряд проверяется отдельно пальцем. Тап по «+» соседнего селектора должен закрыть предыдущий попап и открыть
      новый одним движением, а не потребовать двух тапов. И попап техники в модалку карт превращаться не должен — на
      узком экране это два разных механизма (поповер против модалки), они и выглядят по-разному.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useElementBounding } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehicleSelectorBadges from '@/shared/game/selectors/vehicleSelector/VehicleSelectorBadges.vue'
import ArenaSelectorBadges from '@/shared/game/selectors/arena/ArenaSelectorBadges.vue'
import GameVersionSelectorBadges from '@/shared/game/selectors/gameVersionSelector/GameVersionSelectorBadges.vue'
import GameSelector from '@/shared/game/selectors/gameSelector/GameSelector.vue'
import type { GameVendor } from '@/shared/game/wot'
import { arenaHashes, take, vehicleTags, versionTags } from '../shared/lists'

const layout = ref<'battle' | 'row'>('battle')
const align = ref('baseline')
const width = ref(900)

const vehicles = ref(new Set<string>())
const arenas = ref(new Set<string>())
const versions = ref(new Set<string>())
const game = ref<GameVendor | 'any'>('mt')

const arenaCell = useTemplateRef<HTMLElement>('arenaCell')
const vehicleCell = useTemplateRef<HTMLElement>('vehicleCell')
const gameCell = useTemplateRef<HTMLElement>('gameCell')
const versionCell = useTemplateRef<HTMLElement>('versionCell')

const arenaBounds = useElementBounding(arenaCell)
const vehicleBounds = useElementBounding(vehicleCell)
const gameBounds = useElementBounding(gameCell)
const versionBounds = useElementBounding(versionCell)

const measures = computed(() => [
  { title: 'карты', ...bounds(arenaBounds) },
  { title: 'техника', ...bounds(vehicleBounds) },
  { title: 'игра', ...bounds(gameBounds) },
  { title: 'версия', ...bounds(versionBounds) },
])

function bounds(value: ReturnType<typeof useElementBounding>) {
  return { height: value.height.value, top: value.top.value, width: value.width.value }
}

function fillSome() {
  for (const tag of take(vehicleTags.value, 6)) vehicles.value.add(tag)
  for (const tag of take(arenaHashes.value, 4)) arenas.value.add(tag)
  for (const tag of take(versionTags.value.versions, 3)) versions.value.add(tag)
}

function clearAll() {
  vehicles.value.clear()
  arenas.value.clear()
  versions.value.clear()
}

</script>


<style scoped lang="scss">
.filter {
  display: flex;
  max-width: 100%;
  overflow: auto;

  .group {
    flex: 1;
  }

  .separator {
    width: 1px;
    background-color: rgb(255, 255, 255, 0.1);
    margin: 0 1em;
    align-self: stretch;
  }

  &.row {
    flex-wrap: wrap;
    gap: 0 1em;

    .group {
      display: flex;
      flex-wrap: wrap;
      gap: 0 1em;
      align-items: inherit;
    }
  }

  .cell {
    display: flex;
    align-items: baseline;
    gap: 0.3em;
    font-size: 18px;
  }
}
</style>
