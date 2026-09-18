<template>
  <DebugPage
    title="BackgroundRoot"
    description="Обычный fade и переход, в котором фон и картинка танка анимируются отдельно."
    source="src/shared/uiKit/pageBackground/"
  >
    <DebugSection
      title="Смена фона"
      description="Переключайте варианты подряд: уходящий слой остаётся до завершения своей анимации."
      source="src/pages/debug/pages/pageBackground/TankBackground.vue"
    >
      <div class="debug-row">
        <button class="debug-btn" :class="{ active: selected === 'none' }" @click="selected = 'none'">Без фона</button>
        <button class="debug-btn" :class="{ active: selected === 'fade' }" @click="selected = 'fade'">Обычный fade</button>
        <button class="debug-btn" :class="{ active: selected === 'tank' }" @click="selected = 'tank'">Выезд танка</button>
      </div>

      <p class="debug-note">
        В режиме «Выезд танка» движение SVG задано CSS прямо в TankBackground.vue.
        При включённом системном «Уменьшении движения» анимации пропускаются.
      </p>

      <DefineBackground
        v-if="selected !== 'none'"
        :component="selected === 'tank' ? TankBackground : FadeBackground"
      />
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DefineBackground from '@/shared/uiKit/pageBackground/DefineBackground.vue'
import FadeBackground from './FadeBackground.vue'
import TankBackground from './TankBackground.vue'

const selected = ref<'none' | 'fade' | 'tank'>('none')
</script>
