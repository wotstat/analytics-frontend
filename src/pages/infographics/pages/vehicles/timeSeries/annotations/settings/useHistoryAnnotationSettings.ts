import { computed, ref, type Ref } from 'vue'

export type VersionAnnotationVisibility = {
  versions: boolean
  patches: boolean
  micropatches: boolean
}

export type HistoryAnnotationState = {
  showVersions: boolean
  showPatches: boolean
  showMicropatches: boolean
  showWotstatOutages: boolean
  enabledEvents: string[]
}

export function createHistoryAnnotationState(): HistoryAnnotationState {
  return { showVersions: false, showPatches: false, showMicropatches: false, showWotstatOutages: false, enabledEvents: [] }
}

export function useHistoryAnnotationSettings(state: Ref<HistoryAnnotationState> = ref(createHistoryAnnotationState())) {
  function field<K extends keyof HistoryAnnotationState>(key: K) {
    return computed({
      get: () => state.value[key],
      set: (value: HistoryAnnotationState[K]) => { state.value = { ...state.value, [key]: value } },
    })
  }
  const showVersions = field('showVersions')
  const showPatches = field('showPatches')
  const showMicropatches = field('showMicropatches')
  const showWotstatOutages = field('showWotstatOutages')
  const enabledEvents = field('enabledEvents')

  function toggleEvent(id: string) {
    if (!enabledEvents.value.includes(id)) enabledEvents.value = [...enabledEvents.value, id]
    else enabledEvents.value = enabledEvents.value.filter(value => value !== id)

  }

  const versions = computed<VersionAnnotationVisibility>(() => ({
    versions: showVersions.value,
    patches: showPatches.value,
    micropatches: showMicropatches.value,
  }))

  return { showVersions, showPatches, showMicropatches, showWotstatOutages, enabledEvents, toggleEvent, versions }
}
