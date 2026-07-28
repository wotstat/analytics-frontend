<template>
  <DebugSection title="Три события про выход за viewport" id="outside-window-events"
    description="targetOutsideWindow, popoverOutsideWindow и popoverFullyOutsideWindow — три разных условия, и глазами их не различить. Уводи цель ползунками или сжимай viewport и следи, какое из них сработает раньше."
    source="src/shared/uiKit/popover/Popover.vue">

    <div class="debug-col" ref="root">
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">display</span>
          <input type="checkbox" v-model="display">
        </label>

        <label class="debug-control">
          <span class="debug-label">viewportOffset</span>
          <input type="range" min="0" max="300" v-model.number="viewportOffset">
          <span class="debug-value">{{ viewportOffset }}</span>
        </label>

        <label class="debug-control">
          <span class="debug-label">сдвиг цели X</span>
          <input type="range" min="-800" max="800" v-model.number="dx">
          <span class="debug-value">{{ dx }}</span>
        </label>

        <label class="debug-control">
          <span class="debug-label">сдвиг цели Y</span>
          <input type="range" min="-300" max="300" v-model.number="dy">
          <span class="debug-value">{{ dy }}</span>
        </label>
      </div>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">рамка viewportOffset</span>
          <input type="checkbox" v-model="showViewportBox">
        </label>

        <button class="debug-btn" @click="reset">Сбросить счётчики</button>
        <button class="debug-btn" @click="dx = 0; dy = 0">Вернуть цель</button>
      </div>

      <div class="debug-stage center tall">
        <div class="target-marker" ref="target" :style="{ transform: `translate(${dx}px, ${dy}px)` }">цель</div>
      </div>

      <PopoverStyled :target="target" :display="display" :viewport-offset="viewportOffset"
        :placement="['top', 'bottom']" :arrow-size="6" :interactive="false"
        @target-outside-window="onEvent('targetOutsideWindow')"
        @popover-outside-window="onEvent('popoverOutsideWindow')"
        @popover-fully-outside-window="onEvent('popoverFullyOutsideWindow')">
        <div class="card-body">
          <div>цель, за которой следим</div>
          <div class="hint">поповер сам не закрывается — это делает только PopoverAutoClose</div>
        </div>
      </PopoverStyled>

      <ViewportBox :display="showViewportBox" :offset="viewportOffset" />

      <div class="debug-grid tables">
        <table class="debug-table">
          <thead>
            <tr>
              <th>событие</th>
              <th>что значит</th>
              <th>раз</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>popoverOutsideWindow</th>
              <td>не влез целиком ни один placement</td>
              <td :class="counters.popover > 0 ? 'true' : 'false'">{{ counters.popover }}</td>
            </tr>
            <tr>
              <th>popoverFullyOutsideWindow</th>
              <td>сам поповер целиком за границей</td>
              <td :class="counters.popoverFull > 0 ? 'true' : 'false'">{{ counters.popoverFull }}</td>
            </tr>
            <tr>
              <th>targetOutsideWindow</th>
              <td>цель целиком за границей</td>
              <td :class="counters.target > 0 ? 'true' : 'false'">{{ counters.target }}</td>
            </tr>
          </tbody>
        </table>

        <table class="debug-table">
          <thead>
            <tr>
              <th>величина</th>
              <th>значение</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>rect цели</th>
              <td>{{ sample.target.x }}, {{ sample.target.y }}, {{ sample.target.width }}×{{ sample.target.height }}
              </td>
            </tr>
            <tr>
              <th>getViewportRect()</th>
              <td>{{ sample.viewport.left }}, {{ sample.viewport.top }} … {{ sample.viewport.right }}, {{
                sample.viewport.bottom }}</td>
            </tr>
            <tr>
              <th>границы с viewportOffset</th>
              <td>{{ sample.viewport.left + viewportOffset }}, {{ sample.viewport.top + viewportOffset }} … {{
                sample.viewport.right - viewportOffset }}, {{ sample.viewport.bottom - viewportOffset }}</td>
            </tr>
            <tr>
              <th>цель вне границ (счёт страницы)</th>
              <td :class="sample.targetOutside ? 'true' : 'false'">{{ sample.targetOutside }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EventLog :entries="entries" @clear="clear" empty="Событий пока не было — уводи цель за край" />

      <p class="debug-note">
        Все три события — «фронты»: они приходят один раз в момент входа в состояние, обратного события «вернулся»
        нет. Поэтому в таблице счётчики, а не флаги: если после возврата цели в кадр событие срабатывает снова, значит
        состояние успело сброситься. Дребезг счётчика на границе — нормальная картина, компонент считает каждый кадр.
      </p>

      <p class="debug-note">
        Условия действительно разные, и порядок зависит от placement. При placement top карточка висит выше цели,
        поэтому при уводе цели вверх сначала уйдёт целиком карточка (popoverFullyOutsideWindow), а цель — позже
        (targetOutsideWindow). А вот popoverOutsideWindow срабатывает раньше всех и вообще без ухода за край: достаточно
        поднять viewportOffset так, чтобы карточка перестала вписываться ни в одном placement.
      </p>

      <p class="debug-note">
        Границы считаются от <span class="debug-value">visualViewport</span>, а не от documentElement: на iOS Safari
        layout viewport не пересчитывается при сворачивании тулбара, из-за чего внизу экрана появлялась мёртвая зона.
        Поэтому пальцем нужно проверять именно так: открыть карточку у нижнего края, свернуть-развернуть адресную
        строку, поднять клавиатуру, сделать пинч-зум — события должны реагировать на это, а не только на скролл.
        Таблица «величина/значение» тут главный инструмент: rect и границы видно живьём.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef, watchEffect } from 'vue'
