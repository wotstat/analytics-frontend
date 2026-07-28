<template>
  <DebugSection title="autoExtend: политика повторного показа" id="auto-extend"
    description="Развёрнутое содержимое обычно показывается по наведению. autoExtend — это условие, при котором бабл разворачивается сам, без наведения. Собери политику, покрути открытие/скрытие и wrong(), смотри на счётчики — они те же, что использует shouldShowBubble/mayAutoExtend внутри composable."
    source="src/shared/uiKit/tipBubble/useTipBubble.ts (mayAutoExtend)">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">режим</span>
        <select v-model="mode">
          <option value="none">выкл (undefined)</option>
          <option value="always">'always'</option>
          <option value="always-object">{ type: 'always' }</option>
          <option value="force-extend">'force-extend'</option>
          <option value="after-open">{ type: 'after-open' }</option>
          <option value="after-show-bubble">{ type: 'after-show-bubble' }</option>
          <option value="after-wrong">{ type: 'after-wrong' }</option>
        </select>
      </label>

      <label class="debug-control" v-if="hasCount">
        <span class="debug-label">count</span>
        <input type="number" min="0" v-model.number="count">
      </label>

      <label class="debug-control" v-if="hasSnooze">
        <span class="debug-label">interactSnooze</span>
        <input type="number" min="0" v-model.number="interactSnooze">
      </label>

      <template v-if="mode === 'after-wrong'">
        <label class="debug-control">
          <span class="debug-label">hideSnooze</span>
          <select v-model="hideSnoozeMode">
            <option value="none">не задан</option>
            <option value="reset">'reset'</option>
            <option value="number">число</option>
          </select>
        </label>
        <input v-if="hideSnoozeMode === 'number'" type="number" min="0" v-model.number="hideSnoozeNumber">
      </template>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="apply">Применить (пересоздаст бабл)</button>
      <button class="debug-btn" @click="reset">Сбросить localStorage</button>
      <span class="debug-hint">autoExtend: <span class="debug-value">{{ JSON.stringify(autoExtend) }}</span></span>
    </div>

    <div class="debug-stage center">
      <div class="anchor" :key="generation">
        <label class="debug-control">
          <input type="checkbox" v-model="display">
          <span class="debug-label">показать</span>
        </label>
        <button class="debug-btn" @click="bubble?.wrong()">wrong()</button>

        <TipBubbleText ref="bubble" class="spot" bubbleKey="debug-tipbubble-autoextend" direction="left" :autoExtend
          :display showBubble="always" text="Разворачивается сама по условию autoExtend" />
      </div>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>openCount</th>
          <th>showCount</th>
          <th>wrongCount</th>
          <th>visibleWrongCount</th>
          <th>lastInteractOpen</th>
          <th>lastInteractShow</th>
          <th>lastInteractWrong</th>
          <th>lastHideWrong</th>
          <th>autoExtend (факт)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ info?.state?.openCount ?? '—' }}</td>
          <td>{{ info?.state?.showCount ?? '—' }}</td>
          <td>{{ info?.state?.wrongCount ?? '—' }}</td>
          <td>{{ info?.state?.visibleWrongCount ?? '—' }}</td>
          <td>{{ info?.state?.lastInteractOpen ?? '—' }}</td>
          <td>{{ info?.state?.lastInteractShow ?? '—' }}</td>
          <td>{{ info?.state?.lastInteractWrong ?? '—' }}</td>
          <td>{{ info?.state?.lastHideWrong ?? '—' }}</td>
          <td :class="String(info?.props?.autoExtend)">{{ info?.props?.autoExtend ?? '—' }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Чтобы набрать openCount/showCount — открой и закрой чекбоксом «показать» несколько раз. Наведение курсора или
      тап по самому бабблу вызывает <span class="debug-value">interactReset()</span> и подтягивает
      lastInteract* к текущему счётчику — это откладывает автопоказ ровно на interactSnooze циклов вперёд.
      <span class="debug-value">wrong()</span> всегда увеличивает wrongCount, но visibleWrongCount — только если в
      момент вызова бабл реально показан (<span class="debug-value">showBubble === true</span>): именно от
      visibleWrongCount зависит autoExtend с type «after-wrong», а от wrongCount — независимый показ через
      showBubble: {type:'after-wrong'} (см. раздел «Опции»). Нажми wrong() при выключенном «показать», чтобы
      увидеть разницу в таблице.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'
import { debugInfo, type Options } from '@/shared/uiKit/tipBubble/useTipBubble'
import { resetBubbleKeys } from '../shared/storage'

const KEY = 'debug-tipbubble-autoextend'

type Mode = 'none' | 'always' | 'always-object' | 'force-extend' | 'after-open' | 'after-show-bubble' | 'after-wrong'

const mode = ref<Mode>('after-wrong')
const count = ref(2)
const interactSnooze = ref(20)
const hideSnoozeMode = ref<'none' | 'reset' | 'number'>('reset')
const hideSnoozeNumber = ref(2)

const hasCount = computed(() => mode.value === 'after-open' || mode.value === 'after-show-bubble' || mode.value === 'after-wrong')
const hasSnooze = computed(() => mode.value !== 'none' && mode.value !== 'force-extend')

const autoExtend = computed<Options['autoExtend']>(() => {
  if (mode.value === 'none') return undefined
  if (mode.value === 'always') return 'always'
  if (mode.value === 'always-object') return { type: 'always', interactSnooze: interactSnooze.value }
  if (mode.value === 'force-extend') return 'force-extend'
  if (mode.value === 'after-open') return { type: 'after-open', count: count.value, interactSnooze: interactSnooze.value }
  if (mode.value === 'after-show-bubble') return { type: 'after-show-bubble', count: count.value, interactSnooze: interactSnooze.value }

  const hideSnooze = hideSnoozeMode.value === 'none' ? undefined : hideSnoozeMode.value === 'reset' ? 'reset' : hideSnoozeNumber.value
  return { type: 'after-wrong', count: count.value, interactSnooze: interactSnooze.value, hideSnooze }
})

const display = ref(false)
const generation = ref(0)
const bubble = useTemplateRef<InstanceType<typeof TipBubbleText>>('bubble')

function apply() {
  generation.value++
}

function reset() {
  resetBubbleKeys(KEY)
  display.value = false
  generation.value++
}

const info = computed(() => debugInfo.value.bubbles.get(KEY))

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

.spot {
  position: absolute;
  top: -6px;
  right: -6px;
}
</style>
