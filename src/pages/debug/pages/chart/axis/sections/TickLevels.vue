<template>
  <DebugSection title="Уровни тиков: недели → дни → часы" id="tick-levels"
    description="Один composite TicksByLabels на всю временную иерархию. Уровни задаёт ticks победившего кандидата: 'labels' — значения его же подписей, остальные — свои генераторы. Тяни «видимый диапазон» и смотри, как дни переезжают с нижнего уровня на уровень подписей, а на их место приходят часы."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels.ts → buildTickLevels">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">видимый диапазон</span>
        <input type="range" min="6" max="2016" step="6" v-model.number="spanHours">
        <span class="debug-value">{{ spanLabel }}</span>
      </label>

      <button class="debug-btn" @click="spanHours = 2016">весь сезон</button>
      <button class="debug-btn" @click="spanHours = 672">четыре недели</button>
      <button class="debug-btn" @click="spanHours = 168">неделя</button>
      <button class="debug-btn" @click="spanHours = 48">двое суток</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">minPixelSpacing дней</span>
        <input type="range" min="0" max="40" step="1" v-model.number="daySpacing">
        <span class="debug-value">{{ daySpacing }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">minPixelSpacing часов</span>
        <input type="range" min="0" max="40" step="1" v-model.number="hourSpacing">
        <span class="debug-value">{{ hourSpacing }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">стратегия</span>
        <select v-model="strategy">
          <option value="interval">interval</option>
          <option value="classic-flow">classic-flow</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">дни через arrayGenerator</span>
        <input type="checkbox" v-model="irregular">
      </label>

      <label class="debug-control">
        <span class="debug-label">пустые данные</span>
        <input type="checkbox" v-model="empty">
      </label>

      <span class="debug-hint">
        1 день = <span class="debug-value">{{ pixelsPerDay }}px</span> ·
        1 час = <span class="debug-value">{{ pixelsPerHour }}px</span>
      </span>
    </div>

    <p class="debug-hint">
      кандидат <span class="debug-value">{{ state?.step ?? -1 }}</span> ·
      стратегия <span class="debug-value">{{ strategy }}</span> ·
      уровней <span class="debug-value">{{ levels.length }}</span>
    </p>

    <ChartStage :chart="chart" :height="220"  />

    <table class="debug-table">
      <thead>
        <tr>
          <th>уровень</th>
          <th>роль</th>
          <th>классы группы</th>
          <th>значений в расчёте</th>
          <th>линий в DOM</th>
          <th>шаг на экране</th>
          <th>состояние</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="level in levels" :key="level.index">
          <th>{{ level.index }}</th>
          <td>{{ level.classes.includes('label-ticks') ? 'по подписям' : 'свой генератор' }}</td>
          <td class="mono">.{{ level.classes.join('.') }}</td>
          <td>{{ level.values.length }}</td>
          <td>{{ level.lines }}</td>
          <td>{{ level.spacing }}</td>
          <td>{{ level.values.length > 0 ? 'visible' : 'hidden' }}</td>
        </tr>
        <tr v-if="levels.length === 0">
          <td colspan="7">уровней нет — пустые bounds или ни один кандидат не подошёл</td>
        </tr>
      </tbody>
    </table>

    <ProbeReadout :state="state" ticks :format="formatValue" />

    <p class="debug-note">
      <b>Кто решает, сколько уровней.</b> Победивший кандидат — своим списком
      <span class="debug-value">ticks</span>. У недельных шагов это
      <span class="debug-value">['labels', дни, часы]</span> — три уровня; у дневных
      <span class="debug-value">['labels', часы]</span> — два. Поэтому переход «неделя + дни → день» сам по себе
      убирает дневной уровень: дни становятся уровнем подписей, а дважды одну линию не рисуют.
      <span class="debug-value">ticks === undefined</span> — берётся общий
      <span class="debug-value">options.ticks</span>, а если и его нет — <span class="debug-value">['labels']</span>,
      то есть тики ровно по подписям, как было до появления уровней. Одиночный источник можно писать без массива
      (<span class="debug-value">ticks: 'labels'</span>), а <span class="debug-value">[]</span> — это «тиков нет
      совсем». Слияния по индексам нет: список кандидата заменяет общий целиком.
    </p>

    <p class="debug-note">
      <b>minPixelSpacing</b> — порог плотности в пикселях лейаута, и он уровневый: не прореживает набор, а прячет его
      целиком. Выкрути порог часов в 0 на «весь сезон» — уровень включится и попытается нарисовать все часы сезона,
      упёршись в предел {{ MAX_PER_LEVEL }} значений на кадр. Верни 6 — часы появятся только там, где им хватает
      места. Порог считается по <b>сгенерированному</b> набору, до вычитания старших уровней: иначе удаление каждой
      седьмой линии на границе недели делало бы уровень «разреженнее», чем он есть. Уровню подписей порог тоже можно
      задать — настройки у всех уровней одни и те же, — но смысла в этом мало: его плотность уже проверил перебор
      кандидатов.
    </p>

    <p class="debug-note">
      <b>Дедупликация идёт по порядку списка:</b> кто выше, тот забирает общее значение. Отсюда и отсутствие двойной
      линии в полночь начала недели — неделя стоит первой, день ниже, значение общее, рисует его верхний. В таблице
      это видно по числу значений: у дней при недельном победителе их на единицу-две меньше, чем календарных суток на
      экране. Порядок настраиваемый: поставь дни выше <span class="debug-value">'labels'</span> — и границу недели
      нарисует дневной уровень.
    </p>

    <p class="debug-note">
      <b>Нерегулярный источник.</b> Включи «дни через arrayGenerator»: значения заданы списком
      <span class="debug-value">{{ irregularLabel }}</span> (в днях), и там есть пара, стоящая вплотную. Плотный
      участок гасит <b>весь</b> уровень — автоматического прореживания семантического набора нет и не будет:
      выбрасывать часть календарных дат движок не вправе, это решение страницы.
    </p>

    <p class="debug-note">
      <b>Классы.</b> На группе уровня одновременно живут порядковые служебные
      (<span class="debug-value">.tick-level.tick-level-1</span>), семантические из
      <span class="debug-value">TickSource.classes</span> и настроечные из
      <span class="debug-value">TicksByLabelsOptions.levels[i].classes</span>. Уровень, стоящий по подписям,
      дополнительно получает <span class="debug-value">.label-ticks</span> — это факт «под этими тиками стоит текст»,
      а не порядковый номер. Смотри колонку «классы группы» на переходе:
      <span class="debug-value">.day-ticks</span> едет с уровня 1 на уровень 0, а устаревший класс с
      переиспользованной группы снимается — на уровне 1 после перехода останутся только часы.
    </p>

    <p class="debug-note">
      <b>Повторяющийся текст требует своего ключа.</b> Здесь подписи часов — «0:00 … 18:00» — повторяются каждые
      сутки, а <span class="debug-value">keyForValue</span> по умолчанию равен тексту подписи. Ключ — это
      тождество <span class="debug-value">&lt;text&gt;</span> между кадрами
      (<span class="debug-value">elementByKey</span> в BaseLabels), поэтому одинаковый текст схлопывает разные
      значения в один элемент: тики на месте, а подписи вторых суток просто нет — и ни одной жалобы в консоли. У этой
      секции поэтому задан <span class="debug-value">keyForValue: value => `${value}`</span>. В боевых графиках
      подписи уникальны («3 день», «2 неделя»), там ключ по умолчанию работает.
    </p>

    <p class="debug-note">
      <b>Пустые данные</b> публикуют пустой список уровней: старые линии исчезают все и сразу, ничего не «залипает» от прошлого
      кадра. Пробный <span class="debug-value">getSize()</span> их не трогает вовсе — иначе в него попадали бы
      промежуточные примерки лейаута.
    </p>

    <p class="debug-note">
      Ни одного пересоздания чарта на этой странице не происходит: все тумблеры идут через
      <span class="debug-value">AutoLabels.updateOptions()</span>, а число уровней меняется внутри того же
      <span class="debug-value">TicksByLabels</span> — группы переиспользуются, лишние удаляются.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Options as LabelsOptions, TickSource } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { arrayGenerator } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/arrayGenerator'
import { steppedGenerator, steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { StepProbe, useProbe } from '../shared/probe'
import { defaultYLabels } from '../shared/options'

const HOUR = 60 * 60
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const SEASON = 84 * DAY
const MAX_PER_LEVEL = 500

// Локально плотная пара (7 и 7.25) — та самая, что гасит весь нерегулярный уровень.
const IRREGULAR_DAYS = [0, 1, 2, 4, 7, 7.25, 11, 16, 22, 27, 35, 48, 60, 75]

const spanHours = ref(2016)
const daySpacing = ref(5)
const hourSpacing = ref(6)
const strategy = ref<'interval' | 'classic-flow'>('interval')
const irregular = ref(false)
const empty = ref(false)

const probe = new StepProbe()
const { state, onRender } = useProbe()

// Данные раз в шесть часов, чтобы линия оставалась осмысленной и на суточном зуме.
const points = syntheticSeries('smooth', 5, 4 * 84 + 1).map(point => point && { x: point.x * 6 * HOUR, y: point.y })

const irregularLabel = IRREGULAR_DAYS.join(', ')

const spanLabel = computed(() => spanHours.value >= 48
  ? `${Math.round(spanHours.value / 24)} дн.`
  : `${spanHours.value} ч.`)

const pixelsPerDay = computed(() => scaleRound(DAY))
const pixelsPerHour = computed(() => scaleRound(HOUR))

const levels = computed(() => (state.value?.xLevels ?? []).map(level => ({
  ...level,
  spacing: describeSpacing(level.values),
})))

const xLabels = computed<LabelsOptions>(() => {
  const hourTicks: TickSource = {
    gen: steppedGenerator({ step: HOUR }),
    minPixelSpacing: hourSpacing.value,
    classes: 'hour-ticks',
  }

  const dayTicks: TickSource = {
    gen: irregular.value ? arrayGenerator(IRREGULAR_DAYS.map(day => day * DAY)) : steppedGenerator({ step: DAY }),
    minPixelSpacing: daySpacing.value,
    classes: 'day-ticks',
  }

  const hourLabels: TickSource = { gen: 'labels', classes: 'hour-ticks' }
  const dayLabels: TickSource = { gen: 'labels', classes: 'day-ticks' }
  const weekLabels: TickSource = { gen: 'labels', classes: 'week-ticks' }

  return {
    padding: 10,
    labelOffset: 5,
    // Часы повторяются каждый день, а ключ по умолчанию — текст подписи: без своего
    // keyForValue вторые сутки остались бы с тиками, но без подписей.
    keyForValue: value => `${value}`,
    values: steppedOverrides({
      step: [
        { step: 6 * HOUR, labelForValue: probe.wrap(value => `${(value % DAY) / HOUR}:00`), ticks: [hourLabels, hourTicks] },
        { step: DAY, labelForValue: probe.wrap(value => `${1 + value / DAY} день`), ticks: [dayLabels, hourTicks] },
        { step: DAY, labelForValue: probe.wrap(value => `${1 + value / DAY}`), ticks: [dayLabels, hourTicks] },
        { step: WEEK, labelForValue: probe.wrap(value => `${1 + value / WEEK} неделя`), ticks: [weekLabels, dayTicks, hourTicks] },
        { step: WEEK, labelForValue: probe.wrap(value => `${1 + value / WEEK} н.`), ticks: [weekLabels, dayTicks, hourTicks] },
      ],
    }),
    strategy: strategy.value === 'interval' ? { type: 'interval', fit: true, offset: 3 } : 'classic-flow',
    from: 0,
    to: SEASON,
  }
})

const chart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: xLabels.value,
  y: defaultYLabels(),
  stepProbe: probe,
  ticks: {
    x: 'labels',
    classes: 'time-grid',
    levels: [
      { classes: 'primary-grid' },
      { classes: 'secondary-grid', start: 0 },
      { classes: 'tertiary-grid', start: 0 },
    ],
  },
  onRender,
}))

