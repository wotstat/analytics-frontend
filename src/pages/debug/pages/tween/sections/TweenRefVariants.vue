<template>
  <DebugSection title="Два варианта useTweenRef" id="tween-ref-variants"
    description="Прямой вопрос: shared/ui/tween/useTweenRef.ts и src/composition/tween/useTweenRef.ts — это два идентичных дубля или нет? Сравнивать их рядом на одинаковых входных данных не вышло — читай почему."
    source="src/shared/ui/tween/useTweenRef.ts, src/composition/tween/useTweenRef.ts">

    <table class="debug-table">
      <thead>
        <tr>
          <th></th>
          <th>shared/ui/tween/useTweenRef.ts</th>
          <th>src/composition/tween/useTweenRef.ts</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>размер исходника</th>
          <td class="true">{{ sharedSize }} байт</td>
          <td class="false">{{ compositionSize }} байт</td>
        </tr>
        <tr>
          <th>экспорты</th>
          <td class="true">Tween, TweenOptions, useTweenRef, useTweenComputed</td>
          <td class="false">ни одного — файл пуст</td>
        </tr>
        <tr>
          <th>используется в проекте</th>
          <td class="true">да — TweenValue, SimpleTweenValue, processed.ts, useRoundTweenProcessor и т.д.</td>
          <td class="false">нигде</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <b>Ответ на прямой вопрос:</b> варианты не идентичны — сравнивать буквально нечего.
      <span class="debug-path">src/composition/tween/useTweenRef.ts</span> физически пуст (0 байт, длина импортированного
      через Vite <span class="debug-value">?raw</span> исходника в таблице выше — не переписано руками, это то, что
      реально лежит на диске). Git показывает, что файл создан пустым коммитом «update» (2 сентября 2025) и с тех пор
      ни разу не менялся; по всему проекту его никто не импортирует. Единственная рабочая реализация —
      <span class="debug-value">shared/ui/tween/useTweenRef.ts</span>, её и используют TweenValue, SimpleTweenValue и
      processed.ts. В <span class="debug-path">docs/05-ui-kit.md</span> это уже описано верно — файл назван «пустым
      файлом на 0 байт», который «никем не импортируется и подлежит удалению», так что расхождения с реальностью
      нет. Судя по всему, второй вариант когда-то задумывался и не был дописан, либо остался забытым черновиком
      после рефакторинга.
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
import sharedSource from '@/shared/ui/tween/useTweenRef.ts?raw'
import compositionSource from '@/composition/tween/useTweenRef.ts?raw'

const sharedSize = sharedSource.length
const compositionSize = compositionSource.length

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
