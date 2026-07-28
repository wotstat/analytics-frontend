<template>
  <DebugSection title="Границы и некорректные значения" id="rank-boundaries"
    description="Калькулятор по рейтингу: getDivisionByRating/getRankByRating/getNextDivision/getPrevDivision живьём. Ниже — что рисуется для значений, которые функции не ждут."
    source="src/shared/game/comp7/utils.ts">

    <div class="debug-row">
      <GameSelect v-model="game" />

      <label class="debug-control">
        <span class="debug-label">rating</span>
        <input type="number" v-model.number="rating" step="50">
      </label>

      <label class="debug-control">
        <span class="debug-label">eliteRating задан</span>
        <input type="checkbox" v-model="hasEliteRating">
      </label>

      <label class="debug-control" v-if="hasEliteRating">
        <span class="debug-label">eliteRating</span>
        <input type="number" v-model.number="eliteRating" step="50">
      </label>
    </div>

    <div class="debug-row">
      <button class="debug-btn" v-for="preset in presets" :key="preset.title" @click="applyPreset(preset)">{{
        preset.title }}</button>
    </div>

    <div class="debug-row">
      <div class="debug-stage center">
        <RankIcon :rank="{ value: rating, eliteRating: eliteRatingValue ?? 0 }" size="large" :game class="icon" />
      </div>

      <table class="debug-table calc">
        <tbody>
          <tr>
            <th>getDivisionByRating</th>
            <td>{{ division }}</td>
          </tr>
          <tr>
            <th>getRankByRating</th>
            <td>{{ rank }}</td>
          </tr>
          <tr>
            <th>getDivisionLetterByRating</th>
            <td>{{ letter }}</td>
          </tr>
          <tr>
            <th>getRatingIntervalForDivision</th>
            <td>{{ interval[0] }} … {{ interval[1] === Infinity ? '∞' : interval[1] }}</td>
          </tr>
          <tr>
            <th>getPrevDivision / getNextDivision</th>
            <td>{{ prevDivision ?? '—' }} → <b>{{ division }}</b> → {{ nextDivision ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="debug-hint">
      Пресет «eliteRating = 0» показывает, что ноль трактуется как «не задан»: в коде проверка
      <span class="debug-value">eliteRating !== null && eliteRating !== 0</span>.
    </p>

    <div class="debug-col">
      <span class="debug-label">голый Rank без буквы дивизиона (first/second/third/fourth)</span>
      <div class="debug-grid" style="--debug-grid-min: 90px">
        <div class="card" v-for="r in RANKS" :key="r">
          <div class="debug-stage center">
            <RankIcon :rank="r" size="medium" :game class="icon" />
          </div>
          <span class="debug-value">{{ r }}</span>
        </div>
      </div>
      <p class="debug-note">
        RankImageDefinition допускает тип Rank целиком, а getRankImageName особо обрабатывает только qual/fifth/sixth,
        поэтому first/second/third/fourth без буквы уходят в <span class="debug-value">division = rank as Division</span>
        и дают адрес вида «first.webp». Такие файлы на CDN **существуют** — это иконка ранга без дивизиона, картинки
        выше грузятся. То есть перед тобой, скорее всего, осознанный кейс «ранг целиком», а не поломка; при
        <span class="debug-value">size="small"</span> буква дивизиона и так срезается через
        <span class="debug-value">split('_')[0]</span>, так что там разницы нет вообще.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">несуществующий Division</span>
      <div class="debug-grid" style="--debug-grid-min: 90px">
        <div class="card" v-for="d in invalidDivisions" :key="d">
          <div class="debug-stage center">
            <RankIcon :rank="d" size="medium" :game class="icon" />
          </div>
          <span class="debug-value">{{ d }}</span>
        </div>
      </div>
      <p class="debug-hint">Никакой валидации внутри — какая строка передана, такое имя файла и запрашивается.</p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import {
  Rank, Division,
  getDivisionByRating, getRankByRating, getDivisionLetterByRating,
  getNextDivision, getPrevDivision, getRatingIntervalForDivision
} from '@/shared/game/comp7/utils'
import { GameVendor } from '@/shared/game/wot'
import GameSelect from '../shared/GameSelect.vue'

const game = ref<GameVendor>('mt')
const rating = ref(0)
const hasEliteRating = ref(false)
const eliteRating = ref(2000)

const eliteRatingValue = computed(() => hasEliteRating.value ? eliteRating.value : null)

const division = computed(() => getDivisionByRating(rating.value, game.value, eliteRatingValue.value))
const rank = computed(() => getRankByRating(rating.value, game.value, eliteRatingValue.value))
const letter = computed(() => getDivisionLetterByRating(rating.value, game.value))
const nextDivision = computed(() => getNextDivision(division.value))
const prevDivision = computed(() => getPrevDivision(division.value))
const interval = computed(() => getRatingIntervalForDivision(division.value, game.value))

const presets: { title: string, rating: number, hasEliteRating: boolean, eliteRating?: number }[] = [
  { title: '0 — квалификация', rating: 0, hasEliteRating: false },
  { title: '-500 — отрицательный', rating: -500, hasEliteRating: false },
  { title: '2650 — верх без eliteRating', rating: 2650, hasEliteRating: false },
  { title: '999999 — далеко за пределами', rating: 999999, hasEliteRating: false },
  { title: '2500 при eliteRating=2000 — шестой', rating: 2500, hasEliteRating: true, eliteRating: 2000 },
  { title: 'eliteRating=0 — «не задан»', rating: 2650, hasEliteRating: true, eliteRating: 0 },
]

function applyPreset(preset: typeof presets[number]) {
  rating.value = preset.rating
  hasEliteRating.value = preset.hasEliteRating
  if (preset.eliteRating !== undefined) eliteRating.value = preset.eliteRating
}

const RANKS: Rank[] = ['qual', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']
const invalidDivisions = ['first_Z', 'nonexistent_rank', ''] as unknown as Division[]
</script>


<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.5em;
  background: var(--debug-surface);
}

.icon {
  height: 56px;
}

.calc {
  width: auto;

  th,
  td {
    text-align: left;
    white-space: nowrap;
  }
}
</style>
