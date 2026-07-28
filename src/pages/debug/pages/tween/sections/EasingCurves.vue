<template>
  <DebugSection title="Кривые easing" id="easing"
    description="Один и тот же прогон 0→100 запущен на всех кривых в один момент — сравнивай на глаз, кто ускоряется, кто тормозит, кто перелетает цель. Справа от трека — форма самой функции на [0,1]."
    source="src/shared/ui/tween/easing.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="trigger">{{ atEnd ? 'Назад к 0' : 'Вперёд к 100' }}</button>

      <label class="debug-control">
        <span class="debug-label">duration</span>
        <input type="range" min="200" max="4000" step="100" v-model.number="duration">
        <span class="debug-value">{{ duration }}</span>
      </label>

      <span class="debug-hint">штрихпунктир на графике — linear, для сравнения формы</span>
    </div>

    <div class="curves-grid">
      <div class="curve-row" v-for="row in rows" :key="row.key">
        <span class="key debug-value">{{ row.key }}</span>

        <div class="track">
          <div class="dot" :style="{ left: `${row.pos.value}%` }"></div>
        </div>

        <EasingCurveSvg :fn="easing[row.key]" />
      </div>
    </div>

    <p class="debug-note">
      <span class="debug-value">options.easing: null</span> в Tween.to() подставляет ту же identity-функцию
      <span class="debug-value">x =&gt; x</span>, что и ключ <span class="debug-value">linear</span> — отдельной строки
      для null в таблице нет смысла, результат идентичен.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { easing } from '@/shared/ui/tween/easing'
import { Tween } from '@/shared/ui/tween/useTweenRef'
import EasingCurveSvg from '../shared/EasingCurveSvg.vue'

const duration = ref(1500)
const atEnd = ref(false)

const rows = (Object.keys(easing) as (keyof typeof easing)[]).map(key => {
  const pos = ref(0)
  const tween = new Tween({ get: () => pos.value, set: v => pos.value = v })
  return { key, pos, tween }
})

function trigger() {
  atEnd.value = !atEnd.value
  const target = atEnd.value ? 100 : 0
  for (const row of rows) row.tween.to(target, { duration: duration.value, easing: row.key, minStep: 0 })
}

onUnmounted(() => {
  for (const row of rows) row.tween.dispose()
})
</script>


<style scoped lang="scss">
.curves-grid {
  display: flex;
  flex-direction: column;
  gap: 0.35em;
}

.curve-row {
  display: grid;
  grid-template-columns: 7em 1fr 8em;
  align-items: center;
  gap: 0.75em;

  .key {
    font-size: 11px;
  }
}

.track {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: var(--debug-surface);
  border: 1px solid var(--debug-border);
}

.dot {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--blue-color);
  transform: translate(-50%, -50%);
}
</style>
