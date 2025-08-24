import './reusableTable.scss'

export interface TableElement {
  root: HTMLElement;
}

export interface TableCell extends TableElement { }
export interface TableHeader extends TableElement { }
export interface TableFooter extends TableElement { }

function isTableElement(obj: Object): obj is TableElement {
  return 'root' in obj
}

type IndexPath = { section: number, row: number }
export interface ReusableTableDelegate {
  onSetupComplete?: (table: ReusableTable) => void

  numberOfSections: (table: ReusableTable) => number
  numberOfRowsInSection: (table: ReusableTable, section: number) => number

  heightForCellByIndex: (table: ReusableTable, index: IndexPath) => number
  cellForIndex: (table: ReusableTable, index: IndexPath) => TableCell | { cell: TableCell, reusableKey: symbol }


  heightForHeaderInSection?: (table: ReusableTable, section: number) => number | null
  headerCellForSection?: (table: ReusableTable, section: number) => null | TableHeader | { header: TableHeader, reusableKey: symbol }

  heightForFooterInSection?: (table: ReusableTable, section: number) => number | null
  footerCellForSection?: (table: ReusableTable, section: number) => null | TableFooter | { footer: TableFooter, reusableKey: symbol }
}

function divWithClass(className: string, parent?: HTMLElement) {
  const div = document.createElement('div')
  div.classList.add(className)
  if (parent) parent.appendChild(div)
  return div
}

type ReusableEntry = {
  ctor: () => unknown,
  limit: number,
  free: unknown[]
}

class ReusableStorage {

  private readonly storage = new Map<symbol, ReusableEntry>()

  constructor() { }

  registerElement(key: symbol, ctor: () => unknown, limit: number = 10) {
    this.storage.set(key, { ctor, free: [], limit })
  }

  getElement<T>(key: symbol): T {
    const entry = this.storage.get(key)
    if (!entry) throw new Error(`Element not found for key: ${key.toString()}`)
    if (entry.free.length > 0) return entry.free.pop() as T
    return entry.ctor() as T
  }

  releaseElement<T>(key: symbol, element: T) {
    const entry = this.storage.get(key)
    if (!entry) throw new Error(`Element not found for key: ${key.toString()}`)
    if (entry.free.length < entry.limit) {
      entry.free.push(element)
    }
  }
}

class Section {
  root: HTMLElement
  headerContainer: HTMLElement
  footerContainer: HTMLElement
  contentContainer: HTMLElement
  index: number | null = null

  static readonly reusableKey = Symbol()

