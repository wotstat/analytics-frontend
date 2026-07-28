<template>
  <DebugSection title="Запоминание в localStorage" id="local-storage-memory"
    description="accept() пишет accepted: true в localStorage по ключу бабла — после этого бабл больше не должен показываться, даже на новой загрузке страницы. «Пересоздать» ниже эмулирует перезагрузку без реального reload."
    source="src/shared/uiKit/tipBubble/useTipBubble.ts (isAlwaysHidden, useLocalStorage)">

    <div class="debug-row">
      <label class="debug-control">
        <input type="checkbox" v-model="display">
        <span class="debug-label">показать</span>
      </label>
      <button class="debug-btn" @click="bubble?.accept()">accept()</button>
      <button class="debug-btn" @click="remount">Пересоздать (как перезагрузка страницы)</button>
      <button class="debug-btn" @click="reset">Сбросить localStorage</button>
    </div>

    <div class="debug-stage center">
      <div class="anchor" :key="generation">
        <span>цель</span>
        <TipBubbleText ref="bubble" class="spot" bubbleKey="debug-tipbubble-memory" direction="left" autoExtend="always"
          :display text="Нажми «Принять», чтобы бабл больше не показывался" />
      </div>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>alwaysHidden</th>
          <th>accepted</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td :class="String(info?.alwaysHidden)">{{ info?.alwaysHidden ?? '—' }}</td>
          <td>{{ info?.state?.accepted ?? (info?.alwaysHidden ? 'true (state не читался)' : '—') }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      accept() без пересоздания прячет бабл, но сам компонент остаётся смонтированным — просто дальнейшие display()
      /setDisplayed() на нём молча ничего не делают (см. раздел «Императивный API»). Полностью бабл перестаёт
      рендериться (alwaysHidden = true, state не создаётся вовсе) только после пересоздания — потому что
      <span class="debug-value">isAlwaysHidden(key)</span> проверяется один раз в самом начале
      <span class="debug-value">useTipBubble()</span>, до создания реактивного state.
    </p>

    <div class="debug-note duplicate">
      <p>
        <b>Ломаем нарочно: два бабла с одинаковым key.</b> Ниже — два независимых компонента с
        <span class="debug-value">bubbleKey="debug-tipbubble-memory-duplicate"</span> без groupKey. Прими левый —
        правый не изменится, пока оба не будут пересозданы: у каждого экземпляра свой
        <span class="debug-value">useLocalStorage</span>, и `storage`-событие в браузере не долетает до вкладки,
        которая сама же сделала запись.
      </p>

      <div class="debug-row">
        <label class="debug-control">
          <input type="checkbox" v-model="dupDisplay">
          <span class="debug-label">показать оба</span>
        </label>
        <button class="debug-btn" @click="dupLeft?.accept()">accept() слева</button>
        <button class="debug-btn" @click="remountDup">Пересоздать оба</button>
        <button class="debug-btn" @click="resetDup">Сбросить localStorage</button>
      </div>

      <div class="debug-row cards" :key="dupGeneration">
        <div class="anchor">
          <span>левый</span>
          <TipBubbleText ref="dupLeft" class="spot" bubbleKey="debug-tipbubble-memory-duplicate" direction="left"
            autoExtend="always" :display="dupDisplay" text="Левый экземпляр" />
        </div>
        <div class="anchor">
          <span>правый</span>
          <TipBubbleText ref="dupRight" class="spot" bubbleKey="debug-tipbubble-memory-duplicate" direction="left"
            autoExtend="always" :display="dupDisplay" text="Правый экземпляр" />
        </div>
      </div>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'
import { debugInfo } from '@/shared/uiKit/tipBubble/useTipBubble'
import { resetBubbleKeys } from '../shared/storage'

const KEY = 'debug-tipbubble-memory'
const DUP_KEY = 'debug-tipbubble-memory-duplicate'

const display = ref(false)
const generation = ref(0)
const bubble = useTemplateRef<InstanceType<typeof TipBubbleText>>('bubble')

function remount() {
  generation.value++
}

function reset() {
  resetBubbleKeys(KEY)
  display.value = false
  remount()
}

const info = computed(() => debugInfo.value.bubbles.get(KEY))

const dupDisplay = ref(false)
const dupGeneration = ref(0)
const dupLeft = useTemplateRef<InstanceType<typeof TipBubbleText>>('dupLeft')
const dupRight = useTemplateRef<InstanceType<typeof TipBubbleText>>('dupRight')

function remountDup() {
  dupGeneration.value++
}

function resetDup() {
  resetBubbleKeys(DUP_KEY)
  dupDisplay.value = false
  remountDup()
}

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

.cards {
  gap: 1em 2em;
}

.spot {
  position: absolute;
  top: -6px;
  right: -6px;
}

.duplicate {
  display: flex;
  flex-direction: column;
  gap: 0.6em;

  p {
    margin: 0;
  }
}
</style>
