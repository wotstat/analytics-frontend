import { TableHeader } from '../TableView'


export class HeaderLine implements TableHeader {

  static readonly reusableKey = Symbol('HeaderLine')

  readonly root: HTMLElement

  private readonly text: HTMLElement

  constructor() {
    this.root = document.createElement('div')
    this.root.classList.add('header-line', 'default-line-style')

    this.text = document.createElement('h5')
    this.text.classList.add('header')
    this.root.appendChild(this.text)
  }

  setTitle(title: string) {
    this.text.textContent = title
  }
}