import { MultiLineChart, Overflow, PlotRenderer, Size } from '../MultiLine'
import { ChartSpace } from '../utils/ChartSpace'
import { addClasses, Classes } from '../utils/utils'

export abstract class Marker {
  abstract render(space: ChartSpace): void
  abstract dispose(): void
}

export abstract class BaseMarkers<T> implements PlotRenderer {

  protected root = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  protected markers: T[] = []
  protected multiLine: MultiLineChart | null = null
  protected markerInstances: Marker[] = []

  protected isDirty = true
  protected spaceCache = ''

  constructor(classes: Classes) {
    addClasses(this.root, classes)
  }

  attach(root: SVGGElement, multiLine: MultiLineChart): void {
    this.multiLine = multiLine
  }

  getRootElement(): Element {
    return this.root
  }

  setMarkers(markers: T[]) {
    this.markers = markers
    this.dataDidChange()
  }

  dataDidChange() {
    this.multiLine?.dataDidChange()
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const spaceHash = space.getHash()
    if (!this.isDirty && this.spaceCache == spaceHash) return
    this.isDirty = false
    this.spaceCache = spaceHash

    for (let i = this.markers.length; i < this.markerInstances.length; i++) {
      this.markerInstances[i].dispose()
    }
    this.markerInstances.length = this.markers.length

    for (let i = this.markerInstances.length; i < this.markers.length; i++) {
      this.markerInstances[i] = this.createMarker(this.markers[i])
    }

    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markerInstances[i]
      marker.render(space)
    }
  }

  abstract createMarker(data: T): Marker
}