import { useElementVisibility, useRafFn } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import { generateOffset, getViewportRect } from '@/shared/uiKit/popover/utils'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import ViewportBox from '@/pages/debug/shared/ViewportBox.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const root = useTemplateRef<HTMLElement>('root')
const target = useTemplateRef<HTMLElement>('target')

const display = ref(true)
const viewportOffset = ref(10)
const dx = ref(0)
const dy = ref(0)

const showViewportBox = ref(false)

const counters = ref({ target: 0, popover: 0, popoverFull: 0 })
const { entries, push, clear } = useEventLog()

const sample = ref({
  target: { x: 0, y: 0, width: 0, height: 0 },
  viewport: { left: 0, top: 0, right: 0, bottom: 0 },
  targetOutside: false,
})

const visible = useElementVisibility(root)
const { pause, resume } = useRafFn(update, { immediate: false, fpsLimit: 10 })

watchEffect(() => visible.value ? resume() : pause())

function update() {
  const element = target.value
  if (!element) return

  const rect = element.getBoundingClientRect()
  const viewport = getViewportRect()
  const offset = generateOffset(viewportOffset.value)

  sample.value = {
    target: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    viewport: {
      left: Math.round(viewport.left),
      top: Math.round(viewport.top),
      right: Math.round(viewport.right),
      bottom: Math.round(viewport.bottom),
    },
    targetOutside:
      rect.x + rect.width < viewport.left + offset.left ||
      rect.x > viewport.right - offset.right ||
      rect.y + rect.height < viewport.top + offset.top ||
      rect.y > viewport.bottom - offset.bottom,
  }
}

function onEvent(name: 'targetOutsideWindow' | 'popoverOutsideWindow' | 'popoverFullyOutsideWindow') {
  if (name === 'targetOutsideWindow') counters.value.target++
  if (name === 'popoverOutsideWindow') counters.value.popover++
  if (name === 'popoverFullyOutsideWindow') counters.value.popoverFull++

  push(name)
}

function reset() {
  counters.value = { target: 0, popover: 0, popoverFull: 0 }
  clear()
}

</script>


<style scoped lang="scss">
.target-marker {
  border: 1px solid var(--blue-color);
  border-radius: 4px;
  padding: 0.3em 0.8em;
  font-size: 13px;
  color: var(--blue-thin-color);
  pointer-events: none;
  white-space: nowrap;
}

.tables {
  --debug-grid-min: 320px;
}

.debug-table th,
.debug-table td {
  overflow-wrap: anywhere;
}

.card-body {
  padding: 0.5em 0.7em;
  font-size: 13px;
  line-height: 1.4;
  max-width: 240px;

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }
}
</style>
