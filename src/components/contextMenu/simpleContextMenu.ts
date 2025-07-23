import { computed, type Component, type MaybeRef, type Ref } from "vue"
import { createContextMenu, type ContextMenuItem, ContextMenuItemVariant, ContextMenuOptions } from "./createContextMenu"


export const separator = Symbol('separator')

type Item = {
  header?: string,
  label?: string,
  checkbox?: MaybeRef<boolean>,
  icon?: Component,
  disabled?: boolean,
  action?: () => void,
  items?: SimpleContextMenuItem[]
}

export type SimpleContextMenuItem = Item | Item[] | typeof separator

export function checkboxItem(label: string, checkbox: { value: MaybeRef<boolean>, toggle: () => void } | Ref<boolean>, icon?: Component): SimpleContextMenuItem {

  if (typeof checkbox === 'object' && 'value' in checkbox && 'toggle' in checkbox)
    return {
      label,
      icon,
      checkbox: checkbox.value,
      action: checkbox.toggle
    }

  return {
    label,
    icon,
    checkbox: checkbox,
    action: () => checkbox.value = !checkbox.value
  }
}

export function childOptions<T extends string>(label: string,
  value: Ref<T>,
  variants: T[] | { key: T, value: string }[], icon?: Component): SimpleContextMenuItem {

  return {
    label,
    icon,
    items: variants.map(variant => {
      const key = typeof variant === 'string' ? variant : variant.key
      const label = typeof variant === 'string' ? variant : variant.value
      return checkboxItem(label, {
        value: computed(() => value.value === key),
        toggle: () => value.value = key
      })
    })
  }
}

export function childButtons<K extends readonly string[]>(lable: string, items: K, action: (key: K[number]) => void): SimpleContextMenuItem {
  return {
    label: lable,
    items: items.map(key => ({
      label: key,
      action: () => action(key)
    }))
  }
}

export function childs(label: string, items: SimpleContextMenuItem[], icon?: Component): SimpleContextMenuItem {
  return { label, icon, items }
}

export function options<T extends PropertyKey>(
  value: Ref<T>,
  variants: T[] | { key: T, label: string }[], icon?: Component) {
  return variants.map(variant => {
    const key = typeof variant === 'object' ? variant.key : variant
    const label = typeof variant === 'object' ? variant.label : String(key)
    return checkboxItem(label, {
      value: computed(() => value.value === key),
      toggle: () => value.value = key
    }, icon)
  })
}

export function header(label: string): SimpleContextMenuItem {
  return { header: label }
}

export function button(label: string, action: () => void, options?: { icon?: Component }): SimpleContextMenuItem {
  return {
    label, icon: options?.icon, action
  }
}

function convertSimpleContextMenuItem(item: SimpleContextMenuItem): ContextMenuItem | ContextMenuItem[] {

  if (item === separator) return ({ type: ContextMenuItemVariant.Separator })

  if (Array.isArray(item)) return item.flatMap(convertSimpleContextMenuItem)

  if (item.header) {
    return {
      type: ContextMenuItemVariant.Header,
      label: item.header
    }
  }

  if (item.items && item.items.length !== 0) {
    return {
      type: ContextMenuItemVariant.Child,
      label: item.label ?? '',
      icon: item.icon,
      disabled: item.disabled,
      items: () => item.items!.flatMap(convertSimpleContextMenuItem)
    }
  }

  return {
    type: ContextMenuItemVariant.Button,
    label: item.label ?? '',
    icon: item.icon,
    disabled: item.disabled,
    checkbox: item.checkbox,
    action: item.action
  }

}

type ContextMenuContext = {
  button: (...args: Parameters<typeof button>) => ContextMenuContext,
  header: (...args: Parameters<typeof header>) => ContextMenuContext,
  separator: () => ContextMenuContext,
  checkboxItem: (...args: Parameters<typeof checkboxItem>) => ContextMenuContext,
  childOptions: (...args: Parameters<typeof childOptions>) => ContextMenuContext,
  childButtons: (...args: Parameters<typeof childButtons>) => ContextMenuContext,
  childs: (label: string, menu: (ctx: ContextMenuContext) => void) => ContextMenuContext,
}

function createSimpleContextMenuContext() {
  let items: SimpleContextMenuItem[] = []

  const ctx: ContextMenuContext = {
    button: (...args) => {
      items.push(button(...args))
      return ctx
    },
    header: (...args) => {
      items.push(header(...args))
      return ctx
    },
    separator: () => {
      items.push(separator)
      return ctx
    },
    checkboxItem: (...args) => {
      items.push(checkboxItem(...args))
      return ctx
    },
    childOptions: (...args) => {
      items.push(childOptions(...args))
      return ctx
    },
    childButtons: (...args) => {
      items.push(childButtons(...args))
      return ctx
    },
    childs: (label: string, menu: (ctx: ContextMenuContext) => void) => {
      const { ctx, items } = createSimpleContextMenuContext()
      menu(ctx)
      items.push(childs(label, items))
      return ctx
    },

  }

  return { items, ctx }
}

export function simpleContextMenu(options: ContextMenuOptions,
  menu: ((ctx: ContextMenuContext) => void) | SimpleContextMenuItem[]) {

  if (Array.isArray(menu))
    return createContextMenu(options, menu.flatMap(convertSimpleContextMenuItem))

  const { ctx, items } = createSimpleContextMenuContext()
  menu(ctx)
  return createContextMenu(options, items.flatMap(convertSimpleContextMenuItem))
}

/* Example
import { useCheckbox } from "./composition"
import { ref } from "vue"

const checkbox = useCheckbox(false)
const option = ref<'a' | 'b' | 'c'>('a')

setTimeout(() => {
  const close = simpleContextMenu({ position: { x: 512, y: 512 }, closeOnAction: false, actionOnPointerUp: true }, [
    button('Button', () => console.log('Button')),
    separator,
    header('Header'),
    checkboxItem('Checkbox', checkbox),
    childs('Childs', [
      button('Button', () => console.log('Button')),
      separator,
      header('Header'),
    ]),
    separator,
    ...options(option, ['a', 'b', 'c']),
    separator,
    childOptions('Childs', option, ['a', 'b', 'c']),
  ])
}, 100)

*/