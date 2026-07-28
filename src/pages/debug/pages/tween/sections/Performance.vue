<template>
  <DebugSection title="Производительность: много значений одновременно" id="performance"
    description="Десятки, а то и сотни независимых твинов тикают одновременно — у каждого свой requestAnimationFrame. Крути количество вверх, включай «запущено» и смотри на средний/максимальный кадр справа: если он растёт заметно выше ~16.7мс (бюджет 60fps) — вот он, джанк."
    source="src/shared/ui/tween/useTweenRef.ts, src/shared/ui/tween/SimpleTweenValue.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">количество</span>
        <input type="range" min="10" max="400" step="10" v-model.number="count">
        <span class="debug-value">{{ count }}</span>
      </label>

      <button class="debug-btn" :class="{ active: running }" @click="running = !running">
        {{ running ? 'Остановить' : 'Запустить' }}
      </button>
      <button class="debug-btn" @click="shuffleActive">разово: новые случайные цели</button>
    </div>

    <table class="debug-table stats">
      <thead>
        <tr>
          <th>кадр, среднее</th>
          <th>кадр, максимум</th>
          <th>≈ FPS по среднему</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td :class="frameClass">{{ running ? `${average.toFixed(1)} мс` : '—' }}</td>
          <td :class="frameClass">{{ running ? `${worst.toFixed(1)} мс` : '—' }}</td>
          <td :class="frameClass">{{ running && average > 0 ? Math.round(1000 / average) : '—' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-grid values-grid" style="--debug-grid-min: 92px">
      <span class="value" v-for="i in count" :key="i">
        <SimpleTweenValue :value="targets[i - 1] ?? 0" space />
      </span>
    </div>

    <p class="debug-note">
      Пока «Запущено» — каждые {{ retargetInterval }} мс все видимые значения одновременно получают новую случайную
      цель: это N независимых цепочек requestAnimationFrame сразу, каждый SimpleTweenValue создаёт свой собственный
      Tween, общего тикера на всех нет. Средний/максимальный кадр меряет тот же
      <span class="debug-path">pages/debug/shared/useFrameStats.ts</span>, что и страница TableView.
    </p>

    <p class="debug-note">
      Для сетки взят <span class="debug-value">SimpleTweenValue</span>, не TweenValue: последний на каждый инстанс
      дополнительно разворачивает пару компонентов из <span class="debug-value">createReusableTemplate()</span>
      (vueuse) — на сотнях инстансов это лишние узлы компонентного дерева поверх самого твина, не влияющие на сам
      расчёт анимации, но чуть утяжеляющие монтирование/размонтирование при смене количества.
    </p>

    <p class="debug-note">
      Рамку и моно-шрифт клетки пришлось повесить на обёртку <span class="debug-value">&lt;span
        class="value"&gt;</span>,
      а не на сам SimpleTweenValue: его шаблон — это голая текстовая интерполяция без корневого элемента, class/style
      в такой компонент прокинуть некуда, Vue предупредит в консоли и молча проигнорирует атрибут. Ни class, ни tag у
      SimpleTweenValue вообще нет в пропах — оборачивать снаружи придётся всегда, это и есть его отличие от
      TweenValue из первой секции.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import SimpleTweenValue from '@/shared/ui/tween/SimpleTweenValue.vue'
import { useFrameStats } from '@/pages/debug/shared/useFrameStats'

const MAX_COUNT = 400
const retargetInterval = 500

const count = ref(80)
const running = ref(false)

const targets = ref<number[]>(Array.from({ length: MAX_COUNT }, () => randomTarget()))

function randomTarget() {
  return Math.round((Math.random() * 20000 - 5000) * 10) / 10
}

function shuffleActive() {
  for (let i = 0; i < count.value; i++) targets.value[i] = randomTarget()
}

const { pause, resume } = useIntervalFn(shuffleActive, retargetInterval, { immediate: false })

watch(running, value => {
  if (value) {
    shuffleActive()
    resume()
  } else {
    pause()
  }
})

const { average, worst } = useFrameStats(running)

const frameClass = computed(() => {
  if (!running.value) return ''
  return average.value > 20 ? 'false' : 'true'
})
</script>


<style scoped lang="scss">
.values-grid {
  max-height: 320px;
  overflow-y: auto;
}

.value {
  font-family: var(--debug-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  border: 1px solid var(--debug-border);
  border-radius: 4px;
  padding: 0.3em 0.4em;
  text-align: right;
}
</style>
