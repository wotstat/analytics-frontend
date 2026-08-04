<template>
  <DebugSection title="Крайние случаи" id="edge-cases"
    description="Ничего не выбрано, выбрано всё, выбран несуществующий тег, узкий контейнер и поповер у края экрана. Ломать поведение здесь — норма: именно эти состояния в бою и всплывают."
    source="src/shared/game/selectors/">

    <div class="debug-row">
      <button class="debug-btn" @click="selectAll">выбрать всё во всех трёх</button>
      <button class="debug-btn" @click="selectBroken">подставить мусорные теги</button>
      <button class="debug-btn" @click="clearAll">очистить всё</button>

      <span class="debug-hint">
        техника <span class="debug-value">{{ vehicles.size }}</span>,
        карты <span class="debug-value">{{ arenas.size }}</span>,
        версии <span class="debug-value">{{ versions.size }}</span>
      </span>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина контейнера</span>
        <input type="range" min="140" max="800" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>
    </div>

    <div class="debug-stage">
      <div class="narrow" :style="{ width: `${width}px` }">
        <div class="cell">
          <p>Карта:</p>
          <ArenaSelectorBadges v-model="arenas" />
        </div>
        <div class="cell">
          <p>Танк:</p>
          <VehicleSelectorBadges v-model="vehicles" />
        </div>
        <div class="cell">
          <p>Версия:</p>
          <GameVersionSelectorBadges v-model="versions" />
        </div>
        <div class="cell">
          <p>Игра:</p>
          <GameSelector v-model="game" />
        </div>
      </div>
    </div>

    <p class="debug-note">
      Что должно произойти: мусорные теги остаются бейджами и снимаются крестиком, но ни один селектор от них не падает
      — кроме подписи карт, которая превращается в <span class="debug-value">/NaN</span> (см.
      <a href="#arena">карты</a>). «Выбрать всё» — это {{ vehicleTags.length }} бейджей техники и
      {{ arenaHashes.length }} карт: страница на секунду подвиснет на монтировании, строка вырастет на десятки рядов и
      выпихнет вниз всё остальное. Это и есть результат проверки — ни свёртки, ни «+N», ни виртуализации у бейджей нет,
      поповер при этом обязан по-прежнему цепляться за строку, а не за кнопку.
    </p>

    <p class="debug-note">
      Узкий контейнер: бейджи и строка поиска сжимаются нормально, а <span class="debug-value">GameSelector</span> — нет
      (фиксированные 340px). Ниже ~360px контейнер получает горизонтальную прокрутку вместо сжатия — на боевой странице
      так же поехала бы вся страница. Модалка карт свою вёрстку под узкий экран
      переключает сама на 720px и 500px — это медиазапросы внутри
      <span class="debug-value">ArenaSelectorPopup</span>, от ширины контейнера они не зависят, только от ширины окна.
    </p>

    <div class="debug-col">
      <span class="debug-label">Поповер у краёв окна</span>

      <div class="debug-stage edges">
        <div class="corner">
          <GameVersionSelectorBadges v-model="cornerVersions" />
        </div>
        <span class="debug-hint">верх</span>
        <div class="corner">
          <GameVersionSelectorBadges v-model="cornerVersions" />
        </div>

        <span class="debug-hint">лево</span>
        <span class="debug-hint">поповер обязан перевернуться, а не уехать за край</span>
        <span class="debug-hint">право</span>

        <div class="corner">
          <VehicleSelectorBadges v-model="cornerVehicles" />
        </div>
        <span class="debug-hint">низ</span>
        <div class="corner">
          <VehicleSelectorBadges v-model="cornerVehicles" />
        </div>
      </div>

      <p class="debug-note">
        Placement у всех трёх поповерных селекторов — <span class="debug-value">['bottom-start', 'bottom-float']</span>,
        варианта наверх нет ни одного. По горизонтали всё честно: у правых целей
        <span class="debug-value">-float</span> прижимает попап к границе
        <span class="debug-value">popoverViewportOffset</span>. А по вертикали <span class="debug-value">-float</span>
        для вертикального placement не работает вовсе (в
        <span class="debug-value">calculatePosition</span> подравнивается только X), поэтому у нижних целей попап не
        переворачивается и не поднимается — он просто уходит за нижнюю границу окна и обрезается, а прокрутить к нему
        нельзя: позиция пересчитывается каждый кадр и едет за целью. Прокрути страницу так, чтобы нижний ряд оказался у
        нижнего края окна, и открой попап техники — он высокий (~430px), эффект виден сразу; у версий пониже.
      </p>

      <p class="debug-note">
        Событие <span class="debug-value">popoverOutsideWindow</span> в этот момент честно эмитится (позиция не влезла в
        границы), но с дефолтным <span class="debug-value">closeOnOutsideWindow: 'target'</span> оно игнорируется, и
        обрезанный попап остаётся открытым. Как выглядят остальные режимы — в секции
        <a href="#vehicle">техники</a>.
      </p>

      <p class="debug-note">
        Прокрути страницу с открытым попапом. Пока цель хоть частично в окне, попап едет за ней; как только строка
        бейджей полностью уходит из окна, срабатывает <span class="debug-value">closeOnOutsideWindow: 'target'</span> и
        попап закрывается. Другие режимы можно попробовать в секции <a href="#vehicle">техники</a>.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Селектор в прокручиваемом контейнере</span>

      <div class="debug-stage scroll">
        <div class="scroll-content">
          <p class="debug-hint" v-for="index in 6" :key="index">строка-заполнитель {{ index }}</p>

          <div class="cell">
            <p>Версия:</p>
            <GameVersionSelectorBadges v-model="scrollVersions" />
          </div>

          <p class="debug-hint" v-for="index in 12" :key="`tail-${index}`">строка-заполнитель {{ index + 6 }}</p>
        </div>
      </div>

      <p class="debug-note">
        Про прокручиваемого предка поповер не знает ничего: границы он считает только по окну. Открой попап и
        прокрути <b>внутренний</b> контейнер — попап продолжит висеть у цели, выехав за пределы контейнера, и не
        закроется, потому что цель из окна не ушла. Это ожидаемое поведение, но в бою так делать нельзя: селектор внутри
        своего скролла выглядит сломанным.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehicleSelectorBadges from '@/shared/game/selectors/vehicleSelector/VehicleSelectorBadges.vue'
