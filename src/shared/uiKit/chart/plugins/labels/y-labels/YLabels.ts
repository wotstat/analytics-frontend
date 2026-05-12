import './style.scss'
import { ChartDelegate } from '../../../Chart'
import { BaseRenderablePlugin } from '../../../shared/BaseRenderablePlugin'
import { SizeRequestable } from '../../layouts/basicLayout/BasicLayout'

export class YLabels extends BaseRenderablePlugin implements SizeRequestable {
  private group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  private lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  private ticks = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  constructor() {
    super()
    this.group.appendChild(this.lineElement)
    this.group.appendChild(this.ticks)

    this.group.classList.add('chart-y-labels-root')
    this.lineElement.classList.add('line')
    this.ticks.classList.add('ticks')
  }

  requestPreferredSize(width: number, height: number) {
    return { width: 40, height: null }
  }

  apply(delegate: ChartDelegate): void {
    this.chartDelegate?.removeChild(this.group)
    super.apply(delegate)
    delegate.addChild(this.group)
  }

  render() {
    const p0 = this.transform(1, 0)
    const p1 = this.transform(1, 1)
    this.lineElement.setAttribute('d', `M ${p0.x} ${p0.y - (this.bottomPadding === 0 ? 0 : 0.5)} L ${p1.x} ${p1.y}`)

    let ticksPath = ''
    for (let i = 0; i < 11; i++) {
      const tickP0 = this.transform(1, i / 10)
      const tickP1 = this.transform(1, i / 10)
      if (i == 0 && this.bottomPadding === 0) {
        tickP0.y -= 0.5
        tickP1.y -= 0.5
      } else if (i == 10 && this.topPadding === 0) {
        tickP0.y += 0.5
        tickP1.y += 0.5
      }

      ticksPath += `M ${tickP0.x - 0.5} ${tickP0.y} L ${tickP1.x - 7} ${tickP1.y} `
    }

    this.ticks.setAttribute('d', ticksPath)
  }

}