
export const nations = ['ussr', 'germany', 'usa', 'china', 'france', 'uk', 'japan', 'czech', 'sweden', 'poland', 'italy', 'intunion'] as const
export const mtNations = ['ussr', 'germany', 'usa', 'china', 'france', 'uk', 'japan', 'czech', 'sweden', 'poland', 'italy', 'intunion'] as const
export const wotNations = ['ussr', 'germany', 'usa', 'china', 'france', 'uk', 'japan', 'czech', 'sweden', 'poland', 'italy'] as const
export const nationsIndexes = new Map<Nation, number>(nations.map((nation, index) => [nation, index]))
export type Nation = typeof nations[number]
