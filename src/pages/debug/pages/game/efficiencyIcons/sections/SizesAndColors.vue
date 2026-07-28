<template>
  <DebugSection title="Размер и цвет" id="sizes-colors"
    description="SVG рисуются с fill=currentColor и без width/height — размер и цвет задаются снаружи через CSS на самом Icon (см. использование class='icon' в реальных местах), а не пропами. Заливка должна меняться вместе с color, а не быть запечена в файле."
    source="src/shared/game/efficiencyIcon/assets/dmg.svg">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">размер</span>
        <input type="range" min="16" max="96" v-model.number="size">
        <span class="debug-value">{{ size }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">цвет</span>
        <input type="color" v-model="color">
      </label>

      <button class="debug-btn swatch" v-for="preset in presets" :key="preset" @click="color = preset"
        :style="{ background: preset }" :class="{ active: color === preset }" />
    </div>

    <div class="debug-stage">
      <div class="row">
        <Icon v-for="key in sample" :key="key" :icon="key" class="icon" :style="{ width: size + 'px', color }" />
      </div>
    </div>

    <p class="debug-hint">Иконки без цвета/размера снаружи выйдут родным 32×32 и текущим text-color страницы.</p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { IconType } from '@/shared/game/efficiencyIcon/utils'

const size = ref(40)
const color = ref('#4fa3ff')
const presets = ['#4fa3ff', '#4caf50', '#ff6b6b', '#ffffff', '#ffb020']

const sample: IconType[] = ['dmg', 'kill', 'assist', 'block', 'xp', 'top1', 'battles', 'win']
</script>


<style scoped lang="scss">
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75em;
  align-items: center;
}

.swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 50%;
}
</style>
