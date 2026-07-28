import { ReusableStorage } from './ReusableStorage'
import './reusableTable.scss'
import { Section } from './Section'
import { divWithClass, isTableElement, TableCell, TableFooter, TableHeader } from './utils'

export type { TableCell, TableFooter, TableHeader }

export type IndexPath = { section: number, row: number }
type Interval = [from: number, to: number]
type Storage = {
  cells: Map<number, { cell: TableCell, reusableKey: symbol | undefined }>
  headers: Map<number, { header: TableHeader, reusableKey: symbol | undefined }>
  footers: Map<number, { footer: TableFooter, reusableKey: symbol | undefined }>

  sections: Map<number, Section>
}

export interface TableViewDelegate {
  onSetupComplete?: (table: TableView) => void

  numberOfSections: (table: TableView) => number
  numberOfRowsInSection: (table: TableView, section: number) => number

  heightForCellByIndex: (table: TableView, index: IndexPath) => number
  cellForIndex: (table: TableView, index: IndexPath) => TableCell | { cell: TableCell, reusableKey: symbol }


  heightForHeaderInSection?: (table: TableView, section: number) => number | null
  headerCellForSection?: (table: TableView, section: number) => null | TableHeader | { header: TableHeader, reusableKey: symbol }

  heightForFooterInSection?: (table: TableView, section: number) => number | null
  footerCellForSection?: (table: TableView, section: number) => null | TableFooter | { footer: TableFooter, reusableKey: symbol }

  onScrollVelocityChange?: (table: TableView, velocity: number) => void
}

export class TableView {

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

  private lastScrollTop: number = 0
  private lastScrollTime: number = 0
  private updateVelocityHandle: ReturnType<typeof requestAnimationFrame> | null = null

