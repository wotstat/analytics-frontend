import { BaseDefs } from './BaseDefs'

const NAMESPACE = 'http://www.w3.org/2000/svg'

type PatternUnits = 'userSpaceOnUse' | 'objectBoundingBox'
export class ChartRawPattern extends BaseDefs {

  constructor() {
    super(document.createElementNS(NAMESPACE, 'pattern'), 'pattern')
  }

  fill(element: SVGGElement) {
    element.setAttribute('fill', this.getUrl())
  }

  setContent(content: string, options: { patternUnits?: PatternUnits, width?: number, height?: number } = {}) {
    this.root.innerHTML = content

    this.root.setAttribute('patternUnits', options.patternUnits ?? 'userSpaceOnUse')
    if (options.width) this.root.setAttribute('width', options.width.toString())
    if (options.height) this.root.setAttribute('height', options.height.toString())

    return this
  }

  addAttribute(name: string, value: string) {
    this.root.setAttribute(name, value)
    return this
  }

}