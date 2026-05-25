import { DefsRenderer } from '../MultiLine'
import { addClasses, Classes } from './utils'

const NAMESPACE = 'http://www.w3.org/2000/svg'

type Step = { offset: number, color?: string, class?: Classes } | number
type Direction = number | 'to top' | 'to right' | 'to bottom' | 'to left' | 'horizontal' | 'vertical'

export class ChartGradient implements DefsRenderer {
  private id = `clip-${Math.random().toString(16).slice(2)}`

  private gradient = document.createElementNS(NAMESPACE, 'linearGradient')
  private stepsElement: SVGStopElement[] = []

  constructor(options?: { classes?: Classes, steps?: Step[] | number, direction?: Direction }) {
    this.setDirection(options?.direction ?? 'vertical')
    this.setSteps(options?.steps ?? 2)

    this.gradient.classList.add('chart-gradient')
    this.gradient.setAttribute('id', this.id)
    addClasses(this.gradient, options?.classes)
  }

  getRootElement() {
    return this.gradient
  }

  setSteps(steps: Step[] | number) {
    if (typeof steps === 'number') {
      const count = steps - 1
      steps = new Array(steps).fill(0).map((_, i) => i / count)
    }

    while (this.stepsElement.length > steps.length) {
      const step = this.stepsElement.pop()
      if (step) step.remove()
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const element = this.stepsElement[i] || this.createStop()


      if (typeof step === 'number') {
        element.setAttribute('offset', `${step * 100}%`)
      } else {
        element.setAttribute('offset', `${step.offset * 100}%`)
        if (step.color) element.setAttribute('stop-color', step.color)
        if (step.class) addClasses(element, step.class)
      }
    }
  }

  setDirection(rotation: Direction) {
    let angle = 0
    switch (rotation) {
      case 'to top':
      case 'vertical':
        angle = 270
        break
      case 'to right':
      case 'horizontal':
        angle = 0
        break
      case 'to bottom':
        angle = 90
        break
      case 'to left':
        angle = 180
        break
      default:
        if (typeof rotation === 'number') {
          angle = rotation % 360
        }
    }

    const rad = angle * Math.PI / 180
    const x = Math.cos(rad)
    const y = Math.sin(rad)
    this.gradient.setAttribute('x1', `${(x + 1) / 2 * 100}%`)
    this.gradient.setAttribute('y1', `${(y + 1) / 2 * 100}%`)
    this.gradient.setAttribute('x2', `${(1 - x) / 2 * 100}%`)
    this.gradient.setAttribute('y2', `${(1 - y) / 2 * 100}%`)
  }

  getClipPath() {
    return `url(#${this.id})`
  }

  private createStop() {
    const stop = document.createElementNS(NAMESPACE, 'stop')
    this.gradient.appendChild(stop)
    this.stepsElement.push(stop)
    stop.classList.add(`stop-${this.stepsElement.length}`)
    return stop
  }

}