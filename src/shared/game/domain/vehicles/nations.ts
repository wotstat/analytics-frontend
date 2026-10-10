
export const nations = ['ussr', 'germany', 'usa', 'china', 'france', 'uk', 'japan', 'czech', 'sweden', 'poland', 'italy', 'intunion'] as const
export const mtNations = ['ussr', 'germany', 'usa', 'china', 'france', 'uk', 'japan', 'czech', 'sweden', 'poland', 'italy', 'intunion'] as const
export const wotNations = ['ussr', 'germany', 'usa', 'china', 'france', 'uk', 'japan', 'czech', 'sweden', 'poland', 'italy'] as const
export const nationsIndexes = new Map<Nation, number>(nations.map((nation, index) => [nation, index]))
export type Nation = typeof nations[number]

export const nationNames: Record<Nation, string> = {
  ussr: 'СССР',
  germany: 'Германия',
  usa: 'США',
  china: 'Китай',
  france: 'Франция',
  uk: 'Великобритания',
  japan: 'Япония',
  czech: 'Чехословакия',
  sweden: 'Швеция',
  poland: 'Польша',
  italy: 'Италия',
  intunion: 'Сборная наций',
}
