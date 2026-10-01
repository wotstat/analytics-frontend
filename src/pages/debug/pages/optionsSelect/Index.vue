<template>
  <DebugPage title="OptionsSelect" description="Контекстное меню на компьютере и нативный select на сенсорных устройствах."
    source="src/shared/ui/optionsSelect/OptionsSelect.vue">
    <DebugSection title="Выбор и состояния" id="options-select-states"
      description="Оба селектора связаны одной моделью. Изменение одного сразу обновляет второй."
      source="src/shared/ui/optionsSelect/OptionsSelect.vue">
      <div class="debug-row">
        <label class="debug-control"><input v-model="disabled" type="checkbox">Заблокировать</label>
        <label class="debug-control"><input v-model="empty" type="checkbox">Пустой список</label>
        <label class="debug-control"><input v-model="mounted" type="checkbox">Показывать селекторы</label>
      </div>
      <div class="debug-stage center short">
        <div v-if="mounted" class="examples">
          <OptionsSelect v-model="view" :options="visibleOptions" :disabled />
          <OptionsSelect v-model="view" :options="visibleOptions" :disabled class="compact" />
        </div>
      </div>
      <p class="debug-hint">Значение: {{ view }}.</p>
      <p class="debug-note">С мышью открывается контекстное меню с галочкой; на сенсорном устройстве — системный
        список. Недоступный пункт нельзя выбрать. При смене устройства, блокировке или удалении селектора меню закрывается.</p>
      <p class="debug-note">Меню открывается при нажатии кнопки мыши: зажмите кнопку селектора, наведите на пункт
        и отпустите для выбора. Повторное нажатие на открытый селектор закрывает меню, даже если отпускать медленно.</p>
    </DebugSection>

    <DebugSection title="Числовые значения" id="options-select-numbers"
      description="Нативный select должен сохранять числовой тип модели, включая ноль."
      source="src/shared/ui/optionsSelect/OptionsSelect.vue">
      <div class="debug-stage center short">
        <OptionsSelect v-model="count" :options="numberOptions" />
      </div>
      <p class="debug-hint">Значение: {{ count }}. Тип: {{ typeof count }}.</p>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import OptionsSelect from '@/shared/ui/optionsSelect/OptionsSelect.vue'

const variants = [
  { value: 'list', label: 'Список' },
  { value: 'groups', label: 'Группы' },
  { value: 'archive', label: 'Архив (недоступен)', disabled: true },
] as const
const numberOptions = [
  { value: 0, label: 'Без ограничения' },
  { value: 20, label: '20 строк' },
  { value: 50, label: '50 строк' },
] as const
const view = ref<typeof variants[number]['value']>('list')
const count = ref<number>(0)
const disabled = ref(false)
const empty = ref(false)
const mounted = ref(true)
const visibleOptions = computed(() => empty.value ? [] : variants)
</script>

<style scoped lang="scss">
.examples {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compact {
  --options-select-height: 22px;
  --options-select-font-size: 12px;
}
</style>
