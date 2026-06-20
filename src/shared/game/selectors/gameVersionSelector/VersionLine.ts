import { Ref, watch } from 'vue'
import { Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'
import { HighlightedCellLine } from '@/shared/ui/tableView/cells/HighlightedCell'

type LineData = {
  version: string
  extendedTags: string[]
  highlighted: Highlighted
}

export class VersionLine extends HighlightedCellLine {
  static readonly reusableKey: symbol = Symbol('VersionLine')

  private currentTag: string | null = null
  private extendedTags: string[] = []

  private unwatch: (() => void)

  constructor(private onClickToVersion: (tag: string, extendedTags: string[]) => void, private selectedSet: Ref<Set<string>>) {
    super()
    this.unwatch = watch(() => selectedSet.value, () => this.updateSelectedState(), { immediate: true, deep: true })
  }

  configureVersion(data: LineData): void {
    this.currentTag = data.version
    this.extendedTags = data.extendedTags

    super.configure({ text: data.highlighted.text, highlightedText: data.highlighted })
    this.updateSelectedState()
  }

  protected setExtended(extended: boolean): void {
    this.root.classList.toggle('extended', extended)
  }

  private updateSelectedState(): void {
    if (this.currentTag) {
      const isSelected = this.selectedSet.value.has(this.currentTag)
      this.setSelected(isSelected)
      this.setExtended(this.extendedTags.some(tag => this.selectedSet.value.has(tag)))
    }
  }

  protected onClickListener() {
    super.onClickListener()
    if (this.currentTag) this.onClickToVersion(this.currentTag, this.extendedTags)
  }

  dispose(): void {
    this.currentTag = null
    this.highlightedVisible = null
    this.unwatch()
  }
}