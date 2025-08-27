import { getHighlightedTextParts, Highlighted } from '../highlightString/highlightUtils'

import { Ref, watch } from 'vue'
import { TableCell } from '../tableView/tableView/TableView'


type LineData = {
  version: string
  highlighted: Highlighted
}

export class VersionLine implements TableCell {

  static readonly reusableKey = Symbol('VersionLine')

  readonly root: HTMLElement
  private readonly name: HTMLParagraphElement
  private readonly highlightedName: HTMLParagraphElement

  private currentTag: string | null = null
  private unwatch: (() => void)

  constructor(private onClick: (tag: string) => void, private selected: Ref<Set<string>>) {

    this.root = document.createElement('div')
    this.root.classList.add('line')

    this.name = document.createElement('p')
    this.name.classList.add('name-text')
    this.root.appendChild(this.name)

    this.highlightedName = document.createElement('p')
    this.highlightedName.classList.add('highlighted-name-text')
    this.root.appendChild(this.highlightedName)

    this.root.addEventListener('click', this.onClickListener)

    this.unwatch = watch(() => selected.value, () => this.updateSelectedState(), { immediate: true, deep: true })
  }

  private highlightedVisible: boolean | null = null
  private setHighlightedVisible(visible: boolean): void {
    if (this.highlightedVisible === visible) return
    this.highlightedVisible = visible
    this.name.style.display = visible ? 'none' : ''
    this.highlightedName.style.display = visible ? '' : 'none'
  }

  configure(data: LineData): void {
    this.currentTag = data.version
    this.name.textContent = data.highlighted.text

    this.setHighlightedVisible(data.highlighted.intervals.length > 0)
    if (data.highlighted.intervals.length > 0) {
      const parts = getHighlightedTextParts(data.highlighted.highlightedString)
      this.highlightedName.innerHTML = parts.map(part => {
        if (part.highlight) {
          return `<span class="highlight">${part.text}</span>`
        }
        return part.text
      }).join('')
    }

    this.updateSelectedState()
    this.root.setAttribute('data-tag', data.version)
  }

  private onClickListener = () => {
    if (this.currentTag) {
      this.onClick(this.currentTag)
    }
  }

  private updateSelectedState(): void {
    if (this.currentTag) {
      const isSelected = this.selected.value.has(this.currentTag)
      this.root.classList.toggle('selected', isSelected)
    }
  }

  dispose(): void {
    this.root.removeEventListener('click', this.onClickListener)
    this.currentTag = null
    this.highlightedVisible = null
    this.unwatch()
  }
}