<template>
  <DebugSection title="Селектор версии игры" id="version"
    description="Три уровня в одном списке: версия, патч, микропатч. Выбор версии «накрывает» вложенные патчи, а регион зависит от глобального preferredGame."
    source="src/shared/game/selectors/gameVersionSelector/">

    <div class="debug-row">
      <button class="debug-btn" @click="addTags(take(versionTags.versions, 2))">+2 версии</button>
      <button class="debug-btn" @click="addTags(take(versionTags.patches, 5))">+5 патчей</button>
      <button class="debug-btn" @click="addTags(versionTags.versions)">
        все версии ({{ versionTags.versions.length }})
      </button>
      <button class="debug-btn" @click="addTags(versionTags.micro)">
        все микропатчи ({{ versionTags.micro.length }})
      </button>
      <button class="debug-btn" @click="addTags(brokenVersionTags)">+ мусорные теги</button>
    </div>

    <div class="debug-stage">
      <div class="selector-box">
        <p>Версия:</p>
        <GameVersionSelectorBadges v-model="selected" />
      </div>
    </div>

    <SelectionReadout v-model="selected" :total="versionTags.micro.length" />

    <p class="debug-note">
      Формат строки в модели — то, что нарисовал <span class="debug-value">VersionLine</span>:
      <span class="debug-value">1.44</span> для версии, <span class="debug-value">1.44.0</span> для патча и
      <span class="debug-value">1.44.0.1 #1580</span> для микропатча. Из БД приходит
      <span class="debug-value">v.1.44.0.1 #1580</span>, регулярка в
      <span class="debug-value">GameVersionPopup</span> разбирает её на пять чисел и собирает три уровня заново.
    </p>

    <p class="debug-note">
      Логика «накрытия»: выбрал <span class="debug-value">1.44</span> — все его патчи и микропатчи подсвечиваются как
      <span class="debug-value">.extended</span> (синеватый фон, курсор обычный) и <b>перестают выбираться</b>, а уже
      выбранные вложенные молча удаляются из модели. Проверь по выводу выбранного: после клика по версии вложенных
      тегов в наборе быть не должно. Снять «накрытие» можно только сняв саму версию.
    </p>

    <p class="debug-note">
      Регион не спрашивается, а выводится: <span class="debug-value">watch(preferredGame)</span> при открытии ставит
      RU для Lesta и EU для WG, а кнопки региона всегда одиночного выбора (Ctrl/Shift не работают, в отличие от
      фильтров техники). Список регионов захардкожен:
      <span class="debug-value">RU, PT_RU</span> против <span class="debug-value">EU, NA, ASIA, CN, CT</span>. У
      Lesta и WG сейчас разные ветки нумерации (1.44 против 2.3.1) — это не баг данных.
    </p>

    <p class="debug-note">
      Копипаста в <span class="debug-value">GameVersionSelectorBadges</span>: подпись бейджа считается как
      <span class="debug-value">getTankName(tag, true)</span>, то есть строка версии прогоняется через локализацию
      <b>танков</b>, а модель внутри так и называется <span class="debug-value">vehicles</span>. Сегодня это незаметно
      (в версии нет двоеточия, и <span class="debug-value">tankTagToReadable</span> возвращает её как есть), но любой
      танк с тегом-совпадением подменит подпись.
    </p>

    <p class="debug-note">
      «Мусорные теги» — проверка, что несуществующая версия не ломает бейджи: она просто висит в наборе и нигде в
      списке не подсвечена, снять её можно только крестиком на бейдже.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import GameVersionSelectorBadges from '@/shared/game/selectors/gameVersionSelector/GameVersionSelectorBadges.vue'
import SelectionReadout from '../shared/SelectionReadout.vue'
import { brokenVersionTags } from '../shared/fixtures'
import { take, versionTags } from '../shared/lists'

const selected = ref(new Set<string>())

function addTags(tags: readonly string[]) {
  for (const tag of tags) selected.value.add(tag)
}

</script>


<style scoped lang="scss">
.selector-box {
  display: flex;
  align-items: baseline;
  gap: 0.3em;
  max-width: 420px;
  font-size: 18px;
}
</style>
