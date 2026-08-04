<template>
  <DebugSection title="Селектор версии игры" id="version"
    description="Три уровня в одном списке: версия, патч, микропатч. Модель хранит объекты версии, а режим withRegion управляет тем, входит ли регион в выбор."
    source="src/shared/game/selectors/gameVersionSelector/">

    <div class="debug-row">
      <button class="debug-btn" @click="addTags(take(currentVersionTags.versions, 2))">+2 версии</button>
      <button class="debug-btn" @click="addTags(take(currentVersionTags.patches, 5))">+5 патчей</button>
      <button class="debug-btn" @click="addTags(currentVersionTags.versions)">
        все версии ({{ currentVersionTags.versions.length }})
      </button>
      <button class="debug-btn" @click="addTags(currentVersionTags.micro)">
        все микропатчи ({{ currentVersionTags.micro.length }})
      </button>
      <button class="debug-btn" @click="addTags(brokenVersionTags.map(version => ({ version })))">+ мусорные теги</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">withRegion</span>
        <input type="checkbox" v-model="withRegion">
      </label>

      <label class="debug-control">
        <span class="debug-label">showVersions</span>
        <input type="checkbox" v-model="showVersions">
      </label>

      <label class="debug-control">
        <span class="debug-label">showPatches</span>
        <input type="checkbox" v-model="showPatches">
      </label>

      <label class="debug-control">
        <span class="debug-label">showMinor</span>
        <input type="checkbox" v-model="showMinor">
      </label>
    </div>

    <div class="debug-stage">
      <div class="selector-box">
        <p>Версия:</p>
        <GameVersionSelectorBadges v-model="selected" :with-region="withRegion" :show-versions="showVersions"
          :show-patches="showPatches" :show-minor="showMinor" />
      </div>
    </div>

    <SelectionReadout v-model="selected" :tag-to-key="versionToKey" :tag-to-text="versionToText" />

    <p class="debug-note">
      Входной список содержит <span class="debug-value">{ region, version }</span>, где версия выглядит как
      <span class="debug-value">v.1.44.0.1 #1580</span>. Регулярка в
      <span class="debug-value">GameVersionPopup</span> разбирает её и собирает три уровня:
      <span class="debug-value">1.44</span>, <span class="debug-value">1.44.0</span> и
      <span class="debug-value">1.44.0.1 #1580</span>.
    </p>

    <p class="debug-note">
      Логика «накрытия» осталась иерархической: выбранная версия блокирует вложенные патчи и микропатчи, а выбор
      вложенного уровня удаляет уже выбранные строки, которые он накрывает. Снятие верхнего выбора снова делает
      вложенные строки доступными.
    </p>

    <p class="debug-note">
      При <span class="debug-value">withRegion=false</span> регион не входит в идентичность: попап сразу приводит
      модель к объектам вида <span class="debug-value">{ version }</span>. При
      <span class="debug-value">withRegion=true</span> в модель попадают объекты с регионом, а одинаковые версии в
      разных регионах выбираются независимо. Ключ составляется в <span class="debug-value">utils.ts</span> через
      нулевой разделитель, поэтому он не смешивается с текстом версии.
    </p>

    <p class="debug-note">
      Подпись бейджа теперь строится явно: без региона это версия, с регионом —
      <span class="debug-value">[RU] 1.44</span>. Кнопки Lesta/WG меняют глобальный
      <span class="debug-value">preferredGame</span> и набор доступных регионов; регион внутри выбранного объекта
      от этого сам не меняется.
    </p>

    <p class="debug-note">
      Переключатели <span class="debug-value">showVersions</span>,
      <span class="debug-value">showPatches</span> и <span class="debug-value">showMinor</span> управляют только
      секциями попапа. Выключи все три: список данных не пуст, но таблица показывает состояние «Ничего не найдено».
      «Мусорные теги» остаются в модели и снимаются крестиком на бейдже, даже если соответствующая секция скрыта.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import GameVersionSelectorBadges from '@/shared/game/selectors/gameVersionSelector/GameVersionSelectorBadges.vue'
import type { OptionalRegionVersion } from '@/shared/game/selectors/gameVersionSelector/utils.ts'
import { versionToKey } from '@/shared/game/selectors/gameVersionSelector/utils.ts'
import SelectionReadout from '../shared/SelectionReadout.vue'
import { brokenVersionTags } from '../shared/fixtures'
import { take, versionSelections, versionTags } from '../shared/lists'

const selected = ref(new Set<OptionalRegionVersion>())
const withRegion = ref(false)
const showVersions = ref(true)
const showPatches = ref(true)
const showMinor = ref(true)

const currentVersionTags = computed(() => {
  if (withRegion.value) return versionSelections.value

  return {
    versions: versionTags.value.versions.map(version => ({ version })),
    patches: versionTags.value.patches.map(version => ({ version })),
    micro: versionTags.value.micro.map(version => ({ version })),
  }
})

function addTags(tags: readonly OptionalRegionVersion[]) {
  for (const tag of tags) {
    if ([...selected.value].some(selectedTag => versionToKey(selectedTag) === versionToKey(tag))) continue
    selected.value.add(tag)
  }
}

function versionToText({ region, version }: OptionalRegionVersion) {
  return region ? `[${region}] ${version}` : version
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
