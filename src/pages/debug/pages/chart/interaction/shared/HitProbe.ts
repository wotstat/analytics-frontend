import { InteractionComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { InteractionFrame } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionFrame'
import { InteractionHit, isSameIdentity } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionHit'
import { InteractionResolver } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionResolver'

// Текстовый снимок selection для стендов с табличным выводом, вместо HTML-тултипа ChartTooltip.
// Разрешает selection в prepare, наружу публикует в render — барьер фаз соблюдён
export class HitProbe<THit extends InteractionHit> implements InteractionComponent {

  private hits: readonly THit[] = []
  private published: readonly THit[] = []

  constructor(
    private selection: InteractionResolver<THit>,
    private readonly onChange: (hits: readonly THit[]) => void
  ) { }

  setSelection(selection: InteractionResolver<THit>) {
    this.selection = selection
  }

  detach(): void {
    this.hits = []
    this.published = []
    this.onChange([])
  }

  prepareInteraction(frame: InteractionFrame): void {
    this.hits = frame.resolve(this.selection)
  }

  renderInteraction(): void {
    if (!this.didChange(this.hits)) return
    this.published = this.hits
    this.onChange(this.hits)
  }

  private didChange(next: readonly THit[]): boolean {
    if (next.length !== this.published.length) return true

    // distance и contains меняются при движении внутри одного и того же item (например по площади bar),
    // поэтому входят в сравнение наравне с identity и anchor — иначе стенд показывал бы прошлые значения
    return next.some((hit, i) => {
      const previous = this.published[i]
      return !isSameIdentity(hit.identity, previous.identity) ||
        hit.geometry.anchor.x !== previous.geometry.anchor.x ||
        hit.geometry.anchor.y !== previous.geometry.anchor.y ||
        hit.distance !== previous.distance ||
        hit.contains !== previous.contains
    })
  }
}
