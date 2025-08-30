import { closeContextMenu, isContextMenuOpen } from '@/components/uiKit/contextMenu/createContextMenu'
import { checkboxItem, simpleContextMenu } from '@/components/uiKit/contextMenu/simpleContextMenu'
import { useLocalStorage } from '@vueuse/core'

export const show3dEffect = useLocalStorage('card-hover-3d-effect', true)
export const showGlowEffect = useLocalStorage('card-hover-glow-effect', true)

let contextMenuId = -1
export function showContextMenu(element: HTMLElement) {

  if (isContextMenuOpen(contextMenuId)) {
    closeContextMenu(contextMenuId)
    return
  }

  const { id } = simpleContextMenu({
    position: element.getBoundingClientRect(),
    closeOnAction: false,
    alignY: 'bottom'
  },
    [
      checkboxItem('3D эффект', show3dEffect),
      checkboxItem('Эффект блика', showGlowEffect),
    ]
  )

  contextMenuId = id
}