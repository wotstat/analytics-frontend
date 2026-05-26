import { ChartSpace } from '../../../utils/ChartSpace'
import { Classes } from '../../../utils/utils'
import { BaseMarkers, Marker } from '../BaseMarkers'


type Variant = 'circle' | 'square' | 'diamond'


// type 
type MarkerData = {
  x: number
  y: number
  variant?: Variant
}

class AutoMarker implements Marker {

  constructor(readonly root: Element) {
  }

  render(space: ChartSpace): void {
    throw new Error('Method not implemented.')
  }

  dispose(): void {
    throw new Error('Method not implemented.')
  }
}

export class AutoMarkers extends BaseMarkers<MarkerData> {

  constructor(protected options: {
    classes?: Classes
    variant?: Variant
  }) {
    super(options.classes ?? [])
  }

  createMarker(data: MarkerData): Marker {
    throw new Error('Method not implemented.')
  }
}