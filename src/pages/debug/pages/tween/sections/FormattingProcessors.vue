<template>
  <DebugSection title="Процессоры форматирования" id="processors"
    description="Одно и то же число проходит через каждый готовый процессор — сравнивай результат построчно, включая NaN/Infinity. В конце — те же процессоры на живом анимированном числе, а не на статичном инпуте."
    source="src/shared/utils/processors/, src/shared/utils/time.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">value</span>
        <input type="number" v-model.number="value" step="any">
      </label>

      <button class="debug-btn" @click="value = 0">0</button>
      <button class="debug-btn" @click="value = -12345.6">-12345.6</button>
      <button class="debug-btn" @click="value = 1234567891">1234567891</button>
      <button class="debug-btn" @click="value = 0.00042">0.00042</button>
      <button class="debug-btn" @click="value = NaN">NaN</button>
      <button class="debug-btn" @click="value = Infinity">Infinity</button>

      <label class="debug-control">
        <span class="debug-label">digits</span>
        <input type="number" min="0" max="6" v-model.number="digits">
      </label>
    </div>
    <p class="debug-hint">
      digits влияет только на процессоры-функции ниже — они пересчитываются в computed на каждое изменение. У
      хуков (<span class="debug-value">useRoundProcessor</span> и производных) precision — обычный параметр функции,
      а не WatchSource: он фиксируется в момент вызова хука и на digits не реагирует, поэтому здесь у них зашито
      конкретное число.
    </p>

    <table class="debug-table">
      <thead>
        <tr>
          <th>процессор</th>
          <th>результат</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>useRoundProcessor(value, 2) — хук, precision=2 навсегда</th>
          <td>{{ rounded }}</td>
        </tr>
        <tr>
          <th>useSpaceProcessor(value) — хук</th>
          <td>{{ spaced }}</td>
        </tr>
        <tr>
          <th>useRoundSpaceProcessor(value) — хук, precision=0 внутри по умолчанию</th>
          <td>{{ roundedSpaced }}</td>
        </tr>
        <tr>
          <th>roundProcessor(value, digits) — функция, отдаёт number, NaN → 0</th>
          <td>{{ round2 }}</td>
        </tr>
        <tr>
          <th>createFixedProcessor(digits)(value) — фабрика, NaN → '0'</th>
          <td>{{ fixed }}</td>
        </tr>
        <tr>
          <th>createFixedSpaceProcessor(digits)(value) — фабрика</th>
          <td>{{ fixedSpace }}</td>
        </tr>
        <tr>
          <th>createPercentProcessor(digits)(value) — фабрика, ×100 + %</th>
          <td>{{ percent }}</td>
        </tr>
        <tr>
          <th>createLogProcessor(digits)(value) — фабрика, k/M/B/T-суффиксы</th>
          <td>{{ log }}</td>
        </tr>
        <tr>
          <th>romanNumberProcessor(value) — вне [1, 3999] отдаёт как есть</th>
          <td>{{ roman === '' ? '(пустая строка)' : roman }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Введи <span class="debug-value">0.00042</span> — у <span class="debug-value">useSpaceProcessor</span> результат
      "0.00 042": регэксп группировки по 3 разряда режет строку от конца, не зная про точку, и на дробной части с
      «неровным» числом знаков вставляет пробел там, где не надо. С NaN процессоры расходятся: у
      <span class="debug-value">roundProcessor</span>, <span class="debug-value">createFixedProcessor</span> и
      <span class="debug-value">createPercentProcessor</span> есть явная проверка <span
        class="debug-value">Number.isNaN</span>
      → '0', а у хуков (useRoundProcessor/useSpaceProcessor) её нет — печатают "NaN" как есть
      (<span class="debug-value">.toFixed()</span> на NaN/Infinity не бросает исключение, просто возвращает строку).
      Отдельно ломается <span class="debug-value">createLogProcessor(NaN)</span> — ни одна ветка
      <span class="debug-value">Math.abs(value) &lt; 1eN</span> не срабатывает (сравнения с NaN всегда false), код
      проваливается в последнюю ветку и печатает буквально "NaNT". И <span
        class="debug-value">romanNumberProcessor(NaN)</span>:
      условие раннего выхода <span class="debug-value">value &lt; 1 || value &gt; 3999</span> с NaN тоже всегда false
      с двух сторон, но и цикл по разрядам ни разу не входит — результат пустая строка, не "NaN" и не число.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">имя игрока</span>
        <input type="text" v-model="playerName">
      </label>
      <button class="debug-btn" @click="playerName = ''">очистить</button>
      <button class="debug-btn" @click="playerName = 'Bearman_Press'">Bearman_Press</button>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>процессор</th>
          <th>результат</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>playerNameProcessor(name) — режет "_Press"/"Press"</th>
          <td>{{ processedName === undefined ? '(undefined)' : processedName }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      На пустой строке <span class="debug-value">playerNameProcessor</span> возвращает
      <span class="debug-value">undefined</span>, а не пустую строку — подставишь результат в интерполяцию без
      проверки, и в разметке молча ничего не появится, отличить «ещё не загрузилось» от «имя действительно пустое»
      по тексту не получится.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">секунды</span>
        <input type="number" v-model.number="seconds" min="0" step="1">
      </label>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>функция</th>
          <th>вход</th>
          <th>результат</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>ms2sec(ms)</th>
          <td>{{ seconds * 1000 }} мс</td>
          <td>{{ ms2sec(seconds * 1000) }} с</td>
        </tr>
        <tr>
          <th>sec2minsec(sec)</th>
          <td>{{ seconds }} с</td>
          <td>{{ sec2minsec(seconds) }}</td>
        </tr>
        <tr>
          <th>secLabel(count) — только словоформа</th>
          <td>{{ seconds }}</td>
          <td>{{ seconds }} {{ secLabel(seconds) }}</td>
        </tr>
        <tr>
          <th>ms2secLabel(count) — count в мс, словоформа по секундам</th>
          <td>{{ seconds * 1000 }} мс</td>
          <td>{{ seconds }} {{ ms2secLabel(seconds * 1000) }}</td>
        </tr>
        <tr>
          <th>sec2hour(sec)</th>
          <td>{{ seconds }} с</td>
          <td>{{ sec2hour(seconds) }} ч</td>
        </tr>
        <tr>
          <th>hour2hour(hour) — просто toFixed(1), без деления</th>
          <td>{{ (seconds / 3600).toFixed(3) }} ч</td>
          <td>{{ hour2hour(seconds / 3600) }} ч</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      В docs/05-ui-kit.md среди экспортов <span class="debug-path">time.ts</span> упомянута
      <span class="debug-value">hourDayExp</span> — на деле такой функции в файле нет: это локальная функция внутри
      <span class="debug-path">src/pages/infographics/pages/Battle.vue</span>, не экспорт утилиты. Реальные экспорты
      time.ts — в таблице выше, плюс <span class="debug-value">timeProcessor</span>: внутренняя реализация
      sec2minsec, отдаёт пару [минуты, секунды], отдельно нигде не используется.
    </p>

    <p class="debug-hint">Тот же набор — на анимированном числе, а не на статичном инпуте:</p>

    <div class="debug-row">
      <button class="debug-btn" @click="tweenTarget = tweenTarget === 0 ? 4213 : 0">
        {{ tweenTarget === 0 ? '→ 4213' : '→ 0' }}
      </button>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 220px">
      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue :processor="spaceProcessor"</span>
        <span class="value">
          <TweenValue :value="tweenTarget" :processor="spaceProcessor" />
        </span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue :processor="createFixedSpaceProcessor(1)"</span>
        <span class="value">
          <TweenValue :value="tweenTarget" :processor="fixedSpaceOneDigit" />
        </span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue :processor="romanNumberProcessor"</span>
        <span class="value">
          <TweenValue :value="tweenTarget" :processor="romanNumberProcessor" />
        </span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">useRoundTweenProcessor(() =&gt; tweenTarget) — композабл, не проп компонента</span>
        <span class="value">{{ tweenRounded }}</span>
      </div>
    </div>

    <p class="debug-note">
      Компонентный проп <span class="debug-value">processor</span> и композабл
      <span class="debug-value">useRoundTweenProcessor</span> делают на вид одно и то же, но по разным путям: у
      TweenValue твинится сырое число (useTweenComputed), а processor форматирует уже анимированное текущее значение
      на каждом кадре — это заложено прямо в processed.ts. useRoundTweenProcessor сначала тоже твинит через тот же
      useTweenComputed, а затем отдельно прогоняет результат через useRoundProcessor — итоговое число совпадает, но
      это два независимых пути форматирования, не переиспользующих друг друга.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TweenValue from '@/shared/ui/tween/TweenValue.vue'
import { useRoundProcessor } from '@/shared/utils/processors/useRoundProcessor'
import { spaceProcessor, useSpaceProcessor } from '@/shared/utils/processors/useSpaceProcessor'
import { useRoundSpaceProcessor } from '@/shared/utils/processors/useRoundSpaceProcessor'
import { useRoundTweenProcessor } from '@/shared/utils/processors/useRoundTweenProcessor'
import { usePlayerNameProcessor } from '@/shared/utils/processors/usePlayerNameProcessor'
import {
  roundProcessor,
  createFixedProcessor,
  createFixedSpaceProcessor,
  createPercentProcessor,
  createLogProcessor,
  romanNumberProcessor
} from '@/shared/utils/processors/processors'
import { ms2sec, sec2minsec, secLabel, ms2secLabel, sec2hour, hour2hour } from '@/shared/utils/time'

const value = ref(1234567.891)
const digits = ref(2)

const rounded = useRoundProcessor(value, 2)
const spaced = useSpaceProcessor(value)
const roundedSpaced = useRoundSpaceProcessor(value)

const round2 = computed(() => roundProcessor(value.value, digits.value))
const fixed = computed(() => createFixedProcessor(digits.value)(value.value))
const fixedSpace = computed(() => createFixedSpaceProcessor(digits.value)(value.value))
const percent = computed(() => createPercentProcessor(digits.value)(value.value))
const log = computed(() => createLogProcessor(digits.value)(value.value))
const roman = computed(() => romanNumberProcessor(value.value))

const playerName = ref('Bearman_Press')
const processedName = usePlayerNameProcessor(playerName)

const seconds = ref(125)

const tweenTarget = ref(0)
const fixedSpaceOneDigit = createFixedSpaceProcessor(1)
const tweenRounded = useRoundTweenProcessor(() => tweenTarget.value)
</script>


<style scoped lang="scss">
.demo-card {
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.6em 0.8em;
}

.value {
  font-family: var(--debug-mono);
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}
</style>