  constructor() {
    this.root = divWithClass('section')
    this.headerContainer = divWithClass('header-container', this.root)
    this.footerContainer = divWithClass('footer-container', this.root)
    this.contentContainer = divWithClass('content-container', this.root)
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

type Interval = [from: number, to: number]

function intervalEqual(interval1: Interval, interval2: Interval) {
  return interval1[0] === interval2[0] && interval1[1] === interval2[1]
}

type Storage = {
  cells: Map<number, { cell: TableCell, reusableKey: symbol | undefined }>
  headers: Map<number, { header: TableHeader, reusableKey: symbol | undefined }>
  footers: Map<number, { footer: TableFooter, reusableKey: symbol | undefined }>

  sections: Map<number, Section>
}

function cleanupCell(index: number, indexPath: IndexPath, storage: Storage, reusableStorage: ReusableStorage) {
  const section = storage.sections.get(indexPath.section)!
  const reusable = storage.cells.get(index)!
  section.contentContainer.removeChild(reusable.cell.root)
  storage.cells.delete(index)
  if (reusable.reusableKey) reusableStorage.releaseElement(reusable.reusableKey, reusable.cell)
}

function cleanupSection(index: number, storage: Storage, reusableStorage: ReusableStorage) {

  const section = storage.sections.get(index)!
  reusableStorage.releaseElement(Section.reusableKey, section)

  const header = storage.headers.get(index) ?? null
  const footer = storage.footers.get(index) ?? null

  if (header) {
    section.headerContainer.removeChild(header.header.root)
    if (header.reusableKey) reusableStorage.releaseElement(header.reusableKey, header.header)
  }

  if (footer) {
    section.footerContainer.removeChild(footer.footer.root)
    if (footer.reusableKey) reusableStorage.releaseElement(footer.reusableKey, footer.footer)
  }

  storage.headers.delete(index)
  storage.footers.delete(index)

  storage.sections.delete(index)

  return section
}


export class ReusableTable {

  private readonly fallbackScroll: HTMLElement
  private readonly fallbackContent: HTMLElement
  private readonly fallbackWrapper: HTMLElement
  private readonly scroll: HTMLElement
  private readonly content: HTMLElement
  private readonly wrapper: HTMLElement

  private updateHandle: ReturnType<typeof requestAnimationFrame> | null = null

  private totalHeight: number = 0
  private cellsHeight: number[] = []
  private rowsTopOffset: number[] = []

  private sectionsInterval: Interval = [-1, -1]
  private rowsInterval: Interval = [-1, -1]

  private sectionCellsHeight: number[] = []
  private headersHeight: number[] = []
  private footersHeight: number[] = []
  private sectionTopOffset: number[] = []

  private rowsCountBySection: number[] = []
  private rowIndexOffsetBySection: number[] = []
  private indexPathForRowOffset: IndexPath[] = []

  private readonly sectionsPendingOffsetUpdate = new Set<number>()
  private readonly reusableStorage = new ReusableStorage()

  private readonly scrollStorage: Storage = {
    cells: new Map(),
    sections: new Map(),
    headers: new Map(),
    footers: new Map()
  }

  private readonly fallbackStorage: Storage = {
    cells: new Map(),
    sections: new Map(),
    headers: new Map(),
    footers: new Map()
  }

  constructor(
    private readonly root: HTMLElement,
    private readonly delegate: ReusableTableDelegate) {

    this.reusableStorage.registerElement(Section.reusableKey, () => new Section(), 20)

    this.root.classList.add('reusable-table-root')

    this.fallbackScroll = divWithClass('fallback-scroll', this.root)
    this.fallbackContent = divWithClass('fallback-content', this.fallbackScroll)
    this.fallbackWrapper = divWithClass('fallback-wrapper', this.fallbackContent)
    this.scroll = divWithClass('scroll', this.root)
    this.content = divWithClass('content', this.scroll)
    this.wrapper = divWithClass('wrapper', this.content)

    this.scroll.addEventListener('scroll', this.onScroll.bind(this), { passive: true })

    this.delegate.onSetupComplete?.(this)

    this.dataDidUpdate()
  }

  dataDidUpdate() {
    for (let i = this.rowsInterval[0]; i <= this.rowsInterval[1] && i != -1; i++) this.cleanupCell(i)
    for (let i = this.sectionsInterval[0]; i <= this.sectionsInterval[1] && i != -1; i++) this.cleanupSection(i)

    this.scrollStorage.sections.clear()
    this.scrollStorage.cells.clear()

    this.rowsInterval = [-1, -1]
    this.sectionsInterval = [-1, -1]

    this.cellsHeight = []
    this.rowsTopOffset = []

    this.sectionCellsHeight = []
    this.headersHeight = []
    this.footersHeight = []
    this.sectionTopOffset = []

    this.rowsCountBySection = []
    this.rowIndexOffsetBySection = []
    this.indexPathForRowOffset = []

    this.recalculateTotalHeight()
  }

  registerReusable(key: symbol, ctor: () => unknown, limit: number = 10) {
    this.reusableStorage.registerElement(key, ctor, limit)
  }

  getReusable<T>(key: symbol): T {
    return this.reusableStorage.getElement(key)
  }

  dispose() {
    this.root.removeChild(this.scroll)
    if (this.updateHandle) cancelAnimationFrame(this.updateHandle)
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

  private rowIndex(section: number, rowInSection: number) {
    if (rowInSection >= 0) return this.rowIndexOffsetBySection[section] + rowInSection
    return this.rowIndexOffsetBySection[section] + this.rowsCountBySection[section] + rowInSection
  }

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

  private setupSection(index: number, first: boolean) {
    const setup = (getSection: () => Section, storage: Storage, wrapper: HTMLElement) => {

      const section = getSection()

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

      if (headerElement) {
        const reusable = isTableElement(headerElement) ? { header: headerElement, reusableKey: undefined } : headerElement
        storage.headers.set(index, reusable)
        section.headerContainer.appendChild(reusable.header.root)
      }

      if (footerElement) {
        const reusable = isTableElement(footerElement) ? { footer: footerElement, reusableKey: undefined } : footerElement
        storage.footers.set(index, reusable)
        section.footerContainer.appendChild(reusable.footer.root)
      }

      storage.sections.set(index, section)

      if (first) wrapper.insertBefore(section.root, wrapper.firstChild)
      else wrapper.appendChild(section.root)
    }

    setup(() => this.getReusable<Section>(Section.reusableKey), this.scrollStorage, this.wrapper)
    setup(() => this.getReusable<Section>(Section.reusableKey), this.fallbackStorage, this.fallbackWrapper)
  }

  private cleanupSection(index: number) {
    this.wrapper.removeChild(cleanupSection(index, this.scrollStorage, this.reusableStorage).root)
    this.fallbackWrapper.removeChild(cleanupSection(index, this.fallbackStorage, this.reusableStorage).root)
    this.sectionsPendingOffsetUpdate.delete(index)
  }

  private setupCell(index: number, first: boolean) {
    const indexPath = this.indexPathForRowOffset[index]
    this.sectionsPendingOffsetUpdate.add(indexPath.section)

    const setup = (storage: Storage) => {
      const section = storage.sections.get(indexPath.section)!
      const cell = this.delegate.cellForIndex(this, indexPath)
      const reusable = isTableElement(cell) ? { cell: cell, reusableKey: undefined } : cell
      storage.cells.set(index, reusable)
      if (first) section.contentContainer.insertBefore(reusable.cell.root, section.contentContainer.firstChild)
      else section.contentContainer.appendChild(reusable.cell.root)
    }

    setup(this.scrollStorage)
    setup(this.fallbackStorage)
  }

  private cleanupCell(index: number) {
    const indexPath = this.indexPathForRowOffset[index]
    this.sectionsPendingOffsetUpdate.add(indexPath.section)
    cleanupCell(index, indexPath, this.scrollStorage, this.reusableStorage)
    cleanupCell(index, indexPath, this.fallbackStorage, this.reusableStorage)
  }

  private scheduleUpdate() {
    if (this.updateHandle) return
    this.updateHandle = requestAnimationFrame(this.updateScroll.bind(this))
  }

  private updateScroll() {
    this.updateHandle = null
    const scrollHeight = this.scroll.clientHeight
    const scrollTop = this.scroll.scrollTop
    const scrollBottom = scrollTop + scrollHeight

    const sectionsInterval = this.getVisibleSectionsInterval(scrollTop, scrollBottom)
    const rowsInterval = this.getVisibleRowsInterval(scrollTop, scrollBottom)

    this.wrapper.style.paddingTop = `${this.sectionTopOffset[sectionsInterval[0]]}px`
    this.fallbackWrapper.style.paddingTop = `${this.sectionTopOffset[sectionsInterval[0]]}px`
    this.fallbackContent.style.marginTop = `${-scrollTop}px`

    this.sectionsPendingOffsetUpdate.clear()

    if (!intervalEqual(this.rowsInterval, rowsInterval)) {
      const from = this.rowsInterval
      const to = rowsInterval

      for (let i = from[0]; i < to[0] && i <= from[1] && i != -1; i++) this.cleanupCell(i)
      for (let i = Math.max(to[1] + 1, from[0]); i <= from[1] && i != -1; i++) this.cleanupCell(i)
    }

    if (!intervalEqual(this.sectionsInterval, sectionsInterval)) {

      const from = this.sectionsInterval
      const to = sectionsInterval

      for (let i = from[0]; i < to[0] && i <= from[1] && i != -1; i++) this.cleanupSection(i)
      for (let i = Math.max(to[1] + 1, from[0]); i <= from[1] && i != -1; i++) this.cleanupSection(i)

      for (let i = Math.min(from[0] - 1, to[1]); i >= to[0]; i--) this.setupSection(i, true)
      for (let i = Math.max(from[1] + 1, to[0]); i <= to[1]; i++) this.setupSection(i, false)

      this.sectionsInterval = sectionsInterval
    }

    if (!intervalEqual(this.rowsInterval, rowsInterval)) {
      const from = this.rowsInterval
      const to = rowsInterval

      for (let i = Math.min(from[0] - 1, to[1]); i >= to[0]; i--) this.setupCell(i, true)
      for (let i = Math.max(from[1] + 1, to[0]); i <= to[1]; i++) this.setupCell(i, false)
    }


    this.rowsInterval = rowsInterval

    for (const index of this.sectionsPendingOffsetUpdate) {
      const start = this.rowIndex(index, 0)

      const targetOffset = start < rowsInterval[0] ? this.rowsTopOffset[rowsInterval[0]] - this.rowsTopOffset[start] : 0
      this.scrollStorage.sections.get(index)!.contentContainer.style.marginTop = `${targetOffset}px`
      this.fallbackStorage.sections.get(index)!.contentContainer.style.marginTop = `${targetOffset}px`
    }
  }

  private onScroll(ev: Event) {
    this.scheduleUpdate()
  }
}