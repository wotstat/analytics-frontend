<template>
  <DebugSection title="Типы техники" id="types" source="src/shared/game/vehicles/type/VehicleType.vue"
    description="LT/MT/HT/AT/SPG плюс алиасы полными именами; что рисуется вместо неизвестного типа.">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">размер</span>
        <input type="range" min="12" max="80" v-model.number="size">
        <span class="debug-value">{{ size }}px</span>
      </label>
      <label class="debug-control">
        <span class="debug-label">цвет (currentColor)</span>
        <input type="color" v-model="color">
      </label>
    </div>

    <div class="debug-row" :style="{ color }">
      <div class="cell" v-for="type in vehicleTypes" :key="type">
        <VehicleType :type :style="{ width: size + 'px', height: size + 'px' }" />
        <p class="debug-value">{{ type }}</p>
      </div>
      <div class="cell">
        <VehicleType type="any" :style="{ width: size + 'px', height: size + 'px' }" />
        <p class="debug-value">any</p>
      </div>
    </div>

    <p class="debug-hint">
      Алиасы полными именами (<span class="debug-value">mediumtank</span>, <span class="debug-value">lighttank</span>
      и т.д.) ведут на те же svg, что и буквенные коды — отдельно не показываю.
    </p>

    <div class="debug-col">
      <p class="debug-label">сломать нарочно</p>
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">type</span>
          <input type="text" v-model="customType">
        </label>
      </div>

      <div class="debug-stage center short">
        <VehicleType :type="(customType as VehicleTypeProp)" style="width: 60px; height: 60px" />
      </div>

      <p class="debug-note">
        <span class="debug-value">vehicleTypeName[type] || vehicleTypeName['any']</span> — любая строка вне словаря
        тихо уезжает на <span class="debug-value">vehicle-types.svg</span>. Это не «иконка неизвестного типа», а
        отдельная декоративная композиция «все типы сразу»: 76×77 против 18×18 у остальных и полупрозрачные заливки
        вместо сплошной заливки — при одинаковом <span class="debug-value">width/height</span> она выглядит заметно
        тоньше и с другими пропорциями. В боевом коде (<span class="debug-value">VehicleTable.vue</span>) от этого
        защищаются заранее: <span class="debug-value">isVehicleType(type) ? type : 'any'</span> перед передачей в
        компонент — сам компонент это не форсирует.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import type { VehicleType as VehicleTypeProp } from '@/shared/game/vehicles/type/vehicleTypeToImage'

const vehicleTypes = ['HT', 'MT', 'LT', 'AT', 'SPG'] as const

const size = ref(32)
const color = ref('#0a84ff')
const customType = ref('ufo')
</script>


<style scoped lang="scss">
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3em;
}
</style>
