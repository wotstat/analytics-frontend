import './reusableTable.scss'

export interface ReusableTableElement {
  root: HTMLElement;
}

export interface ReusableTableCell extends ReusableTableElement { }
export interface ReusableTableHeader extends ReusableTableElement { }
export interface ReusableTableFooter extends ReusableTableElement { }

type IndexPath = { section: number, row: number }
export interface ReusableTableDelegate {
  overscan?: number,

  numberOfSections: (table: ReusableTable) => number
  numberOfRowsInSection: (table: ReusableTable, section: number) => number

  heightForCellByIndex: (table: ReusableTable, index: IndexPath) => number
  cellForIndex: (table: ReusableTable, index: IndexPath) => ReusableTableCell


  heightForHeaderInSection?: (table: ReusableTable, section: number) => number | null
  headerCellForSection?: (table: ReusableTable, section: number) => ReusableTableHeader | null

  heightForFooterInSection?: (table: ReusableTable, section: number) => number | null
  footerCellForSection?: (table: ReusableTable, section: number) => ReusableTableFooter | null
}


class Section {

  root: HTMLElement
  headerContainer: HTMLElement
  footerContainer: HTMLElement
  contentContainer: HTMLElement
  index: number | null = null

  constructor() {
    this.root = document.createElement('div')
    this.root.classList.add('section')

    this.headerContainer = document.createElement('div')
    this.headerContainer.classList.add('header-container')
    this.root.appendChild(this.headerContainer)

    this.footerContainer = document.createElement('div')
    this.footerContainer.classList.add('footer-container')
    this.root.appendChild(this.footerContainer)

    this.contentContainer = document.createElement('div')
    this.contentContainer.classList.add('content-container')
    this.root.appendChild(this.contentContainer)

    console.log('Generate')
  }

  setup(index: number,
    headerHeight: number,
    footerHeight: number,
    firstElementHeight: number,
    lastElementHeight: number,
    contentHeight: number) {
    const totalHeight = headerHeight + footerHeight + contentHeight

    this.root.style.height = `${totalHeight}px`
    this.root.style.paddingTop = `${headerHeight}px`

    this.headerContainer.style.height = `${totalHeight - footerHeight - firstElementHeight}px`
    this.footerContainer.style.height = `${totalHeight - headerHeight - lastElementHeight}px`

    if (this.index !== index) {
      this.index = index
      this.root.className = `section section-${index}`
    }
  }
}
function divWithClass(className: string, parent?: HTMLElement) {
  const div = document.createElement('div')
  div.classList.add(className)
  if (parent) parent.appendChild(div)
  return div
}

type Interval = [from: number, to: number]

function intervalEqual(interval1: Interval, interval2: Interval) {
  return interval1[0] === interval2[0] && interval1[1] === interval2[1]
}

export class ReusableTable {

  private readonly scroll: HTMLElement
  private readonly content: HTMLElement
  private readonly wrapper: HTMLElement

  private updateHandle: ReturnType<typeof requestAnimationFrame> | null = null

  private totalHeight: number = 0
  private cellsHeight: number[] = []
  private rowsTopOffset: number[] = []

  private sectionCellsHeight: number[] = []
  private headersHeight: number[] = []
  private footersHeight: number[] = []
  private sectionTopOffset: number[] = []

  private rowsCountBySection: number[] = []
  private rowIndexOffsetBySection: number[] = []
  private indexPathForRowOffset: IndexPath[] = []


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

  private rowIndex(section: number, rowInSection: number) {
    if (rowInSection >= 0) return this.rowIndexOffsetBySection[section] + rowInSection
    return this.rowIndexOffsetBySection[section] + this.rowsCountBySection[section] + rowInSection
  }

  private scheduleUpdate() {
    if (this.updateHandle) return
    this.updateHandle = requestAnimationFrame(this.updateScroll.bind(this))
  }

  sectionsInterval: Interval = [-1, -1]
  rowsInterval: Interval = [-1, -1]
  private getVisibleSectionsInterval(top: number, bottom: number): Interval {
    let firstIndexBefore = -1
    let lastIndexAfter = -1

    for (let i = 0; i < this.sectionCellsHeight.length; i++) {
      const sectionHeight = this.sectionCellsHeight[i] + this.headersHeight[i] + this.footersHeight[i]
      if (sectionHeight + this.sectionTopOffset[i] > top && firstIndexBefore === -1) firstIndexBefore = i
      if (sectionHeight + this.sectionTopOffset[i] > bottom && lastIndexAfter === -1) lastIndexAfter = i
    }

    return [
      firstIndexBefore === -1 ? (this.sectionCellsHeight.length - 1) : firstIndexBefore,
      lastIndexAfter === -1 ? (this.sectionCellsHeight.length - 1) : lastIndexAfter
    ]
  }

