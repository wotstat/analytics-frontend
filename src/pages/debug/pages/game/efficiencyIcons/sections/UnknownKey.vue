<template>
  <DebugSection title="Неизвестный ключ" id="unknown-key"
    description="Icon.vue ищет компонент в Map по строке 1:1 (iconByName.get). Ключа нет — вернётся undefined, и <component :is='undefined'> ничего не рисует: без фолбэка и без ошибки в консоли."
    source="src/shared/game/efficiencyIcon/Icon.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">свой ключ</span>
        <input type="text" v-model="customKey" placeholder="любая строка">
      </label>
    </div>

    <div class="debug-row">
      <div class="debug-col" v-for="key in cases" :key="key">
        <span class="debug-value">{{ key || '(пусто)' }}</span>
        <div class="debug-stage center unknown-box">
          <Icon :icon="(key as IconType)" class="icon" />
        </div>
      </div>
    </div>

    <p class="debug-note">
      Рамка сцены очерчена нарочно: если внутри пусто — компонент действительно не нашёл иконку. Ни консольной
      ошибки, ни предупреждения Vue при этом не будет, рендер молча пропускается — проверить стоит визуально.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { IconType } from '@/shared/game/efficiencyIcon/utils'

const customKey = ref('totally-unknown-metric')

const cases = computed(() => [customKey.value, 'dmg-total', ''])
</script>


<style scoped lang="scss">
.unknown-box {
  width: 48px;
  height: 48px;
}

.icon {
  width: 28px;
  height: 28px;
}
</style>
