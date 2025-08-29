import { getHighlightedTextParts, Highlighted } from '@/uiKit/highlightString/highlightUtils'

import { Ref, watch } from 'vue'
import { IndexPath, TableCell } from '../tableView/tableView/TableView'


type LineData = {
  version: string
  extendedTags: string[]
  highlighted: Highlighted
}

export class VersionLine implements TableCell {

  static readonly reusableKey = Symbol('VersionLine')

  readonly root: HTMLElement
  private readonly name: HTMLParagraphElement
  private readonly highlightedName: HTMLParagraphElement

  private currentTag: string | null = null
  private extendedTags: string[] = []
  private index: IndexPath | null = null
  private lines: LineData[] | null = null
  private unwatch: (() => void)

  constructor(private onClick: (tag: string, extendedTags: string[]) => void, private selected: Ref<Set<string>>) {

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

  configure(sectionLines: LineData[], index: IndexPath): void {
    const data = sectionLines[index.row]
    this.currentTag = data.version
    this.extendedTags = data.extendedTags
    this.index = index
    this.lines = sectionLines

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
    this.updateSeparator()
    this.root.setAttribute('data-tag', data.version)
  }

  private onClickListener = () => {
    if (this.currentTag) {
      this.onClick(this.currentTag, this.extendedTags)
    }
  }

  private updateSelectedState(): void {
    if (this.currentTag) {
      const isSelected = this.selected.value.has(this.currentTag)
      this.root.classList.toggle('selected', isSelected)
      this.root.classList.toggle('extended', this.extendedTags.some(tag => this.selected.value.has(tag)))
    }
    this.updateSeparator()
  }

  private updateSeparator(): void {
    if (this.index === null || this.lines === null || this.currentTag === null) return

    const isSelected = this.selected.value.has(this.currentTag)
    const nextSelected = this.selected.value.has(this.lines[this.index.row + 1]?.version)
    const isLastLine = this.index.row === this.lines.length - 1
    const hide = isSelected && !nextSelected || !isSelected && nextSelected
    this.root.classList.toggle('show-separator', !isLastLine && !hide)
  }

  dispose(): void {
    this.root.removeEventListener('click', this.onClickListener)
    this.currentTag = null
    this.highlightedVisible = null
    this.unwatch()
  }
}