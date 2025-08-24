
export interface TableElement {
  root: HTMLElement;
}

export interface TableCell extends TableElement { }
export interface TableHeader extends TableElement { }
export interface TableFooter extends TableElement { }

export function isTableElement(obj: Object): obj is TableElement {
  return 'root' in obj
}

export function divWithClass(className: string, parent?: HTMLElement) {
  const div = document.createElement('div')
  div.classList.add(className)
  if (parent) parent.appendChild(div)
  return div
}