import ArenaSelectorBadges from '@/shared/game/selectors/arena/ArenaSelectorBadges.vue'
import GameVersionSelectorBadges from '@/shared/game/selectors/gameVersionSelector/GameVersionSelectorBadges.vue'
import GameSelector from '@/shared/game/selectors/gameSelector/GameSelector.vue'
import type { GameVendor } from '@/shared/game/wot'
import type { OptionalRegionVersion } from '@/shared/game/selectors/gameVersionSelector/utils.ts'
import { brokenArenaHashes, brokenVehicleTags, brokenVersionTags } from '../shared/fixtures'
import { arenaHashes, vehicleTags, versionTags } from '../shared/lists'

const vehicles = ref(new Set<string>())
const arenas = ref(new Set<string>())
const versions = ref(new Set<OptionalRegionVersion>())
const game = ref<GameVendor | 'any'>('mt')

const cornerVehicles = ref(new Set<string>())
const cornerVersions = ref(new Set<OptionalRegionVersion>())
const scrollVersions = ref(new Set<OptionalRegionVersion>())

const width = ref(520)

function fill(target: Set<string>, tags: readonly string[]) {
  for (const tag of tags) target.add(tag)
}

function selectAll() {
  fill(vehicles.value, vehicleTags.value)
  fill(arenas.value, arenaHashes.value)
  fillVersions(versions.value, versionTags.value.versions)
}

function selectBroken() {
  fill(vehicles.value, brokenVehicleTags)
  fill(arenas.value, brokenArenaHashes)
  fillVersions(versions.value, brokenVersionTags)
}

function fillVersions(target: Set<OptionalRegionVersion>, tags: readonly string[]) {
  for (const version of tags) target.add({ version })
}

function clearAll() {
  vehicles.value.clear()
  arenas.value.clear()
  versions.value.clear()
}

</script>


<style scoped lang="scss">
.narrow {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  border: 1px solid var(--debug-border-strong);
  border-radius: 4px;
  padding: 0.5em;
  max-width: 100%;
  overflow: auto;
}

.cell {
  display: flex;
  align-items: baseline;
  gap: 0.3em;
  font-size: 18px;
}

.corner {
  font-size: 18px;
}

.scroll-content {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
