import { type Component, shallowRef, type MaybeRef, ref } from "vue"

export const enum ContextMenuItemVariant {
  Child = "child",
  Separator = "separator",
  Header = "header",
  Button = "button",
}

export type ContextMenuItemSeparator = {
  type: ContextMenuItemVariant.Separator
}

export type ContextMenuItemHeader = {
  type: ContextMenuItemVariant.Header,
  label: string,
}

export type ContextMenuItemButton = {
  type: ContextMenuItemVariant.Button,
  label: string,
  checkbox?: MaybeRef<boolean>,
  icon?: Component,
  disabled?: boolean
  action?: () => void,
}

export type ContextMenuItemChild = {
  type: ContextMenuItemVariant.Child
  label: string,
  icon?: Component,
  disabled?: boolean,
  items: () => ContextMenuItem[]
}


export type ContextMenuItem =
  ContextMenuItemSeparator |
  ContextMenuItemButton |
  ContextMenuItemChild |
  ContextMenuItemHeader

export type ContextMenuOptions = {
  position: {
    x: number,
    y: number,
  } | DOMRect
  closeOnAction?: boolean,
  actionOnPointerUp?: boolean,
  minWidth?: number,
  alignX?: 'left' | 'right' | 'center',
  alignY?: 'normal' | 'bottom'
}

export type ContextMenu = {
  options: ContextMenuOptions,
  items: ContextMenuItem[],
  id: number
}

const defaultOptions: Partial<ContextMenuOptions> = {
  closeOnAction: true,
  actionOnPointerUp: true,
  alignX: 'left',
  alignY: 'normal',
}

export const currentContextMenu = shallowRef<ContextMenu | null>(null)

export function closeContextMenu(id?: number) {
  if (id === undefined) currentContextMenu.value = null
  else if (currentContextMenu.value?.id === id) currentContextMenu.value = null
}

let id = 0
export function createContextMenu(options: ContextMenuOptions, items: ContextMenuItem[]) {

  const optionsWithDefaults: ContextMenuOptions = {
    ...defaultOptions,
    ...options,
  }
  currentContextMenu.value = { options: optionsWithDefaults, items, id: id++ }

  return { close: () => currentContextMenu.value = null, id: currentContextMenu.value.id }
}

export function isContextMenuOpen(id?: number): boolean {
  if (id === undefined) return currentContextMenu.value !== null
  return currentContextMenu.value?.id === id
}

/* Example 

import { useCheckbox } from "./composition"
import { ref, computed } from "vue"

const checkbox = useCheckbox(false)
const option = ref<'a' | 'b' | 'c'>('a')

function items(): ContextMenuItem[] {
  return [
    { type: ContextMenuItemVariant.Button, label: 'Button', disabled: true },
    { type: ContextMenuItemVariant.Separator },
    { type: ContextMenuItemVariant.Header, label: 'Header' },
    { type: ContextMenuItemVariant.Button, label: 'Button', checkbox: checkbox.value, action: checkbox.toggle },
    {
      type: ContextMenuItemVariant.Child,
      label: 'test',
      items: items
    },
    { type: ContextMenuItemVariant.Separator },
    { type: ContextMenuItemVariant.Button, label: 'A', checkbox: computed(() => option.value == 'a'), action: () => option.value = 'a' },
    { type: ContextMenuItemVariant.Button, label: 'B', checkbox: computed(() => option.value == 'b'), action: () => option.value = 'b' },
    { type: ContextMenuItemVariant.Button, label: 'C', checkbox: computed(() => option.value == 'c'), action: () => option.value = 'c' },
    { type: ContextMenuItemVariant.Separator },
  ]
}

setTimeout(() => {
  const close = createContextMenu({ position: { x: 512, y: 512 } }, items())
})

*/
