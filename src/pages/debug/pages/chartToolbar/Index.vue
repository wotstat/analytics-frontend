<template>
  <DebugPage title="ChartToolbar"
    description="Явная композиция групп выбора и действий, плотность и настройки аннотаций без запросов к БД."
    source="src/shared/ui/chart/timeSeries/toolbar/layout/ChartToolbar.vue">
    <DebugSection title="Обычная плотность и слоты" id="standard"
      description="Левая часть задаётся потребителем; дополнительные действия остаются рядом с выбором сглаживания."
      source="src/shared/ui/chart/timeSeries/toolbar/layout/ChartToolbar.vue">
      <div class="debug-row">
        <label class="debug-control"><input v-model="narrow" type="checkbox"><span>Ширина 320 px</span></label>
        <label class="debug-control"><input v-model="showEvents" type="checkbox"><span>Показывать группу событий</span></label>
      </div>
      <div class="toolbar-stage" :class="{ narrow }">
        <ChartToolbar>
          <template #left>
            <h3>Сравнение</h3>
            <select v-model="metric">
              <option>Количество</option>
              <option>Среднее значение</option>
            </select>
          </template>
          <ToolbarOptions v-model="comparisonStep" :options="stepOptions" />
          <ToolbarOptions v-model="comparisonAverage" :options="averageOptions" clearable />
          <ToolbarGroup>
            <ToolbarButton :icon="ResetIcon" @click="resetComparison" />
            <ChartAnnotationSettings :groups="visibleComparisonGroups"
              @toggle="(groupId, optionId) => toggleOption(comparisonGroups, groupId, optionId)" />
          </ToolbarGroup>
        </ChartToolbar>
      </div>
      <p class="debug-hint">Сравнение: {{ comparisonStep }}, среднее {{ comparisonAverage ?? 'выключено' }}.
        Сбросов: {{ resets }}.</p>
      <p class="debug-note">В меню есть горизонтальная и вертикальная группы, длинная подпись и недоступная опция.
        Скрытие группы сохраняет выбор; подсветка кнопки учитывает только видимые опции. Пустая группа не выводится.</p>
    </DebugSection>

    <DebugSection title="Компактные строки с общими моделями" id="synchronized"
      description="Шаг и сглаживание общие у двух строк. Настройки аннотаций у каждой строки свои; сравнение выше независимо."
      source="src/shared/ui/chart/timeSeries/toolbar/layout/ChartToolbar.vue">
      <div v-for="(groups, index) in rowGroups" :key="index" class="toolbar-stage">
        <div class="row-heading">Строка {{ index + 1 }}</div>
        <ChartToolbar density="compact">
          <ToolbarOptions v-model="rowStep" :options="stepOptions" />
          <ToolbarOptions v-model="rowAverage" :options="averageOptions" clearable />
          <ToolbarGroup>
            <ChartAnnotationSettings :groups @toggle="(groupId, optionId) => toggleOption(groups, groupId, optionId)" />
          </ToolbarGroup>
        </ChartToolbar>
      </div>
      <p class="debug-hint">Обе строки: {{ rowStep }}, среднее {{ rowAverage ?? 'выключено' }}.</p>
      <p class="debug-note">Выбери день, неделю и месяц в разных строках, затем avg3/avg5/avg7.
        Повторный клик выключает среднее в обеих строках. Настройки сравнения выше не меняются.</p>
    </DebugSection>

    <DebugSection title="Произвольный состав групп" id="custom"
      description="У общего toolbar нет встроенных шагов и окон среднего. Группы могут скрываться, а пустой список выбора не создаёт разделитель."
      source="src/shared/ui/chart/timeSeries/toolbar/options/ToolbarOptions.vue">
      <div class="debug-row">
        <label class="debug-control"><input v-model="optionsDisabled" type="checkbox"><span>Заблокировать выбор</span></label>
        <label class="debug-control"><input v-model="showLimit" type="checkbox"><span>Показывать лимит</span></label>
        <label class="debug-control"><input v-model="showActions" type="checkbox"><span>Показывать действия</span></label>
      </div>
      <div class="toolbar-stage" :class="{ narrow }">
        <ChartToolbar>
          <ToolbarOptions v-model="displayMode" :options="modeOptions" :disabled="optionsDisabled" />
          <ToolbarOptions v-if="showLimit" v-model="limit" :options="limitOptions" clearable :disabled="optionsDisabled" />
          <ToolbarOptions v-model="limit" :options="[]" clearable />
          <ToolbarGroup v-if="showActions">
            <ToolbarButton :icon="ResetIcon" @click="limit = null" />
          </ToolbarGroup>
        </ChartToolbar>
      </div>
      <p class="debug-hint">Представление: {{ displayMode }}. Лимит: {{ limit ?? 'не выбран' }}.</p>
      <p class="debug-note">Повторный клик выбранного представления сохраняет его;
        повторный клик лимита снимает выбор. «Все» имеет значение 0 и отличается от null.
        У недоступного варианта и заблокированных групп модель не меняется.
        После скрытия групп разделители остаются только между соседними видимыми группами.</p>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ResetIcon from '@/assets/icons/reset.svg'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ChartToolbar from '@/shared/ui/chart/timeSeries/toolbar/layout/ChartToolbar.vue'
