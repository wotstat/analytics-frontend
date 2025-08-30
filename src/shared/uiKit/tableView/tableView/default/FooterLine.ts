import { TableFooter } from '../TableView'


export class FooterLine implements TableFooter {

  static readonly reusableKey = Symbol('FooterLine')

  readonly root: HTMLElement

  private readonly text: HTMLElement

  constructor() {
    this.root = document.createElement('div')
    this.root.classList.add('footer-line', 'default-line-style')

    this.text = document.createElement('p')
    this.text.classList.add('footer')
    this.root.appendChild(this.text)
  }

  setTitle(title: string) {
    this.text.textContent = title
  }
}