let root: HTMLElement | null = null

export function getPopoverRoot() {
  if (root?.isConnected) return root

  root = document.createElement('div')
  root.id = 'popover-root'
  document.body.appendChild(root)

  return root
}