  private getVisibleRowsInterval(top: number, bottom: number): Interval {
    let firstIndexBefore = -1
    let lastIndexAfter = -1

    for (let i = 0; i <= this.rowsTopOffset.length; i++) {
      if (this.rowsTopOffset[i] + this.cellsHeight[i] > top && firstIndexBefore === -1) firstIndexBefore = i
      if (this.rowsTopOffset[i] > bottom && lastIndexAfter === -1) lastIndexAfter = i - 1
    }

    return [
      firstIndexBefore === -1 ? (this.rowsTopOffset.length - 1) : firstIndexBefore,
      lastIndexAfter === -1 ? (this.rowsTopOffset.length - 1) : lastIndexAfter
    ]
  }

  private visibleCells: ReusableTableCell[] = []
  private visibleSections: Section[] = []
  private visibleHeaders: ReusableTableHeader[] = []
  private visibleFooters: ReusableTableFooter[] = []
  private readonly mayReuseSections = new Set<Section>()

  private updateScroll() {
    this.updateHandle = null
    const scrollHeight = this.scroll.clientHeight
    const scrollTop = this.scroll.scrollTop
    const scrollBottom = scrollTop + scrollHeight

    const sectionsInterval = this.getVisibleSectionsInterval(scrollTop, scrollBottom)
    const rowsInterval = this.getVisibleRowsInterval(scrollTop, scrollBottom)

    this.wrapper.style.paddingTop = `${this.sectionTopOffset[sectionsInterval[0]]}px`

    const sectionsToOffsetUpdate = new Set<number>()

    const setupSection = (section: Section, index: number) => {
      section.setup(
        index,
        this.headersHeight[index],
        this.footersHeight[index],
        this.cellsHeight[this.rowIndex(index, 0)],
        this.cellsHeight[this.rowIndex(index, -1)],
        this.sectionCellsHeight[index]
      )

      const headerElement = this.delegate.headerCellForSection?.(this, index)
      const footerElement = this.delegate.footerCellForSection?.(this, index)

      if (headerElement) section.headerContainer.appendChild(headerElement.root)
      if (footerElement) section.footerContainer.appendChild(footerElement.root)
    }

    if (!intervalEqual(this.rowsInterval, rowsInterval)) {
      const from = this.rowsInterval
      const to = rowsInterval

      const shouldRemove = new Set<[number, ReusableTableCell]>()

      for (let i = from[0]; i < to[0] && i <= from[1] && i != -1; i++) shouldRemove.add([i, this.visibleCells[i - from[0]]])
      for (let i = Math.max(to[1] + 1, from[0]); i <= from[1] && i != -1; i++) shouldRemove.add([i, this.visibleCells[i - from[0]]])

      this.visibleCells = this.visibleCells.filter((cell, i) => i >= to[0] - from[0] && i <= to[1] - from[0])

      for (const [index, cell] of shouldRemove) {
        const path = this.indexPathForRowOffset[index]
        const section = this.visibleSections[path.section - this.sectionsInterval[0]]
        section.contentContainer.removeChild(cell.root)
        sectionsToOffsetUpdate.add(path.section)
      }
    }

    if (!intervalEqual(this.sectionsInterval, sectionsInterval)) {

      const from = this.sectionsInterval
      const to = sectionsInterval

      const cleanupSection = new Set<Section>()
      for (let i = from[0]; i < to[0] && i <= from[1] && i != -1; i++) cleanupSection.add(this.visibleSections[i - from[0]])
      for (let i = Math.max(to[1] + 1, from[0]); i <= from[1] && i != -1; i++) cleanupSection.add(this.visibleSections[i - from[0]])

      this.visibleSections = this.visibleSections.filter((section) => !cleanupSection.has(section))
      for (const element of cleanupSection) {
        this.mayReuseSections.add(element)
        // element.
        this.wrapper.removeChild(element.root)
      }

      const reuse = this.mayReuseSections.values()
      for (let i = Math.min(from[0] - 1, to[1]); i >= to[0]; i--) {
        const section = reuse.next().value ?? new Section()
        setupSection(section, i)
        this.visibleSections.unshift(section)
        this.wrapper.insertBefore(section.root, this.wrapper.firstChild)
      }

      for (let i = Math.max(from[1] + 1, to[0]); i <= to[1]; i++) {
        const section = reuse.next().value ?? new Section()
        setupSection(section, i)
        this.visibleSections.push(section)
        this.wrapper.appendChild(section.root)
      }

      for (const element of this.visibleSections) this.mayReuseSections.delete(element)
      this.sectionsInterval = sectionsInterval
    }

    if (!intervalEqual(this.rowsInterval, rowsInterval)) {
      const from = this.rowsInterval
      const to = rowsInterval

      for (let i = Math.min(from[0] - 1, to[1]); i >= to[0]; i--) {
        const indexPath = this.indexPathForRowOffset[i]
        const section = this.visibleSections[indexPath.section - this.sectionsInterval[0]]
        const cell = this.delegate.cellForIndex(this, indexPath)
        this.visibleCells.unshift(cell)
        section.contentContainer.insertBefore(cell.root, section.contentContainer.firstChild)
        sectionsToOffsetUpdate.add(indexPath.section)
      }

      for (let i = Math.max(from[1] + 1, to[0]); i <= to[1]; i++) {
        const indexPath = this.indexPathForRowOffset[i]
        const section = this.visibleSections[indexPath.section - this.sectionsInterval[0]]
        const cell = this.delegate.cellForIndex(this, indexPath)
        this.visibleCells.push(cell)
        section.contentContainer.appendChild(cell.root)
        sectionsToOffsetUpdate.add(indexPath.section)
      }
    }


    this.rowsInterval = rowsInterval

    for (const section of this.visibleSections) {
      const sectionIndex = section.index ?? -1
      if (!sectionsToOffsetUpdate.has(sectionIndex)) continue

      const start = this.rowIndex(sectionIndex, 0)

      if (start < rowsInterval[0]) section.contentContainer.style.marginTop = `${this.rowsTopOffset[rowsInterval[0]] - this.rowsTopOffset[start]}px`
      else section.contentContainer.style.marginTop = '0'
    }

  }

