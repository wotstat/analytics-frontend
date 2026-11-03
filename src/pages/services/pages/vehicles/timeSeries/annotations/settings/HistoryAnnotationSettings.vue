<template>
  <ChartAnnotationSettings :groups @toggle="toggleOption" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartAnnotationSettings from '@/shared/ui/chart/timeSeries/toolbar/annotationSettings/ChartAnnotationSettings.vue'
import type { ChartAnnotationGroup, ChartAnnotationOption } from '@/shared/ui/chart/timeSeries/toolbar/annotationSettings/chartAnnotationSettings'
import type { useHistoryAnnotationSettings } from './useHistoryAnnotationSettings'
import { getHistoryEventRegions, historyEvents } from '@/shared/game/domain/historyEvents'
import type { GameRegion } from '@/shared/game/domain/wot'
import { useHistoryEventStyles } from '../events/useHistoryEventStyles'

useHistoryEventStyles()

const props = withDefaults(defineProps<{
  settings: ReturnType<typeof useHistoryAnnotationSettings>
  regions: readonly GameRegion[]
  showOutages?: boolean
}>(), { showOutages: true })

const visibleEvents = computed(() => historyEvents.filter(event => getHistoryEventRegions(event, props.regions)?.length !== 0))

const versionOptions = [
  { key: 'showVersions', label: 'Версии', classes: 'annotation-version' },
  { key: 'showPatches', label: 'Патчи', classes: 'annotation-patch' },
  { key: 'showMicropatches', label: 'Микропатчи', classes: 'annotation-micropatch' },
] as const

const eventOptions = computed(() => {
  const options: ChartAnnotationOption[] = visibleEvents.value.map(event => ({
    id: event.id,
    label: event.label,
    classes: ['history-event', `annotation-${event.id}`],
    selected: props.settings.enabledEvents.value.includes(event.id),
  }))

  if (props.showOutages) options.unshift({
    id: 'showWotstatOutages',
    label: 'Недоступность wotstat',
    classes: 'annotation-outage',
    selected: props.settings.showWotstatOutages.value,
  })

  return options
})

const groups = computed<ChartAnnotationGroup[]>(() => [
  {
    id: 'versions',
    label: 'Версии игры',
    layout: 'row',
    options: versionOptions.map(option => ({
      id: option.key,
      label: option.label,
      classes: option.classes,
      selected: props.settings[option.key].value,
    })),
  },
  {
    id: 'events',
    label: 'События',
    options: eventOptions.value,
  },
])

function toggleOption(groupId: string, optionId: string) {
  if (groupId === 'versions') {
    const option = versionOptions.find(option => option.key === optionId)
    if (option) props.settings[option.key].value = !props.settings[option.key].value
    return
  }

  if (optionId === 'showWotstatOutages') {
    props.settings.showWotstatOutages.value = !props.settings.showWotstatOutages.value
    return
  }

  props.settings.toggleEvent(optionId)
}
</script>

<style lang="scss">
@use '../historyAnnotationStyles.scss' as *;

.annotation-option {
  @include history-annotation-styles;
}
</style>
