<template>
  <DebugSection title="Уровни" id="levels" source="src/shared/game/vehicles/VehicleLevel.vue"
    description="Римские цифры I–XI, ширина двузначных (X, XI) в узкой ячейке; поведение за пределами игровых уровней.">

    <div class="debug-row">
      <div class="cell" v-for="level in 11" :key="level">
        <div class="debug-stage center narrow">
          <VehicleLevel :level />
        </div>
        <p class="debug-value">{{ level }}</p>
      </div>
    </div>

    <p class="debug-hint">
      Ячейка нарочно узкая (28px) — X и XI (два символа) должны помещаться без переноса и без выхода за границы,
      наравне с однозначными I–IX.
    </p>

    <div class="debug-col">
      <p class="debug-label">сломать нарочно</p>
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">level</span>
          <input type="number" v-model.number="customLevel">
        </label>
        <div class="debug-row">
          <button class="debug-btn" @click="customLevel = 0">0</button>
          <button class="debug-btn" @click="customLevel = -3">-3</button>
          <button class="debug-btn" @click="customLevel = 12">12</button>
          <button class="debug-btn" @click="customLevel = 3999">3999</button>
          <button class="debug-btn" @click="customLevel = 4000">4000</button>
        </div>
      </div>

      <div class="debug-stage center short">
        <VehicleLevel :level="customLevel" />
      </div>

      <p class="debug-note">
        <span class="debug-value">romanNumberProcessor</span> ограничен только диапазоном 1–3999 (стандартные
        границы римской записи) — он ничего не знает про игровые уровни 1–11. При <span class="debug-value">level
          &lt; 1</span> или <span class="debug-value">&gt; 3999</span> возвращается обычное число как строка
        (<span class="debug-value">value.toString()</span>), без каких-либо признаков ошибки.
        В игре уровней выше XI не бывает, так что реальный код в этот фолбэк не попадает.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehicleLevel from '@/shared/game/vehicles/VehicleLevel.vue'

const customLevel = ref(12)
</script>


<style scoped lang="scss">
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3em;
}

.debug-stage.narrow {
  width: 28px;
  min-height: 0;
  padding: 0.3em 0;
}
</style>
