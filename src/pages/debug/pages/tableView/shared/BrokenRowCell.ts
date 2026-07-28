import { RECORD_BATTLES, RowCell, TOP_WINRATE, type RowCellConfig } from './RowCell'


export class BrokenRowCell extends RowCell {

  static readonly reusableKey: symbol = Symbol('DebugBrokenRowCell')

  override configure(config: RowCellConfig) {
    this.writeAlways(config)

    if (config.row.winrate >= TOP_WINRATE) this.root.classList.add('top')
    if (config.row.battles >= RECORD_BATTLES) this.badge.textContent = 'рекорд'
  }
}
