import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { HorizontalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/HorizontalLine'
import { NearestMarker } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/nearestMarker/NearestMarker'


// TODO: Это баг, надо детачить
// В бою компоненты снимаются только вместе со всем графиком, поэтому `detach` у них не
// убирает свой элемент из DOM: BaseLine оставляет <line> (да ещё с классом visible —
// на графике застывает призрак), NearestMarker — пустую <g>. На странице набор
// пересобирается каждым тумблером, так что подчищаем в наследниках. Движок не трогаем.

export class RebuildableVerticalLine extends VerticalLine {
  detach() {
    super.detach()
    this.line.remove()
  }
}

export class RebuildableHorizontalLine extends HorizontalLine {
  detach() {
    super.detach()
    this.line.remove()
  }
}

export class RebuildableNearestMarker extends NearestMarker {
  detach() {
    super.detach()
    this.root.remove()
  }
}
