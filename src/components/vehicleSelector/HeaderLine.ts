import { TableHeader } from '../tableView/tableView/TableView'


export class HeaderLine implements TableHeader {

  static readonly reusableKey = Symbol('HeaderLine')

  readonly root: HTMLElement

  private readonly header: HTMLElement

  constructor() {
    this.root = document.createElement('div')
    this.root.classList.add('header-line')

    this.header = document.createElement('h5')
    this.header.classList.add('header')
    this.root.appendChild(this.header)
  }

  setTitle(title: string) {
    this.header.textContent = title
  }
}