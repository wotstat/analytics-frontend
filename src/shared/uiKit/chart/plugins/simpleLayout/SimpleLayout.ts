import { ChartDelegate, ChartPlugin, ChartSpace } from '../../Chart'

export class SimpleLayout implements ChartPlugin {
  private delegate: ChartDelegate | null = null
  private spaces: ChartSpace[] = []
  private chartPlugins: ChartPlugin[] = []

  private chartWidth = 0
  private chartHeight = 0

  constructor() { }

  apply(delegate: ChartDelegate): void {
    this.delegate = delegate
    for (const plugin of this.chartPlugins) {
      this.delegate.addPlugin(plugin)
    }
  }

  render() {
    if (!this.delegate) return

    const width = this.delegate.width() ?? 0
    const height = this.delegate.height() ?? 0

    if (this.chartWidth !== width || this.chartHeight !== height) {
      this.chartWidth = width
      this.chartHeight = height
      this.layout()
    }
  }

  protected layout() {
    const spaceParams = {
      top: 0,
      left: 0,
      width: this.chartWidth,
      height: this.chartHeight,
      paddingTop: 10,
      paddingLeft: 10,
      paddingRight: 10,
      paddingBottom: 10,
    }

    for (const space of this.spaces) space.setup(spaceParams)
  }

  addSpace(space: ChartSpace) {
    this.spaces.push(space)
    return this
  }

  addSpacedPlugin(plugin: ChartPlugin & ChartSpace) {
    this.addSpace(plugin)
    this.chartPlugins.push(plugin)

    this.delegate?.addPlugin(plugin)

    return this
  }
}