import ToolbarOptions from '@/shared/ui/chart/timeSeries/toolbar/options/ToolbarOptions.vue'
import ToolbarGroup from '@/shared/ui/chart/timeSeries/toolbar/layout/ToolbarGroup.vue'
import ChartAnnotationSettings from '@/shared/ui/chart/timeSeries/toolbar/annotationSettings/ChartAnnotationSettings.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import type { ChartAnnotationGroup } from '@/shared/ui/chart/timeSeries/toolbar/annotationSettings/chartAnnotationSettings'
import type { ToolbarOption } from '@/shared/ui/chart/timeSeries/toolbar/options/toolbarOptions'

type DemoStep = 'day' | 'week' | 'month'
type DemoAverage = 3 | 5 | 7 | null
type DisplayMode = 'count' | 'percent' | 'detail'

const narrow = ref(false)
const showEvents = ref(true)
const metric = ref('Количество')
const comparisonStep = ref<DemoStep>('day')
const comparisonAverage = ref<DemoAverage>(null)
const rowStep = ref<DemoStep>('day')
const rowAverage = ref<DemoAverage>(null)
const resets = ref(0)
const optionsDisabled = ref(false)
const showLimit = ref(true)
const showActions = ref(true)
const displayMode = ref<DisplayMode>('count')
const limit = ref<0 | 25 | 50 | null>(null)

const stepOptions = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const satisfies readonly ToolbarOption<DemoStep>[]
const averageOptions = ([3, 5, 7] as const).map(value => ({
  value,
  label: `avg${value}`,
  tooltip: `Скользящее среднее по ${value} соседним точкам. Повторное нажатие выключает сглаживание`,
})) satisfies readonly ToolbarOption<NonNullable<DemoAverage>>[]
const modeOptions = [
  { value: 'count', label: 'Количество' },
  { value: 'percent', label: 'Доля' },
  { value: 'detail', label: 'Детально', disabled: true },
] as const satisfies readonly ToolbarOption<DisplayMode>[]
const limitOptions = [
  { value: 0, label: 'Все' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
] as const satisfies readonly ToolbarOption<NonNullable<typeof limit.value>>[]

function createGroups(): ChartAnnotationGroup[] {
  return [
    { id: 'periods', label: 'Периоды', layout: 'row', options: [
      { id: 'start', label: 'Начало', classes: 'demo-annotation-start', selected: false },
      { id: 'changes', label: 'Изменения', classes: 'demo-annotation-changes', selected: false },
      { id: 'pauses', label: 'Паузы', classes: 'demo-annotation-pauses', selected: false },
    ] },
    { id: 'events', label: 'События', options: [
      { id: 'maintenance', label: 'Плановое обслуживание', classes: 'demo-annotation-maintenance', selected: false },
      { id: 'calculation', label: 'Изменение способа расчёта с длинной подписью', classes: 'demo-annotation-calculation', selected: false },
      { id: 'unavailable', label: 'Недоступная опция', selected: false, disabled: true },
    ] },
    { id: 'empty', label: 'Пустая группа', options: [] },
  ]
}

const comparisonGroups = reactive(createGroups())
const rowGroups = reactive([createGroups(), createGroups()])
const visibleComparisonGroups = computed(() => comparisonGroups.filter(group => showEvents.value || group.id !== 'events'))

function toggleOption(groups: ChartAnnotationGroup[], groupId: string, optionId: string) {
  const option = groups.find(group => group.id === groupId)?.options.find(option => option.id === optionId)
  if (option) option.selected = !option.selected
}

function resetComparison() {
  resets.value++
  comparisonStep.value = 'day'
  comparisonAverage.value = null
  for (const group of comparisonGroups) {
    for (const option of group.options) option.selected = false
  }
}
</script>

<style scoped lang="scss">
.toolbar-stage {
  box-sizing: border-box;
  max-width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;

  &.narrow {
    width: 320px;
  }

  h3 {
    margin: 0;
    font-size: 18px;
  }

  select {
    margin-left: 10px;
  }

  .row-heading {
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>

<style lang="scss">
// Пункты меню находятся в телепортированной панели.
.annotation-option {
  &.demo-annotation-start {
    --selection-tile-accent: var(--demo-annotation-start-accent, #fbbb4a);
  }

  &.demo-annotation-changes {
    --selection-tile-accent: var(--demo-annotation-changes-accent, #a9cbef);
  }

  &.demo-annotation-pauses {
    --selection-tile-accent: var(--demo-annotation-pauses-accent, #fff);
  }

  &.demo-annotation-maintenance {
    --selection-tile-accent: var(--demo-annotation-maintenance-accent, #f44f3d);
  }

  &.demo-annotation-calculation {
    --selection-tile-accent: var(--demo-annotation-calculation-accent, #b2e297);
  }
}
</style>
