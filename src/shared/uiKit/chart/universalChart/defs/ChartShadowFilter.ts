import { BaseDefs } from './BaseDefs'

const NAMESPACE = 'http://www.w3.org/2000/svg'

export type ChartShadowFilterOptions = {
  color: string
  blurRadius?: number
  dx?: number
  dy?: number
  opacity?: number
  strength?: number
}

export class ChartShadowFilter extends BaseDefs<SVGFilterElement> {
  private readonly blur = document.createElementNS(NAMESPACE, 'feGaussianBlur')
  private readonly strength = document.createElementNS(NAMESPACE, 'feComponentTransfer')
  private readonly alpha = document.createElementNS(NAMESPACE, 'feFuncA')
  private readonly offset = document.createElementNS(NAMESPACE, 'feOffset')
  private readonly flood = document.createElementNS(NAMESPACE, 'feFlood')

  constructor(options: ChartShadowFilterOptions) {
    super(document.createElementNS(NAMESPACE, 'filter'), 'shadow')

    this.root.setAttribute('x', '-50%')
    this.root.setAttribute('y', '-50%')
    this.root.setAttribute('width', '200%')
    this.root.setAttribute('height', '200%')
    this.root.setAttribute('color-interpolation-filters', 'sRGB')

    this.blur.setAttribute('in', 'SourceAlpha')
    this.blur.setAttribute('result', 'blur')

    this.strength.setAttribute('in', 'blur')
    this.strength.setAttribute('result', 'strengthened-blur')
    this.alpha.setAttribute('type', 'linear')
    this.strength.appendChild(this.alpha)

    this.offset.setAttribute('in', 'strengthened-blur')
    this.offset.setAttribute('result', 'offset-blur')

    this.flood.setAttribute('result', 'shadow-color')

    const composite = document.createElementNS(NAMESPACE, 'feComposite')
    composite.setAttribute('in', 'shadow-color')
    composite.setAttribute('in2', 'offset-blur')
    composite.setAttribute('operator', 'in')
    composite.setAttribute('result', 'shadow')

    const merge = document.createElementNS(NAMESPACE, 'feMerge')
    const shadowNode = document.createElementNS(NAMESPACE, 'feMergeNode')
    const sourceNode = document.createElementNS(NAMESPACE, 'feMergeNode')
    shadowNode.setAttribute('in', 'shadow')
    sourceNode.setAttribute('in', 'SourceGraphic')
    merge.append(shadowNode, sourceNode)

    this.root.append(this.blur, this.strength, this.offset, this.flood, composite, merge)
    this.updateOptions({ blurRadius: 4, dx: 0, dy: 0, opacity: 1, strength: 1, ...options })
  }

  updateOptions(options: Partial<ChartShadowFilterOptions>) {
    if (options.blurRadius !== undefined) this.blur.setAttribute('stdDeviation', Math.max(0, options.blurRadius).toString())
    if (options.strength !== undefined) this.alpha.setAttribute('slope', Math.max(0, options.strength).toString())
    if (options.dx !== undefined) this.offset.setAttribute('dx', options.dx.toString())
    if (options.dy !== undefined) this.offset.setAttribute('dy', options.dy.toString())
    if (options.color !== undefined) this.flood.setAttribute('flood-color', options.color)
    if (options.opacity !== undefined) this.flood.setAttribute('flood-opacity', Math.min(1, Math.max(0, options.opacity)).toString())
    return this
  }

  apply(element: SVGElement) {
    element.setAttribute('filter', this.getUrl())
  }

  remove(element: SVGElement) {
    if (element.getAttribute('filter') === this.getUrl()) element.removeAttribute('filter')
  }
}
