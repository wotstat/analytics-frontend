<template>
  <DebugSection title="newFeatureBadge" id="new-feature-badge"
    source="src/shared/uiKit/newFeatureBadge/newFeatureBadge.ts"
    description="Директива v-new-feature-badge переключает класс по состоянию в localStorage; отметить просмотренным можно вызовом setFeatureVisit или модификаторами .hover/.click.">

    <p class="debug-note">
      Директива не рисует бейдж сама — только вешает или снимает CSS-класс new-feature-badge на элементе, саму плашку
      «NEW» рисует CSS потребителя (см. Header.vue). Здесь стиль плашки продублирован локально, иначе показывать
      нечего.
    </p>

    <p class="debug-note">
      Список фич — закрытый набор строк прямо в файле директивы, свой ключ для песочницы не завести. Ниже используется
      настоящий ключ onslaught-general — тот же, что помечает вкладку «Общее» на странице Натиска. Состояние на входе
      в секцию сохраняется и возвращается кнопкой «восстановить как было» и автоматически при уходе со страницы, чтобы
      демо не подкрутило настоящий бейдж на сайте.
    </p>

    <div class="debug-row">
      <button class="debug-btn" @click="setFeatureVisit(feature, false)">пометить новым (сброс)</button>
      <button class="debug-btn" @click="setFeatureVisit(feature, true)">отметить просмотренным</button>
      <button class="debug-btn" @click="restore">восстановить как было</button>
    </div>

    <div class="debug-stage center short">
      <span class="demo-target" v-new-feature-badge.hover.click="feature">Натиск — вкладка «Общее»</span>
    </div>

    <p class="debug-hint">
      featureState('{{ feature }}'):
      <span class="debug-value" :class="visited ? 'true' : 'false'">{{ visited ? 'просмотрено' : 'новое' }}</span>
    </p>

    <p class="debug-note">
      Модификаторы .hover и .click рабочие (наведи или кликни по плашке выше — состояние переключится), но в реальном
      коде сейчас не используются нигде: боевой код помечает фичи явным вызовом setFeatureVisit при заходе на
      страницу, а не через директиву на ссылке. Так, ключ onslaught-general (используемый выше) помечается в
      onslaught/general/General.vue, а onslaught/Layout.vue тем же способом помечает другой ключ — onslaught.
    </p>

    <p class="debug-note">
      Состояние живёт в localStorage под ключом visited-features (Map, сериализуется через useLocalStorage из VueUse)
      — это не состояние компонента, а модульный синглтон поверх localStorage, поэтому оно переживает перезагрузку
      вкладки без какого-либо кода на этой странице.
    </p>

    <p class="debug-note">
      Отдельно: при самом первом визите на сайт (по ключу new-feature-already-visit) все известные фичи молча
      помечаются просмотренными сразу — чтобы новый пользователь не увидел стену старых плашек «NEW». На этой странице
      это уже случилось раньше, поэтому пронаблюдать сам момент бутстрапа тут нельзя.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { onUnmounted } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { featureState, setFeatureVisit, vNewFeatureBadge } from '@/shared/uiKit/newFeatureBadge/newFeatureBadge'

const feature = 'onslaught-general' as const
const visited = featureState(feature)
const initialVisited = visited.value

function restore() {
  setFeatureVisit(feature, initialVisited)
}

onUnmounted(restore)

</script>


<style scoped lang="scss">
.demo-target {
  position: relative;
  padding: 0.4em 0.9em;
  border: 1px solid var(--debug-border-strong);
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;

  &.new-feature-badge::after {
    content: 'NEW';
    position: absolute;
    top: -0.6em;
    right: -0.6em;
    background: var(--blue-color);
    border-radius: 20px;
    padding: 1px 5px;
    line-height: 1.4;
    font-size: 10px;
    font-weight: bold;
  }
}
</style>
