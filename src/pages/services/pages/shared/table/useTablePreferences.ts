import { createSharedComposable, useLocalStorage } from '@vueuse/core'

export const useTablePreferences = createSharedComposable(() => ({
  showValueBars: useLocalStorage('vehicles-table-show-value-bars', false),
  extendedPalette: useLocalStorage('vehicles-table-extended-value-bar-palette', false),
  pinCompared: useLocalStorage('vehicles-table-pin-compared', false),
}))
