import { InteractionComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { InteractionFrame } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionFrame'
import { InteractionHit } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionHit'
import { InteractionResolver } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionResolver'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'

export type CompositionSnapshot<THit extends InteractionHit> = {
  readonly hits: readonly THit[]
  // Пришёл ли hit тем же объектом, что вернула правая ветка union: содержимое дубликата обязано быть оттуда
  readonly fromRight: readonly boolean[]
  readonly nearest: THit | null
  readonly topmost: THit | null
}

export function emptySnapshot<THit extends InteractionHit>(): CompositionSnapshot<THit> {
  return { hits: [], fromRight: [], nearest: null, topmost: null }
}

function signatureOf<THit extends InteractionHit>(snapshot: CompositionSnapshot<THit>) {
  const hits = snapshot.hits
    .map((hit, i) => `${hit.kind}:${String(hit.identity.key)}:${hit.geometry.anchor.x.toFixed(1)}:${hit.geometry.anchor.y.toFixed(1)}:${snapshot.fromRight[i] ? 1 : 0}`)
    .join(';')

  return `${hits}#${snapshot.nearest?.geometry.anchor.x ?? '-'}#${snapshot.topmost?.geometry.anchor.x ?? '-'}`
}

// Вся композиция разрешается в одном prepare и публикуется одним снимком. Раздельные пробы отдали бы
// хиты разных кадров, и сравнение по ссылке с правой веткой перестало бы что-то означать
export class CompositionProbe<THit extends InteractionHit> implements InteractionComponent {

  private composed: Selection<THit> | null = null
  private nearest: Selection<THit> | null = null
  private topmost: Selection<THit> | null = null
  private right: InteractionResolver<THit> | null = null

  private snapshot = emptySnapshot<THit>()
  private signature = ''

  constructor(private readonly onChange: (snapshot: CompositionSnapshot<THit>) => void) { }

  // Узлы nearest()/topmost() создаются один раз на композицию: граф immutable и живёт между кадрами
  setSelections(composed: Selection<THit>, right: InteractionResolver<THit> | null) {
    this.composed = composed
    this.nearest = composed.nearest()
    this.topmost = composed.topmost()
    this.right = right
  }

  detach(): void {
    this.snapshot = emptySnapshot<THit>()
    this.signature = ''
    this.onChange(this.snapshot)
  }

  prepareInteraction(frame: InteractionFrame): void {
    if (!this.composed || !this.nearest || !this.topmost) return

    const hits = frame.resolve(this.composed)
    const right = this.right ? frame.resolve(this.right) : []

    this.snapshot = {
      hits,
      fromRight: hits.map(hit => right.includes(hit)),
      nearest: frame.resolve(this.nearest)[0] ?? null,
      topmost: frame.resolve(this.topmost)[0] ?? null,
    }
  }

  renderInteraction(): void {
    const signature = signatureOf(this.snapshot)
    if (signature === this.signature) return

    this.signature = signature
    this.onChange(this.snapshot)
  }
}
