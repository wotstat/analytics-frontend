import { MultiLineChart, Overflow, PlotRenderer, Size } from '../../MultiLine'
import { ChartSpace } from '../../utils/ChartSpace'
import { addClasses, Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'


export interface Marker {
  render(space: ChartSpace): void
  dispose(): void
}

export abstract class BaseMarkers<T> extends BasePlotRenderer {

  protected markers: T[] = []
  protected multiLine: MultiLineChart | null = null
  protected markerInstances: Marker[] = []

  constructor(classes: Classes) {
    super(classes)
  }

  setMarkers(markers: T[]) {
    this.markers = markers
    this.dataDidChange()
  }

  dataDidChange() {
    this.requestRender()
  }

  renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {

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