  private onScroll(ev: Event) {
    this.scheduleUpdate()
  }

  private recalculateTotalHeight() {
    let totalHeight = 0

    const numberOfSections = this.delegate.numberOfSections(this)
    for (let section = 0, offset = 0; section < numberOfSections; section++) {
      const numberOfRows = this.delegate.numberOfRowsInSection(this, section)
      this.rowsCountBySection[section] = numberOfRows
      this.rowIndexOffsetBySection[section] = offset
      offset += numberOfRows
    }

    for (let section = 0; section < numberOfSections; section++) {
      const numberOfRows = this.rowsCountBySection[section]

      const headerHeight = this.delegate.heightForHeaderInSection?.(this, section) || 0
      const footerHeight = this.delegate.heightForFooterInSection?.(this, section) || 0

      this.headersHeight[section] = headerHeight
      this.footersHeight[section] = footerHeight

      totalHeight += headerHeight

      let cellsHeight = 0
      for (let row = 0; row < numberOfRows; row++) {
        const height = this.delegate.heightForCellByIndex(this, { section: section, row: row })
        const rowIndex = this.rowIndex(section, row)

        this.cellsHeight[rowIndex] = height
        this.rowsTopOffset[rowIndex] = totalHeight
        this.indexPathForRowOffset[rowIndex] = { section, row }
        totalHeight += height
        cellsHeight += height
      }

      this.sectionCellsHeight[section] = cellsHeight

      totalHeight += footerHeight
    }

    for (let section = 0, offset = 0; section < numberOfSections; section++) {
      this.sectionTopOffset[section] = offset
      offset +=
        this.sectionCellsHeight[section] +
        this.headersHeight[section] +
        this.footersHeight[section]
    }

    this.totalHeight = totalHeight
    this.content.style.height = `${totalHeight}px`
    this.scheduleUpdate()
  }

  dataDidUpdate() {
    // this.currentInterval = [-1, -1]
    // for (const element of this.visibleCellsOld) this.wrapper.removeChild(element.element.root)
    // this.visibleCellsOld = []
    this.recalculateTotalHeight()
  }

  dispose() {
    this.root.removeChild(this.scroll)
    if (this.updateHandle) cancelAnimationFrame(this.updateHandle)
  }
}