<template>
  <DebugSection title="Очередь внутри группы" id="group-queue"
    description="Четыре бабла с одним groupKey. Нажми «Показать все» — одновременно откроется только один, остальные встанут в очередь и будут ждать своей очереди по мере того, как предыдущие скрываются."
    source="src/shared/uiKit/tipBubble/useTipBubble.ts (класс Group)">

    <div class="debug-row">
      <button class="debug-btn" @click="showAll">Показать все</button>
      <button class="debug-btn" @click="hideAll">Скрыть все</button>
      <button class="debug-btn" @click="reset">Сбросить localStorage</button>
    </div>

    <div class="debug-stage">
      <div class="debug-row cards">
        <div class="card" v-for="(key, i) in keys" :key="key">
          <label class="debug-control">
            <input type="checkbox" v-model="displayed[i]">
            <span class="debug-label">{{ key.split('-').at(-1) }}</span>
          </label>
          <button class="debug-btn" @click="accept(i)">accept()</button>

          <TipBubbleText :ref="el => setRef(i, el)" class="spot" :bubbleKey="key" groupKey="debug-tipbubble-queue"
            direction="left" autoExtend="always" showBubble="always" :display="displayed[i]"
            :text="`Бабл №${i + 1} из очереди`" />
        </div>
      </div>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>бабл</th>
          <th>display</th>
          <th>показан группой</th>
          <th>в очереди</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(key, i) in keys" :key="key">
          <th>{{ key }}</th>
          <td :class="String(displayed[i])">{{ displayed[i] }}</td>
          <td :class="String(group?.displayedBubble === key)">{{ group?.displayedBubble === key }}</td>
          <td :class="String(group?.waitingQueue.includes(key) ?? false)">{{ group?.waitingQueue.includes(key) ??
            false }}</td>
        </tr>
      </tbody>
    </table>

    <EventLog :entries title="Лог переключений видимого бабла в группе" empty="Нажми «Показать все»" @clear="clear" />

    <p class="debug-note">
      Все четыре чекбокса можно включить синхронно — видимым станет только первый, у кого
      <span class="debug-value">mayShowBubble && shouldShowBubble</span> стали истинными. Остальные ждут в
      <span class="debug-value">waitingQueue</span> и получают показ по очереди, когда предыдущий скрывается —
      с небольшой паузой после анимации закрытия (в коде — 400&nbsp;мс,
      <span class="debug-value">GROUP_SWITCH_DELAY</span>). accept() у видимого бабла тоже освобождает очередь.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'
import { debugInfo } from '@/shared/uiKit/tipBubble/useTipBubble'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import { resetBubbleKeys } from '../shared/storage'

type BubbleRef = { accept: () => void } | null

const keys = ['debug-tipbubble-queue-1', 'debug-tipbubble-queue-2', 'debug-tipbubble-queue-3', 'debug-tipbubble-queue-4']
const displayed = ref(keys.map(() => false))
const refs = ref<BubbleRef[]>(keys.map(() => null))

function setRef(i: number, el: unknown) {
  refs.value[i] = el as BubbleRef
}

function accept(i: number) {
  refs.value[i]?.accept()
}

function showAll() {
  displayed.value = keys.map(() => true)
}

function hideAll() {
  displayed.value = keys.map(() => false)
}

function reset() {
  resetBubbleKeys(...keys)
  hideAll()
}

const group = computed(() => debugInfo.value.groups.get('debug-tipbubble-queue'))

const { entries, push, clear } = useEventLog({ max: 50 })
watch(() => group.value?.displayedBubble, (value, old) => {
  if (value === old) return
  push(value ? `показан: ${value}` : 'группа опустела')
})

</script>


<style scoped lang="scss">
.cards {
  gap: 1em 2em;
}

.card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.5em 0.8em;
  background: var(--debug-surface);
  border: 1px solid var(--debug-border);
  border-radius: 6px;
}

.spot {
  position: absolute;
  top: -6px;
  right: -6px;
}
</style>
