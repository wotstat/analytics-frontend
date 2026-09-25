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
  const showImportantEvents = ref(false)
  const showWotstatOutages = ref(false)

  const versions = computed<VersionAnnotationVisibility>(() => ({
    versions: showVersions.value,
    patches: showPatches.value,
    micropatches: showMicropatches.value,
  }))

  return { showVersions, showPatches, showMicropatches, showImportantEvents, showWotstatOutages, versions }
}
