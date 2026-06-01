import { UniversalChart, Overflow, PlotRenderer, Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { addClasses, Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'


export interface Marker<T> {
  render(data: T, space: ChartSpace): void
  dispose(): void
}

export abstract class BaseMarkers<T> extends BasePlotRenderer {

  protected markers: T[] = []
  protected chart: UniversalChart | null = null
  protected markerInstances: Marker<T>[] = []

  constructor(classes: Classes) {
    super(classes)
  }

  setMarkers(markers: T[]) {
    this.markers = markers
    this.dataDidChange()
    return this
  }

  dataDidChange() {
    this.requestRender()
  }

  renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {

    for (let i = this.markers.length; i < this.markerInstances.length; i++) {
      this.markerInstances.pop()?.dispose()
    }

    for (let i = this.markerInstances.length; i < this.markers.length; i++) {
      this.markerInstances.push(this.createMarker(this.markers[i]))
    }

    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markerInstances[i]
      marker.render(this.markers[i], space)
    }
  }

  abstract createMarker(data: T): Marker<T>
}