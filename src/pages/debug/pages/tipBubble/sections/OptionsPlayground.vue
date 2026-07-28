<template>
  <DebugSection title="Опции useTipBubble" id="options"
    description="Голый uiKit TipBubbleText — без дефолтов проектной обёртки shared/ui/tipBubble/. pagePadding, showBubble и autoExtend здесь по умолчанию не заданы вовсе. Собери комбинацию, включи display и посмотри на таблицу счётчиков ниже."
    source="src/shared/uiKit/tipBubble/useTipBubble.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">key</span>
        <select v-model="activeKey">
          <option v-for="k in keys" :key="k" :value="k">{{ k }}</option>
        </select>
      </label>
      <span class="debug-hint">key применится только к следующему пересозданию бабла кнопкой «Применить» — до этого
        смонтированный бабл продолжает писать в свой прежний ключ localStorage и строку debugInfo</span>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">groupKey</span>
        <select v-model="groupKeyInput">
          <option value="">нет</option>
          <option value="debug-tipbubble-options-group">debug-tipbubble-options-group</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">direction</span>
        <select v-model="direction">
          <option value="auto">auto</option>
          <option value="left">left</option>
          <option value="right">right</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">pagePadding</span>
        <select v-model="pagePaddingMode">
          <option value="none">не задан</option>
          <option value="var">--content-page-margin</option>
          <option value="number">число, px</option>
        </select>
      </label>
      <input v-if="pagePaddingMode === 'number'" type="number" min="0" v-model.number="pagePaddingNumber">

      <label class="debug-control">
        <span class="debug-label">displayDelay</span>
        <input type="number" min="0" step="100" v-model.number="displayDelay">
        <span class="debug-hint">мс</span>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">showBubble</span>
        <select v-model="showBubbleMode">
          <option value="always">always</option>
          <option value="after-open">after-open</option>
          <option value="after-wrong">after-wrong</option>
        </select>
      </label>
      <label class="debug-control" v-if="showBubbleMode !== 'always'">
        <span class="debug-label">count</span>
        <input type="number" min="0" v-model.number="showBubbleCount">
      </label>

      <label class="debug-control">
        <span class="debug-label">autoExtend</span>
        <select v-model="autoExtendMode">
          <option value="none">выкл</option>
          <option value="always">always</option>
          <option value="force-extend">force-extend</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="apply">Применить</button>
      <button class="debug-btn" @click="reset">Сбросить localStorage для обоих key</button>
      <span class="debug-hint">Options: <span class="debug-value">{{ optionsPreview }}</span></span>
    </div>

    <div class="debug-stage center">
      <div class="anchor">
        <span>цель ({{ activeKey.split('-').at(-1) }})</span>
        <label class="debug-control display-toggle">
          <span class="debug-label">display</span>
          <input type="checkbox" v-model="display">
        </label>
        <TipBubbleText class="spot" :key="generation" :bubbleKey="activeKey" :groupKey="groupKey" :direction
          :pagePadding :displayDelay :showBubble :autoExtend :display :text="demoText" />
      </div>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>key</th>
          <th>alwaysHidden</th>
          <th>accepted</th>
          <th>openCount</th>
          <th>showCount</th>
          <th>mayDisplay</th>
          <th>shouldDisplay</th>
          <th>displayed</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>{{ activeKey }}</th>
          <td :class="String(info?.alwaysHidden)">{{ info?.alwaysHidden ?? '—' }}</td>
          <td>{{ info?.state?.accepted ?? '—' }}</td>
          <td>{{ info?.state?.openCount ?? '—' }}</td>
          <td>{{ info?.state?.showCount ?? '—' }}</td>
          <td :class="String(info?.props?.mayDisplay)">{{ info?.props?.mayDisplay ?? '—' }}</td>
          <td :class="String(info?.props?.shouldDisplay)">{{ info?.props?.shouldDisplay ?? '—' }}</td>
          <td :class="String(info?.props?.displayed)">{{ info?.props?.displayed ?? '—' }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <b>display</b> — единственная по-настоящему реактивная опция: она передаётся как проп и отслеживается
      компонентом через <span class="debug-value">watch</span>. Всё остальное (direction, pagePadding, displayDelay,
      showBubble, autoExtend, groupKey) читается один раз внутри <span class="debug-value">useTipBubble()</span> в
      момент создания компонента и после этого не реагирует на смену пропсов — поэтому у кнопки «Применить» есть
      смысл: она пересоздаёт бабл с новым набором опций, обычный клик по контролам сам по себе ничего не меняет.
    </p>

    <p class="debug-note">
      Режим pagePadding = <span class="debug-value">--content-page-margin</span> на боевых страницах задаёт
      <span class="debug-path">SidebarLayout.vue</span>, а дебаг-страницы этой обёрткой не пользуются — и переменную
      здесь нигде не выставляют. Из-за этого <span class="debug-value">var(--content-page-margin)</span> без
      фолбэка невалиден, <span class="debug-value">calc()</span> в TipBubbleComponent.vue схлопывает
      maxContentWidth, а <span class="debug-value">max-width</span> контента бабла оказывается
      <span class="debug-value">none</span> — режим var на этой странице ничего не ограничивает.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TipBubbleText from '@/shared/uiKit/tipBubble/TipBubbleText.vue'
import { debugInfo, type Options } from '@/shared/uiKit/tipBubble/useTipBubble'
import { resetBubbleKeys } from '../shared/storage'

const demoText = 'Пример подсказки со всеми опциями сразу'

const keys = ['debug-tipbubble-options-a', 'debug-tipbubble-options-b']
const activeKey = ref(keys[0])

const groupKeyInput = ref('')
const groupKey = computed(() => groupKeyInput.value || undefined)

const direction = ref<Options['direction']>('auto')

const pagePaddingMode = ref<'none' | 'var' | 'number'>('var')
const pagePaddingNumber = ref(16)
const pagePadding = computed<Options['pagePadding']>(() => {
  if (pagePaddingMode.value === 'none') return undefined
  if (pagePaddingMode.value === 'var') return '--content-page-margin'
  return pagePaddingNumber.value
})

const displayDelay = ref(0)

const showBubbleMode = ref<'always' | 'after-open' | 'after-wrong'>('always')
const showBubbleCount = ref(2)
const showBubble = computed<Options['showBubble']>(() => {
  if (showBubbleMode.value === 'always') return 'always'
  if (showBubbleMode.value === 'after-open') return { type: 'after-open', count: showBubbleCount.value }
  return { type: 'after-wrong', count: showBubbleCount.value }
})

const autoExtendMode = ref<'none' | 'always' | 'force-extend'>('none')
const autoExtend = computed<Options['autoExtend']>(() => {
  if (autoExtendMode.value === 'none') return undefined
  return autoExtendMode.value
})

const display = ref(false)
const generation = ref(0)

function apply() {
  generation.value++
}

function reset() {
  resetBubbleKeys(...keys)
  generation.value++
}

const info = computed(() => debugInfo.value.bubbles.get(activeKey.value))

const optionsPreview = computed(() => JSON.stringify({
  key: activeKey.value,
  groupKey: groupKey.value,
  direction: direction.value,
  pagePadding: pagePadding.value,
  displayDelay: displayDelay.value,
  showBubble: showBubble.value,
  autoExtend: autoExtend.value,
}))

</script>


<style scoped lang="scss">
.anchor {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.4em 0.8em;
  background: var(--debug-surface);
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  font-size: 13px;
}

.display-toggle {
  margin-left: 0.5em;
}

.spot {
  position: absolute;
  top: -6px;
  right: -6px;
}
</style>
