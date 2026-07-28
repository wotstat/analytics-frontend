import './cells.scss'
import type { TableRow } from '@/pages/debug/shared/fixtures/types'
import type { IndexPath, TableCell } from '@/shared/uiKit/tableView/tableView/TableView'
import { formatInt } from './format'

// Пороги вынесены, чтобы сломанная ячейка ломалась ровно на тех же условиях.
export const TOP_WINRATE = 60
export const RECORD_BATTLES = 3800

// Счётчики держит страница: ячейка ничего не знает про Vue, числа снимаются опросом.
export type CellStats = { created: number, configured: number }

export type RowCellConfig = {
  row: TableRow
  index: IndexPath
  height: number
  showNodeId?: boolean
  selected?: boolean
  clip?: boolean
}

export type RowCellOptions = {
  stats?: CellStats
  onClick?: (index: IndexPath) => void
}

let nodeCounter = 0

export class RowCell implements TableCell {

  static readonly reusableKey: symbol = Symbol('DebugRowCell')

  readonly root: HTMLElement
  readonly nodeId: number

  protected readonly rank = createElement('rank')
  protected readonly node = createElement('node')
  protected readonly name = createElement('name')
  protected readonly badge = createElement('badge')
  protected readonly battles = createElement('num')
  protected readonly damage = createElement('num')
  protected readonly winrate = createElement('num')

  protected index: IndexPath | null = null

  constructor(protected readonly options: RowCellOptions = {}) {
    nodeCounter += 1
    this.nodeId = nodeCounter
    if (options.stats) options.stats.created += 1

    this.root = document.createElement('div')
    this.root.classList.add('tv-cell')
    this.root.append(this.rank, this.node, this.name, this.badge, this.battles, this.damage, this.winrate)

    if (options.onClick) {
      this.root.classList.add('clickable')
      this.root.addEventListener('click', () => {
        if (this.index) this.options.onClick?.(this.index)
      })
    }
  }

  configure(config: RowCellConfig) {
    this.writeAlways(config)

    // Обе строчки снимают состояние, когда условие не выполнено — это и есть
    // контракт переиспользуемой ячейки.
    this.root.classList.toggle('top', config.row.winrate >= TOP_WINRATE)
    this.badge.textContent = config.row.battles >= RECORD_BATTLES ? 'рекорд' : ''
  }

  protected writeAlways(config: RowCellConfig) {
    if (this.options.stats) this.options.stats.configured += 1

    this.index = config.index
    this.root.style.height = `${config.height}px`
    this.root.classList.toggle('selected', config.selected === true)
    this.root.classList.toggle('no-clip', config.clip === false)

    this.node.style.display = config.showNodeId ? '' : 'none'
    this.node.textContent = `n${this.nodeId}`

    this.rank.textContent = `#${config.row.id}`
    this.name.textContent = config.row.name
    this.battles.textContent = formatInt(config.row.battles)
    this.damage.textContent = formatInt(config.row.damage)
    this.winrate.textContent = `${config.row.winrate.toFixed(2)}%`
  }
}

function createElement(className: string) {
  const element = document.createElement('span')
  element.classList.add(className)
  return element
}
