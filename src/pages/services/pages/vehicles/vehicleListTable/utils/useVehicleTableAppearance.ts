import { createSharedComposable, useLocalStorage } from '@vueuse/core'

export const useVehicleTableAppearance = createSharedComposable(() => ({
  showValueBars: useLocalStorage('vehicles-table-show-value-bars', false),
  extendedPalette: useLocalStorage('vehicles-table-extended-value-bar-palette', false),
}))
