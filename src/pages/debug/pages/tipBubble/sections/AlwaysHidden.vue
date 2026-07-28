<template>
  <DebugSection title="isAlwaysHidden: принятый бабл" id="always-hidden"
    description="Принятый бабл больше не показывается никогда. Но проверка делается один раз при вызове useTipBubble, поэтому нажми «Принять» — и увидишь, что бабл на месте до пересоздания."
    source="src/shared/uiKit/tipBubble/useTipBubble.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="accept">Принять</button>
      <button class="debug-btn" @click="wrong">Ошибка</button>
      <button class="debug-btn" @click="remount">Пересоздать</button>
      <button class="debug-btn" @click="reset">Сбросить хранилище</button>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>что</th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>accepted — живое состояние</th>
          <td :class="accepted.toString()">{{ accepted }}</td>
        </tr>
        <tr>
          <th>isAlwaysHidden на момент монтирования</th>
          <td :class="hiddenAtMount.toString()">{{ hiddenAtMount }}</td>
        </tr>
        <tr>
          <th>бабл в DOM</th>
          <td :class="(!hiddenAtMount).toString()">{{ hiddenAtMount ? 'нет, EmptyComponent' : 'да' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-stage center short" :key="generation">
      <div class="cell">
        <TipBubbleText ref="bubble" :bubbleKey="bubbleKey" text="Приму и исчезну" :display="true" />
        <span class="debug-value">цель</span>
      </div>
    </div>

    <p class="debug-note">
      Порядок такой: «Принять» → живой <span class="debug-value">accepted</span> стал true, а бабл ещё виден, потому
      что снимок при монтировании остался false → «Пересоздать» → снимок пересчитался и на месте бабла
      <span class="debug-value">EmptyComponent</span>. То есть на боевой странице принятая подсказка исчезнет только
      при следующем монтировании компонента, а не в момент принятия.
    </p>

    <p class="debug-note">
      «Ошибка» (<span class="debug-value">wrong</span>) наоборот копит счётчики и через политику autoExtend возвращает
      подсказку — см. секцию про autoExtend.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'
import { debugInfo, isAlwaysHidden } from '@/shared/uiKit/tipBubble/useTipBubble'
import { useTemplateRef, ref, computed } from 'vue'
import { resetBubbleKeys } from '../shared/storage'

const bubbleKey = 'debug-always-hidden'
const bubble = useTemplateRef<InstanceType<typeof TipBubbleText>>('bubble')
const generation = ref(0)

const accepted = computed(() => debugInfo.value.bubbles.get(bubbleKey)?.state?.accepted === true)
const hiddenAtMount = ref(isAlwaysHidden(bubbleKey))

function accept() {
  bubble.value?.accept()
}

function wrong() {
  bubble.value?.wrong()
}

function remount() {
  hiddenAtMount.value = isAlwaysHidden(bubbleKey)
  generation.value += 1
}

function reset() {
  resetBubbleKeys(bubbleKey)
  remount()
}

</script>


<style scoped lang="scss">
.cell {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.3em 0.5em;
  border: 1px solid #ffffff20;
  border-radius: 4px;
}
</style>
