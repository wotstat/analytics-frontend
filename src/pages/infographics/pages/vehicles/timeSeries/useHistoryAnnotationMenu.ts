import { ref } from 'vue'
import { checkboxItem, childs, separator, type SimpleContextMenuItem } from '@/shared/uiKit/contextMenu/simpleContextMenu'

export function useHistoryAnnotationMenu(): SimpleContextMenuItem[] {
  const showVersions = ref(false)
  const showPatches = ref(false)
  const showMicropatches = ref(false)
  const showImportantEvents = ref(false)
  const showWotstatOutages = ref(false)

  return [
    childs('Версии', [
      checkboxItem('Версии', showVersions),
      checkboxItem('Патчи', showPatches),
      checkboxItem('Микропатчи', showMicropatches),
    ]),
    separator,
    checkboxItem('Важные события', showImportantEvents),
    checkboxItem('Недоступность wotstat', showWotstatOutages),
  ]
}
