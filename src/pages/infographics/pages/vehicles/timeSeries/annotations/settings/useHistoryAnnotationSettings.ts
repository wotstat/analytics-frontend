import { computed, ref } from 'vue'

export type VersionAnnotationVisibility = {
  versions: boolean
  patches: boolean
  micropatches: boolean
}

export function useHistoryAnnotationSettings() {
  const showVersions = ref(false)
  const showPatches = ref(false)
  const showMicropatches = ref(false)
  const showWotstatOutages = ref(false)
  const enabledEvents = ref<string[]>([])

  function toggleEvent(id: string) {
    enabledEvents.value = enabledEvents.value.includes(id)
      ? enabledEvents.value.filter(value => value !== id) : [...enabledEvents.value, id]
  }

  const versions = computed<VersionAnnotationVisibility>(() => ({
    versions: showVersions.value,
    patches: showPatches.value,
    micropatches: showMicropatches.value,
  }))

  return { showVersions, showPatches, showMicropatches, showWotstatOutages, enabledEvents, toggleEvent, versions }
}
