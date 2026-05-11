import './style.scss'
import { ChartDelegate } from '../../../Chart'
import { BaseRenderablePlugin } from '../../../shared/BaseRenderablePlugin'
import { SizeRequestable } from '../../layouts/basicLayout/BasicLayout'

export class XLabels extends BaseRenderablePlugin implements SizeRequestable {
  private group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  private lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  private ticks = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  constructor() {
    super()
    this.group.appendChild(this.lineElement)
    this.group.appendChild(this.ticks)

    this.group.classList.add('chart-x-labels-root')
    this.lineElement.classList.add('line')
    this.ticks.classList.add('ticks')
  }

  requestPreferredSize(width: number, height: number) {
    return { width: null, height: 20 }
  }

  apply(delegate: ChartDelegate): void {
    this.chartDelegate?.removeChild(this.group)
    super.apply(delegate)
    delegate.addChild(this.group)
  }

  render() {
    const p0 = this.transform(0, 1)
    const p1 = this.transform(1, 1)
    this.lineElement.setAttribute('d', `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`)

    let ticksPath = ''
    for (let i = 0; i < 11; i++) {
      const tickP0 = this.transform(i / 10, 1)
      const tickP1 = this.transform(i / 10, 1)
      if (i == 0) {
        tickP0.x += 0.5
        tickP1.x += 0.5
      } else if (i == 10) {
        tickP0.x -= 0.5
        tickP1.x -= 0.5
      }

      ticksPath += `M ${tickP0.x} ${tickP0.y + 0.5} L ${tickP1.x} ${tickP1.y + 7} `
    }

    this.ticks.setAttribute('d', ticksPath)
  }

}