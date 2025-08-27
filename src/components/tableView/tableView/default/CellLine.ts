import { TableCell } from '../TableView'


export class CellLine implements TableCell {

  static readonly reusableKey = Symbol('CellLine')

  readonly root: HTMLElement

  private readonly text: HTMLElement

  constructor() {
    this.root = document.createElement('div')
    this.root.classList.add('cell-line', 'default-line-style')

    this.text = document.createElement('p')
    this.root.appendChild(this.text)
  }

  setText(title: string) {
    this.text.textContent = title
  }
}