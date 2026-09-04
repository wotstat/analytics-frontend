<template>
  <DebugSection title="Границы и некорректные значения" id="rank-boundaries"
    description="Калькулятор по рейтингу: getDivisionByRating/getRankByRating/getNextDivision/getPrevDivision живьём. Ниже — что рисуется для значений, которые функции не ждут."
    source="src/shared/game/comp7/utils.ts">

    <div class="debug-row">
      <GameSelect v-model="game" />
      <SeasonSelect v-model="season" />

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

      <template v-if="hasEliteRating && hasEliteDivisions(game, season)">
        <label class="debug-control">
          <span class="debug-label">пороги дивизионов Легенды</span>
          <input type="checkbox" v-model="hasEliteDivisionRatings">
        </label>
        <template v-if="hasEliteDivisionRatings">
          <label class="debug-control">
            <span class="debug-label">eliteRating B</span>
            <input type="number" v-model.number="eliteRatingB" step="50">
          </label>
          <label class="debug-control">
            <span class="debug-label">eliteRating A</span>
            <input type="number" v-model.number="eliteRatingA" step="50">
          </label>
        </template>
      </template>
    </div>

    <div class="debug-row">
      <button class="debug-btn" v-for="preset in presets" :key="preset.title" @click="applyPreset(preset)">{{
        preset.title }}</button>
    </div>

    <div class="debug-row">
      <div class="debug-stage center">
        <RankIcon :rank="{ value: rating, eliteRating: eliteRatingValue ?? 0 }" size="large" :game :season class="icon" />
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
      Нулевой или отрицательный eliteRating означает «порог неизвестен». Один порог определяет только ранг Легенды;
      для буквы дивизиона нового сезона нужны пороги C (eliteRating), B и A.
    </p>

    <div class="debug-col">
      <span class="debug-label">голый Rank без буквы дивизиона (first/second/third/fourth)</span>
      <div class="debug-grid" style="--debug-grid-min: 90px">
        <div class="card" v-for="r in RANKS" :key="r">
          <div class="debug-stage center">
            <RankIcon :rank="r" size="medium" :game :season class="icon" />
          </div>
          <span class="debug-value">{{ r }}</span>
        </div>
      </div>
      <p class="debug-note">
        Rank без буквы всегда показывает ранг целиком. В МТ для fifth/sixth используются файлы с суффиксом
        _logo, в WoT — без него. В размере small буква дивизиона не отображается.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">несуществующий Division</span>
      <div class="debug-grid" style="--debug-grid-min: 90px">
        <div class="card" v-for="d in invalidDivisions" :key="d">
          <div class="debug-stage center">
            <RankIcon :rank="d" size="medium" :game :season class="icon" />
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
  getNextDivision, getPrevDivision, getRatingIntervalForDivision, hasEliteDivisions
} from '@/shared/game/comp7/utils'
import { GameVendor } from '@/shared/game/wot'
import GameSelect from '../shared/GameSelect.vue'
import SeasonSelect from '../shared/SeasonSelect.vue'

const game = ref<GameVendor>('mt')
const season = ref('latest')
const rating = ref(0)
const hasEliteRating = ref(false)
const eliteRating = ref(2000)
const hasEliteDivisionRatings = ref(false)
const eliteRatingB = ref(4200)
const eliteRatingA = ref(4600)

const eliteRatingValue = computed(() => {
  if (!hasEliteRating.value) return null
  if (hasEliteDivisionRatings.value && hasEliteDivisions(game.value, season.value)) {
    return { C: eliteRating.value, B: eliteRatingB.value, A: eliteRatingA.value }
  }
  return eliteRating.value
})

const division = computed(() => getDivisionByRating(rating.value, game.value, eliteRatingValue.value, season.value))
const rank = computed(() => getRankByRating(rating.value, game.value, eliteRatingValue.value, season.value))
const letter = computed(() => getDivisionLetterByRating(rating.value, game.value, season.value, eliteRatingValue.value))
const nextDivision = computed(() => getNextDivision(division.value, game.value, season.value))
const prevDivision = computed(() => getPrevDivision(division.value, game.value, season.value))
const interval = computed(() => getRatingIntervalForDivision(division.value, game.value, season.value, eliteRatingValue.value))

const presets: { title: string, rating: number, hasEliteRating: boolean, eliteRating?: number }[] = [
  { title: '0 — квалификация', rating: 0, hasEliteRating: false },
  { title: '-500 — отрицательный', rating: -500, hasEliteRating: false },
  { title: '2650 — верх без eliteRating', rating: 2650, hasEliteRating: false },
  { title: '3050 — Чемпион B в новом МТ', rating: 3050, hasEliteRating: false },
  { title: '3450 — Чемпион A в новом МТ', rating: 3450, hasEliteRating: false },
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
