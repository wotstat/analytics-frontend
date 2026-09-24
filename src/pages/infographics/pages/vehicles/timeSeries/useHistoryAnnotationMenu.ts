import { computed, ref } from 'vue'
import { checkboxItem, childs, separator, type SimpleContextMenuItem } from '@/shared/uiKit/contextMenu/simpleContextMenu'

export type VersionAnnotationVisibility = {
  versions: boolean
  patches: boolean
  micropatches: boolean
}

export function useHistoryAnnotationMenu() {
  const showVersions = ref(false)
  const showPatches = ref(false)
  const showMicropatches = ref(false)
  const showImportantEvents = ref(false)
  const showWotstatOutages = ref(false)

  const menu: SimpleContextMenuItem[] = [
    childs('Версии', [
      checkboxItem('Версии', showVersions),
      checkboxItem('Патчи', showPatches),
      checkboxItem('Микропатчи', showMicropatches),
    ]),
    separator,
    checkboxItem('Важные события', showImportantEvents),
    checkboxItem('Недоступность wotstat', showWotstatOutages),
  ]

  const versions = computed<VersionAnnotationVisibility>(() => ({
    versions: showVersions.value,
    patches: showPatches.value,
    micropatches: showMicropatches.value,
  }))

  return { menu, versions }
}