watchEffect(() => {
  chart.setPoints(empty.value ? [] : points)
  chart.setXLabels(xLabels.value)
  chart.setRenderBounds({ minX: 0, maxX: spanHours.value * HOUR })
})

function scaleRound(unit: number) {
  const value = state.value
  if (!value) return '—'
  const span = value.bounds.maxX - value.bounds.minX
  if (!Number.isFinite(span) || span <= 0) return '—'
  return `${Math.round(value.layout.width / span * unit * 100) / 100}`
}

function describeSpacing(values: number[]) {
  if (values.length < 2) return '—'
  const value = state.value
  if (!value) return '—'

  let min = Infinity
  for (let i = 1; i < values.length; i++) min = Math.min(min, values[i] - values[i - 1])

  const span = value.bounds.maxX - value.bounds.minX
  return `${Math.round(value.layout.width / span * min * 10) / 10}px`
}

function formatValue(value: number) {
  const days = Math.floor(value / DAY)
  const hours = Math.round((value - days * DAY) / HOUR)
  return hours === 0 ? `${days}д` : `${days}д${hours}ч`
}
</script>


<style scoped lang="scss">
// Цвет — по единице, прозрачность — по порядку уровня. Ровно то разделение, которое ждут
// боевые страницы: .day-ticks остаётся .day-ticks и уровнем подписей, и отдельным уровнем.
:deep(.universal-chart-root .time-grid) {
  .week-ticks {
    stroke: rgba(130, 200, 255, 1);
  }

  .day-ticks {
    stroke: rgba(255, 255, 255, 1);
  }

  .hour-ticks {
    stroke: rgba(255, 200, 130, 1);
  }

  .tick-level-0 {
    opacity: 0.8;
  }

  .tick-level-1 {
    opacity: 0.35;
  }

  .tick-level-2 {
    opacity: 0.18;
  }
}

.mono {
  font-family: var(--debug-mono);
  font-size: 11px;
}
</style>
