<template>
  <DebugSection title="Реализация useTweenRef" id="tween-ref-variants"
    description="В проекте осталась одна реализация useTweenRef. Здесь показаны её публичный API и неочевидное поведение options."
    source="src/shared/ui/tween/useTweenRef.ts">

    <table class="debug-table">
      <thead>
        <tr>
          <th></th>
          <th>src/shared/ui/tween/useTweenRef.ts</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>статус</th>
          <td class="true">единственная рабочая реализация</td>
        </tr>
        <tr>
          <th>экспорты</th>
          <td class="true">Tween, TweenOptions, useTweenRef, useTweenComputed</td>
        </tr>
        <tr>
          <th>используется в проекте</th>
          <td class="true">да — TweenValue, SimpleTweenValue, processed.ts, useRoundTweenProcessor и т.д.</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Раньше в <span class="debug-path">src/composition/tween/useTweenRef.ts</span> лежал второй вариант реализации,
      затем файл опустошили и удалили. Сейчас единственная рабочая реализация —
      <span class="debug-value">src/shared/ui/tween/useTweenRef.ts</span>; её используют TweenValue, SimpleTweenValue,
      processed.ts и useRoundTweenProcessor.
    </p>

    <p class="debug-hint">
      Раз сравнивать нечего, вот действительно неочевидный момент самого useTweenRef — как раз то, что было бы видно
      на «двух вариантах рядом», если бы они существовали: options выглядит как обычный реактивный проп, а на деле
      читается один раз при монтировании.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">duration</span>
        <input type="range" min="100" max="3000" step="100" v-model.number="reactivityDuration">
        <span class="debug-value">{{ reactivityDuration }}</span>
      </label>

      <button class="debug-btn" @click="reactivityTarget = reactivityTarget === 0 ? 5000 : 0">
        {{ reactivityTarget === 0 ? '→ 5000' : '→ 0' }}
      </button>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 240px">
      <div class="demo-card debug-col">
        <span class="debug-hint">без :key — duration застыл на моменте монтирования</span>
        <span class="value"><TweenValue :value="reactivityTarget" :options="{ duration: reactivityDuration }" space /></span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">с :key="duration" — пересоздаётся, забирает текущее значение</span>
        <span class="value">
          <TweenValue :key="reactivityDuration" :value="reactivityTarget" :options="{ duration: reactivityDuration }" space />
        </span>
      </div>
    </div>

    <p class="debug-note">
      Подвинь слайдер, потом жми кнопку смены значения: левая карточка едет с той скоростью, что была на момент
      первого рендера страницы, сколько слайдер ни крути — <span class="debug-value">options</span> передаётся в
      useTweenRef() один раз при setup(), и watch(value, ...) внутри дальше держит его в замыкании; сам options
      нигде не watch'ится ни в useTweenRef, ни в useTweenComputed, ни в processed.ts. Правая едет с той скоростью,
      что выставлена сейчас, потому что :key пересоздаёт компонент и вызывает useTweenRef() заново. Значит «живой»
      duration/easing-слайдер на уже смонтированном TweenValue/SimpleTweenValue — это визуальный обман: цифра
      слайдера меняется, а на уже идущую анимацию это не влияет. К слову, это же объясняет, почему в секции
      <a href="#components">TweenValue vs SimpleTweenValue</a> слайдер duration не меняет скорость уже запущенной
      анимации — там для этого тоже потребовался бы :key.
    </p>

    <p class="debug-note">
      Заодно про <span class="debug-value">processed.ts</span>: единственная его функция —
      <span class="debug-value">useProcessed(props)</span>, обёртка над useTweenComputed, которая внутри себя
      воспроизводит ту же цепочку приоритетов форматирования (processor → precision → raw → округление + space),
      что иначе пришлось бы писать руками в каждом компоненте. Использует её только TweenValue.vue;
      SimpleTweenValue.vue ту же цепочку дублирует вручную — это уже отмечено в таблице секции «TweenValue vs
      SimpleTweenValue» строкой «внутренняя реализация». Сам processed.ts не добавляет новых возможностей поверх
      useTweenComputed + форматирования, только выносит повторяющийся код в одно место.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TweenValue from '@/shared/ui/tween/TweenValue.vue'

const reactivityTarget = ref(0)
const reactivityDuration = ref(800)
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