  private readonly sectionsPendingOffsetUpdate = new Set<number>()
  private readonly reusableStorage = new ReusableStorage()
  private readonly resizeObserver = new ResizeObserver(() => this.containerDidResize())

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
    private readonly delegate: TableViewDelegate) {

    this.reusableStorage.registerElement(Section.reusableKey, () => new Section(), 20)

    this.root.classList.add('reusable-table-root')

    this.fallbackScroll = divWithClass('fallback-scroll', this.root)
    this.fallbackContent = divWithClass('fallback-content', this.fallbackScroll)
    this.fallbackWrapper = divWithClass('fallback-wrapper', this.fallbackContent)
    this.scroll = divWithClass('scroll', this.root)
    this.content = divWithClass('content', this.scroll)
    this.wrapper = divWithClass('wrapper', this.content)

    this.scroll.addEventListener('scroll', this.onScroll.bind(this), { passive: true })
    this.resizeObserver.observe(this.scroll)

    this.delegate.onSetupComplete?.(this)

    this.dataDidUpdate()
  }

  scrollTo(path: IndexPath, behavior: ScrollBehavior) {
    const target = this.rowsTopOffset[this.rowIndex(path.section, path.row)] - this.headersHeight[path.section]
    if (!Number.isFinite(target)) {
      console.warn(`TableView: cannot scroll to ${path.section}:${path.row} — index out of bounds`)
      return
    }

    this.scroll.scrollTo({ top: target, behavior })
    this.scheduleUpdate()
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

  getCellInstancesForIndexPath<T extends TableCell>(path: IndexPath): T[] {
    const getCell = (storage: Storage) => {
      const cellEntry = storage.cells.get(this.rowIndex(path.section, path.row))
      if (cellEntry) return cellEntry.cell as T
      return null
    }

    const scrollCell = getCell(this.scrollStorage)
    const fallbackCell = getCell(this.fallbackStorage)

    if (scrollCell && fallbackCell) return [scrollCell, fallbackCell]
    if (scrollCell) return [scrollCell]
    if (fallbackCell) return [fallbackCell]
    return []
  }

  dispose() {
    this.resizeObserver.disconnect()
    this.root.removeChild(this.scroll)
    this.root.removeChild(this.fallbackScroll)
    if (this.updateHandle) cancelAnimationFrame(this.updateHandle)
    if (this.updateVelocityHandle) cancelAnimationFrame(this.updateVelocityHandle)
  }

  private containerDidResize() {
    this.updateHasScroll()
    this.scheduleUpdate()
  }

  private updateHasScroll() {
    if (this.totalHeight > this.scroll.clientHeight) this.fallbackScroll.classList.add('has-scroll')
    else this.fallbackScroll.classList.remove('has-scroll')
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
    this.updateHasScroll()
    this.scheduleUpdate()
  }

  private rowIndex(section: number, rowInSection: number) {
    if (rowInSection >= 0) return this.rowIndexOffsetBySection[section] + rowInSection
    return this.rowIndexOffsetBySection[section] + this.rowsCountBySection[section] + rowInSection
  }

  private getVisibleSectionsInterval(top: number, bottom: number): Interval {
    const count = this.sectionCellsHeight.length
    const sectionBottom = (i: number) => this.sectionTopOffset[i] +
      this.sectionCellsHeight[i] + this.headersHeight[i] + this.footersHeight[i]

    const firstIndexBefore = firstIndexWhere(count, i => sectionBottom(i) > top)
    const lastIndexAfter = firstIndexWhere(count, i => sectionBottom(i) > bottom)

    return [
      firstIndexBefore === -1 ? (count - 1) : firstIndexBefore,
      lastIndexAfter === -1 ? (count - 1) : lastIndexAfter
    ]
  }

  private getVisibleRowsInterval(top: number, bottom: number): Interval {
    const count = this.rowsTopOffset.length

    const firstIndexBefore = firstIndexWhere(count, i => this.rowsTopOffset[i] + this.cellsHeight[i] > top)
    const firstIndexAfterBottom = firstIndexWhere(count, i => this.rowsTopOffset[i] > bottom)

    if (firstIndexAfterBottom === 0) return [0, -1]

    return [
      firstIndexBefore === -1 ? (count - 1) : firstIndexBefore,
      firstIndexAfterBottom === -1 ? (count - 1) : firstIndexAfterBottom - 1
    ]
  }

  private setupSection(index: number, first: boolean) {
    const setup = (getSection: () => Section, storage: Storage, wrapper: HTMLElement) => {

      const section = getSection()

      const isEmpty = this.rowsCountBySection[index] === 0

      section.setup(
        index,
        this.headersHeight[index],
        this.footersHeight[index],
        isEmpty ? 0 : this.cellsHeight[this.rowIndex(index, 0)],
        isEmpty ? 0 : this.cellsHeight[this.rowIndex(index, -1)],
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

  private updateScrollVelocity(scrollTop: number) {
    const scrollDelta = scrollTop - this.lastScrollTop
    this.lastScrollTop = scrollTop

    const currentTime = performance.now()
    const timeDelta = currentTime - this.lastScrollTime

    if (this.lastScrollTime != 0) {
      const velocity = timeDelta ? 1000 * scrollDelta / timeDelta : 0
      this.delegate.onScrollVelocityChange?.(this, velocity)
    }

    if (this.updateVelocityHandle) {
      cancelAnimationFrame(this.updateVelocityHandle)
      this.updateVelocityHandle = null
    }

    this.updateVelocityHandle = requestAnimationFrame(() => {
      this.updateVelocityHandle = null
      requestAnimationFrame(() => {
        if (this.updateVelocityHandle) return
        this.delegate.onScrollVelocityChange?.(this, 0)
      })
    })

    this.lastScrollTime = currentTime
  }

  private updateScroll() {
    this.updateHandle = null
    const scrollHeight = this.scroll.clientHeight
    const scrollTop = this.scroll.scrollTop
    const scrollBottom = scrollTop + scrollHeight

    this.updateScrollVelocity(scrollTop)

    const sectionsInterval = this.getVisibleSectionsInterval(scrollTop, scrollBottom)
    const rowsInterval = this.getVisibleRowsInterval(scrollTop, scrollBottom)

    const paddingTop = this.sectionTopOffset[sectionsInterval[0]] ?? 0

    this.wrapper.style.paddingTop = `${paddingTop}px`
    this.fallbackWrapper.style.paddingTop = `${paddingTop}px`
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

      const top = (this.headersHeight[index] ?? 0) + targetOffset
      this.scrollStorage.sections.get(index)!.contentContainer.style.top = `${top}px`
      this.fallbackStorage.sections.get(index)!.contentContainer.style.top = `${top}px`
    }
  }

  private onScroll(ev: Event) {
    this.scheduleUpdate()
  }
}

function intervalEqual(interval1: Interval, interval2: Interval) {
  return interval1[0] === interval2[0] && interval1[1] === interval2[1]
}

function firstIndexWhere(length: number, predicate: (index: number) => boolean) {
  let low = 0
  let high = length - 1
  let result = -1

  while (low <= high) {
    const middle = (low + high) >> 1
    if (predicate(middle)) {
      result = middle
      high = middle - 1
    } else low = middle + 1
  }

  return result
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
