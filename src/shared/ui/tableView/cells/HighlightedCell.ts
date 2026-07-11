import './style.scss'
import { getHighlightedTextParts, Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'
import { Config, SelectableCellLine } from '@/shared/uiKit/tableView/tableView/default/SelectableCellLine'

export class HighlightedCellLine extends SelectableCellLine {
  static readonly reusableKey: symbol = Symbol('HighlightedCellLine')

  protected readonly highlightedText: HTMLParagraphElement

  constructor(protected onClick: (cell: SelectableCellLine) => void) {
    super(onClick)

    this.root.classList.add('highlighted-cell-line')

    this.highlightedText = document.createElement('p')
    this.highlightedText.classList.add('highlighted-name-text')
    this.root.appendChild(this.highlightedText)
  }

  protected highlightedVisible: boolean | null = null
  protected setHighlightedVisible(visible: boolean): void {
    if (this.highlightedVisible === visible) return
    this.highlightedVisible = visible
    this.text.style.display = visible ? 'none' : ''
    this.highlightedText.style.display = visible ? '' : 'none'
  }

  override configure(ctx: Config & { highlightedText: Highlighted }): void {
    super.configure({ ...ctx, text: ctx.highlightedText.text })

    this.setHighlightedVisible(ctx.highlightedText.intervals.length > 0)
    if (ctx.highlightedText.intervals.length > 0) {
      const parts = getHighlightedTextParts(ctx.highlightedText.highlightedString)
      this.highlightedText.innerHTML = parts.map(part => {
        if (part.highlight) {
          return `<span class="highlight">${part.text}</span>`
        }
        return part.text
      }).join('')
    }
  }

}