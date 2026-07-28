<template>
  <DebugSection title="Крайние значения" id="edge-cases"
    description="Ноль, отрицательные, миллиарды, дробные, NaN, Infinity, быстрая смена значения за один тик, ретаргет посреди анимации, нулевая длительность — по отдельному тумблеру на каждый случай."
    source="src/shared/ui/tween/useTweenRef.ts, src/shared/ui/tween/TweenValue.vue">

    <p class="debug-hint">Обычные крайние величины: ноль, отрицательное, сотни миллиардов, мелкая дробь.</p>

    <div class="debug-row">
      <button class="debug-btn" @click="basicTarget = 0">0</button>
      <button class="debug-btn" @click="basicTarget = -50000.5">-50000.5</button>
      <button class="debug-btn" @click="basicTarget = 123456789012">123456789012</button>
      <button class="debug-btn" @click="basicTarget = 0.000123">0.000123</button>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 220px">
      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue space</span>
        <span class="value">
          <TweenValue :value="basicTarget" space />
        </span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue :precision="3" space</span>
        <span class="value">
          <TweenValue :value="basicTarget" :precision="3" space />
        </span>
      </div>
    </div>

    <p class="debug-hint">
      Сузь окно браузера — карточки переносятся по debug-grid, а пробелы-разряды внутри числа это обычные пробельные
      символы моно-шрифта: если ширины не хватает, число переносится по ним же, как текст, а не съезжает за границы.
    </p>

    <p class="debug-hint">NaN и Infinity — отдельный, изолированный экземпляр, чтобы не испортить остальные демо на
      странице.</p>

    <div class="debug-row">
      <button class="debug-btn" @click="poisonTarget = NaN">value = NaN</button>
      <button class="debug-btn" @click="poisonTarget = Infinity">value = Infinity</button>
      <button class="debug-btn" @click="poisonTarget = -Infinity">value = -Infinity</button>
      <button class="debug-btn" @click="poisonTarget = 500">вернуть 500 (не сработает)</button>
      <button class="debug-btn" @click="recreatePoisoned">пересоздать :key — единственный способ восстановиться</button>
    </div>

    <div class="debug-stage center short">
      <span class="value">
        <TweenValue :key="poisonKey" :value="poisonTarget" space />
      </span>
    </div>

    <p class="debug-note">
      Это баг в <span class="debug-value">Tween.to()</span>, а не задокументированная особенность: нигде в
      to()/animate() нет проверки Number.isFinite. Цель NaN даёт NaN на первом же кадре
      (fromValue + (NaN − fromValue) × eased = NaN всегда), а цель ±Infinity сперва даёт Infinity, но стоит следом
      задать любое конечное число — на каждом кадре считается Infinity + (finite − Infinity) × eased, то есть
      Infinity + (−Infinity × eased); при eased = 0 это Infinity + NaN (0 × Infinity = NaN по IEEE754), при
      eased &gt; 0 это Infinity + (−Infinity) = NaN — тоже NaN. С этого момента текущее значение (getValue()) —
      NaN навсегда: обе защиты от бессмысленных перезапусков, <span class="debug-value">fromValue === value</span> и
      <span class="debug-value">Math.abs(fromValue - value) &lt;= minStep</span>, сравнивают через NaN и поэтому
      никогда не срабатывают. Ни один следующий to() к любому конечному числу вывести из NaN не может — каждый кадр
      заново стартует с fromValue = NaN и заражает результат. Проверено пошагово: жми кнопки по очереди, «вернуть
      500» не помогает, помогает только пересоздание компонента.
    </p>

    <p class="debug-hint">Несколько присвоений value за один синхронный тик — до отрисовки.</p>

    <div class="debug-row">
      <button class="debug-btn" @click="rapidFire">3 присвоения подряд: 111 → 222 → 333</button>
    </div>

    <div class="debug-stage center short">
      <span class="value">
        <TweenValue :value="fastTarget" space />
      </span>
    </div>

    <div class="debug-log">
      <div class="debug-log-line" v-for="entry in fastLog" :key="entry.id">
        <span class="debug-log-time">watch</span>
        <span>{{ entry.text }}</span>
      </div>
      <div class="debug-log-empty" v-if="fastLog.length === 0">пока пусто — нажми кнопку выше</div>
    </div>

    <p class="debug-note">
      В логе всегда одна строка на клик, а не три: watch(value, ...) внутри useTweenRef переживает пачку синхронных
      присвоений и видит только финальное значение после текущего тика — Vue батчит срабатывание watcher'ов. 111 и
      222 никогда не попадают в Tween.to(), анимация стартует сразу к 333, будто промежуточных присвоений не было
      вовсе.
    </p>

    <p class="debug-hint">Смена целевого значения посреди уже идущей анимации.</p>

    <div class="debug-row">
      <button class="debug-btn" @click="midTarget = 2000">старт: → 2000, 2.5с</button>
      <button class="debug-btn" @click="midTarget = -800">перенаправить (жми, пока едет): → -800</button>
      <button class="debug-btn" @click="midTarget = 0">→ 0</button>
    </div>

    <div class="debug-stage center short">
      <span class="value">
        <TweenValue :value="midTarget" :options="{ duration: 2500 }" space />
      </span>
    </div>

    <p class="debug-note">
      Жми «перенаправить» на середине первой анимации: скачка нет — Tween.to() берёт fromValue =
      <span class="debug-value">getValue()</span>, то есть текущее интерполированное значение, а не точку исходного
      старта. Смена цели на лету всегда продолжает движение оттуда, где число оказалось прямо сейчас — здесь всё
      работает как ожидается, без сюрпризов.
    </p>

    <p class="debug-hint">Нулевая длительность.</p>

    <div class="debug-row">
      <button class="debug-btn" :class="{ active: !zeroDurationOn }" @click="zeroDurationOn = false">duration =
        800</button>
      <button class="debug-btn" :class="{ active: zeroDurationOn }" @click="zeroDurationOn = true">duration = 0</button>
      <button class="debug-btn" @click="zeroTarget = zeroTarget === 0 ? 99999 : 0">
        {{ zeroTarget === 0 ? '→ 99999' : '→ 0' }}
      </button>
    </div>

    <div class="debug-stage center short">
      <span class="value">
        <TweenValue :key="String(zeroDurationOn)" :value="zeroTarget" :options="{ duration: zeroDurationOn ? 0 : 800 }"
          space />
      </span>
    </div>

    <p class="debug-note">
      :key здесь обязателен — иначе переключение duration не подействует на уже смонтированный компонент, см. разбор
      в секции <a href="#tween-ref-variants">«Два варианта useTweenRef»</a>. При duration = 0 подскок всё равно не
      синхронный: нужен минимум один requestAnimationFrame — progress = elapsed / 0 = Infinity, тут же зажимается до
      1 через Math.min. Полностью синхронно, вообще без кадра, значение проставляется только по отдельному короткому
      пути в начале to(): когда |было − стало| ≤ minStep (по умолчанию 1).
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TweenValue from '@/shared/ui/tween/TweenValue.vue'

const basicTarget = ref(0)

const poisonTarget = ref(500)
const poisonKey = ref(0)

function recreatePoisoned() {
  poisonKey.value++
  poisonTarget.value = 500
}

const fastTarget = ref(0)
const fastLog = ref<{ id: number, text: string }[]>([])
let fastLogId = 0

watch(fastTarget, (newValue, oldValue) => {
  fastLog.value.unshift({ id: fastLogId++, text: `${oldValue} → ${newValue}` })
  if (fastLog.value.length > 20) fastLog.value.length = 20
})

function rapidFire() {
  fastTarget.value = 111
  fastTarget.value = 222
  fastTarget.value = 333
}

const midTarget = ref(0)

const zeroTarget = ref(0)
const zeroDurationOn = ref(false)
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
