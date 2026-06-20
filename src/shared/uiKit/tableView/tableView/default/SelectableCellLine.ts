import { IndexPath, TableCell } from '../TableView'


export type Config = {
  text?: string,
  selectable?: boolean,
  selected?: boolean,
  index?: IndexPath
}

export class SelectableCellLine implements TableCell {

  static readonly reusableKey: symbol = Symbol('SelectableCellLine')

  readonly root: HTMLButtonElement
  protected readonly text: HTMLElement

  protected selectable: boolean = true
  protected selected: boolean = false
  protected index: IndexPath | null = null

  constructor(protected onClick: (cell: SelectableCellLine) => void) {
    this.root = document.createElement('button')
    this.root.classList.add('cell-line', 'default-line-style', 'selectable')

    this.text = document.createElement('p')
    this.root.appendChild(this.text)

    this.root.addEventListener('click', this.onClickListener.bind(this))
  }

  protected onClickListener() {
    if (!this.selectable) return
    this.onClick(this)
  }

  configure(ctx: Config) {
    if (ctx.text !== undefined) this.setText(ctx.text)
    if (ctx.selectable !== undefined) this.setSelectable(ctx.selectable)
    if (ctx.selected !== undefined) this.setSelected(ctx.selected)
    if (ctx.index !== undefined) this.setIndex(ctx.index)
  }

  setText(title: string) {
    this.text.textContent = title
  }

  setSelectable(selectable: boolean) {
    this.selectable = selectable
    this.root.classList.toggle('selectable', selectable)
  }

  setIndex(index: IndexPath | null) {
    this.index = index
  }

  get isSelectable() {
    return this.selectable
  }

  set isSelectable(value: boolean) {
    this.setSelectable(value)
  }

  setSelected(selected: boolean) {
    this.selected = selected
    this.root.classList.toggle('selected', selected)
  }

  get isSelected() {
    return this.selected
  }

  set isSelected(value: boolean) {
    this.setSelected(value)
  }

  get indexPath() {
    return this.index
  }
}