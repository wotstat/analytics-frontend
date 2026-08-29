<template>
  <DebugSection title="Все навыки" id="skills"
    description="Полный набор SKILL_TAGS. Подпись приходит из ClickHouse (ArtefactsLocalizationDictionary) через getComp7SkillName, а не из локального i18n.json — до загрузки данных или для неизвестного тега вернётся сырой tag."
    source="src/shared/game/comp7/skill/SkillIcon.vue">

    <div class="debug-row">
      <GameSelect v-model="game" />
      <SeasonSelect v-model="season" />
      <label class="debug-control">
        <span class="debug-label">размер</span>
        <input type="range" min="24" max="96" v-model.number="sizePx">
        <span class="debug-value">{{ sizePx }}px</span>
      </label>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 110px">
      <div class="card" v-for="tag in SKILL_TAGS" :key="tag">
        <div class="debug-stage center">
          <SkillIcon :skill="tag" :game :season :style="{ width: sizePx + 'px' }" />
        </div>
        <div class="caption">
          <span class="debug-hint">{{ getComp7SkillName(tag) }}</span>
          <span class="debug-value">{{ tag }}</span>
        </div>
      </div>
    </div>

    <div class="debug-col">
      <span class="debug-label">неизвестный навык</span>
      <div class="debug-row">
        <div class="debug-stage center unknown">
          <SkillIcon :skill="unknownTag" :game :season style="width: 56px" />
        </div>
        <span class="debug-hint">getComp7SkillName: «{{ getComp7SkillName(unknownTag) }}»</span>
      </div>
    </div>

    <p class="debug-note">
      SkillIcon не принимает size — размер задаётся контейнером/CSS (width: 100% + aspect-ratio 1/1). skill принимает
      произвольную строку (SkillTag | string), поэтому неизвестный тег не ломает типы, но картинка не грузится:
      фолбэка-заглушки для навыков нет, будет битое изображение.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import SkillIcon from '@/shared/game/comp7/skill/SkillIcon.vue'
import { SKILL_TAGS, getComp7SkillName } from '@/shared/game/comp7/utils'
import { GameVendor } from '@/shared/game/wot'
import GameSelect from '../shared/GameSelect.vue'
import SeasonSelect from '../shared/SeasonSelect.vue'

const game = ref<GameVendor>('mt')
const season = ref('latest')
const sizePx = ref(48)

const unknownTag = 'comp7_unknown_skill'
</script>


<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.5em;
  background: var(--debug-surface);
}

.caption {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  font-size: 12px;
}

.unknown {
  width: 72px;
  height: 72px;
}
</style>
