<template>
  <ChartAnnotationSettings :groups @toggle="toggleOption" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartAnnotationSettings from '@/shared/ui/chart/ChartAnnotationSettings.vue'
import type { ChartAnnotationGroup } from '@/shared/ui/chart/chartAnnotationSettings'
import type { useHistoryAnnotationSettings } from './useHistoryAnnotationSettings'
import { getHistoryEventRegions, historyEvents } from '@/shared/game/historyEvents'
import type { GameRegion } from '@/shared/game/wot'
import { outageAnnotationColor, versionAnnotationColors } from './historyAnnotations'

const props = defineProps<{
  settings: ReturnType<typeof useHistoryAnnotationSettings>
  regions: readonly GameRegion[]
}>()

const visibleEvents = computed(() => historyEvents.filter(event => getHistoryEventRegions(event, props.regions)?.length !== 0))

const versionOptions = [
  { key: 'showVersions', label: 'Версии', color: versionAnnotationColors.version },
  { key: 'showPatches', label: 'Патчи', color: versionAnnotationColors.patch },
  { key: 'showMicropatches', label: 'Микропатчи', color: versionAnnotationColors.micropatch },
] as const

const groups = computed<ChartAnnotationGroup[]>(() => [
  {
    id: 'versions',
    label: 'Версии игры',
    layout: 'row',
    options: versionOptions.map(option => ({
      id: option.key,
      label: option.label,
      color: option.color,
      selected: props.settings[option.key].value,
    })),
  },
  {
    id: 'events',
    label: 'События',
    options: [
      { id: 'showWotstatOutages', label: 'Недоступность wotstat', color: outageAnnotationColor,
        selected: props.settings.showWotstatOutages.value },
      ...visibleEvents.value.map(event => ({
        id: event.id,
        label: event.label,
        color: event.color,
        selected: props.settings.enabledEvents.value.includes(event.id),
      })),
    ],
  },
])

function toggleOption(groupId: string, optionId: string) {
  if (groupId === 'versions') {
    const option = versionOptions.find(option => option.key === optionId)
    if (option) props.settings[option.key].value = !props.settings[option.key].value
  } else if (optionId === 'showWotstatOutages') {
    props.settings.showWotstatOutages.value = !props.settings.showWotstatOutages.value
  } else {
    props.settings.toggleEvent(optionId)
  }
}
</script>
