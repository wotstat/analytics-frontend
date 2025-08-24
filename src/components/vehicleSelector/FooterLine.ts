import { TableFooter } from '../tableView/tableView/TableView'


export class FooterLine implements TableFooter {
  readonly root: HTMLElement

  private readonly text: HTMLElement

  constructor() {
    this.root = document.createElement('div')
    this.root.classList.add('footer-line')

    this.text = document.createElement('p')
    this.text.classList.add('footer')
    this.root.appendChild(this.text)
  }

  setTitle(title: string) {
    this.text.textContent = title
  }
}