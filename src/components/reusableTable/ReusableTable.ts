import './reusableTable.scss'

export interface ReusableTableCell {
  root: HTMLElement;
}

export interface ReusableTableDelegate {
  overscan?: number,
  // cellConstructor?: () => ReusableTableCell<Data>

  heightForIndex: (table: ReusableTable, index: number) => number
  numberOfRows: (table: ReusableTable) => number
  cellForIndex: (table: ReusableTable, index: number) => ReusableTableCell
}

function divWithClass(className: string, parent?: HTMLElement) {
  const div = document.createElement('div')
  div.classList.add(className)
  if (parent) parent.appendChild(div)
  return div
}

type CellElementEntry = { element: ReusableTableCell, index: number, top: number, bottom: number }
type Interval = [from: number, to: number]

export class ReusableTable {

  private readonly scroll: HTMLElement
  private readonly content: HTMLElement
  private readonly wrapper: HTMLElement

  private updateHandle: ReturnType<typeof requestAnimationFrame> | null = null

  private totalHeight: number = 0
  private cellsHeight: number[] = []
  private cellsTop: number[] = []

  constructor(
    private readonly root: HTMLElement,
    private readonly delegate: ReusableTableDelegate,) {

    this.root.classList.add('reusable-table-root')

    this.scroll = divWithClass('scroll', this.root)
    this.content = divWithClass('content', this.scroll)
    this.wrapper = divWithClass('wrapper', this.content)

    this.scroll.addEventListener('scroll', this.onScroll.bind(this), { passive: true })

    this.dataDidUpdate()
  }

  private scheduleUpdate() {
    if (this.updateHandle) return
    this.updateHandle = requestAnimationFrame(this.updateScroll.bind(this))
  }

  private getFirstIndexBefore(scrollTop: number): number {
    const numberOfRows = this.delegate.numberOfRows(this)
    for (let i = 0; i < numberOfRows; i++) {
      if (this.cellsTop[i] + this.cellsHeight[i] > scrollTop) return i
    }

    return numberOfRows - 1
  }

  private getFirstIndexAfter(scrollBottom: number): number {
    const numberOfRows = this.delegate.numberOfRows(this)
    for (let i = 0; i < numberOfRows; i++) {
      if (this.cellsTop[i] > scrollBottom) return i
    }
    return numberOfRows - 1
  }

  private getCellTop(index: number): number {
    return this.cellsTop[index] || 0
  }

  private visibleCells: CellElementEntry[] = []
  private currentInterval: Interval = [-1, -1]

  private updateScroll() {
    this.updateHandle = null
    const scrollHeight = this.scroll.clientHeight
    const scrollTop = this.scroll.scrollTop
    const scrollBottom = scrollTop + scrollHeight


    const firstIndex = this.getFirstIndexBefore(scrollTop)
    const lastIndex = this.getFirstIndexAfter(scrollBottom)


    if (firstIndex === -1 || lastIndex === -1) return
    if (this.currentInterval[0] === firstIndex && this.currentInterval[1] === lastIndex) return

    let remove: number[] = []

    for (let i = this.currentInterval[0]; i < firstIndex && i <= this.currentInterval[1]; i++) remove.push(i)
    for (let i = Math.max(lastIndex + 1, this.currentInterval[0]); i <= this.currentInterval[1]; i++) remove.push(i)

    // console.log(`upd: [${this.currentInterval[0]}, ${this.currentInterval[1]}] -> [${firstIndex}, ${lastIndex}], remove: [${remove.join(', ')}]`)

    const removeElements = this.visibleCells.filter((cell) => remove.includes(cell.index))
    this.visibleCells = this.visibleCells.filter((cell) => !remove.includes(cell.index))


    for (const element of removeElements) this.wrapper.removeChild(element.element.root)

    for (let i = Math.max(this.currentInterval[1] + 1, firstIndex); i <= lastIndex; i++) {
      const element = this.delegate.cellForIndex(this, i)
      this.wrapper.appendChild(element.root)
      const top = this.getCellTop(i)
      const height = this.delegate.heightForIndex(this, i)
      this.visibleCells.push({
        element,
        index: i,
        top,
        bottom: top + height
      })
    }

    for (let i = Math.min(this.currentInterval[0] - 1, lastIndex); i >= firstIndex; i--) {
      const element = this.delegate.cellForIndex(this, i)
      this.wrapper.insertBefore(element.root, this.wrapper.firstChild)
      const top = this.getCellTop(i)
      const height = this.delegate.heightForIndex(this, i)
      this.visibleCells.unshift({
        element,
        index: i,
        top,
        bottom: top + height
      })
    }
    this.wrapper.style.transform = `translateY(${this.getCellTop(firstIndex)}px)`
    this.currentInterval = [firstIndex, lastIndex]

  }

  private onScroll(ev: Event) {
    this.scheduleUpdate()
  }

  private recalculateTotalHeight() {
    let totalHeight = 0
    const numberOfRows = this.delegate.numberOfRows(this)
    for (let i = 0; i < numberOfRows; i++) {
      this.cellsHeight[i] = this.delegate.heightForIndex(this, i)
      this.cellsTop[i] = totalHeight
      totalHeight += this.cellsHeight[i]
    }

    this.totalHeight = totalHeight
    this.content.style.height = `${totalHeight}px`
    this.scheduleUpdate()
  }

  dataDidUpdate() {
    this.currentInterval = [-1, -1]
    for (const element of this.visibleCells) this.wrapper.removeChild(element.element.root)
    this.visibleCells = []
    this.recalculateTotalHeight()
  }

  dispose() {
    this.root.removeChild(this.scroll)
    if (this.updateHandle) cancelAnimationFrame(this.updateHandle)
  }
}