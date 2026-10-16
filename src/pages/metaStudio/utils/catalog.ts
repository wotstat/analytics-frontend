import { metaDefinitions } from '@/meta/resolver'

export const studioCards = metaDefinitions.map(card => {
  const separator = card.name.indexOf('/')
  const group = separator < 0 ? 'Другое' : card.name.slice(0, separator).trim()
  const name = separator < 0 ? card.name : card.name.slice(separator + 1).trim()
  return { ...card, group: group || 'Другое', name: name || card.id }
})

const groups = new Map<string, typeof studioCards>()
for (const card of studioCards) {
  const cards = groups.get(card.group) ?? []
  cards.push(card)
  groups.set(card.group, cards)
}

const groupOrder: Record<string, number> = { 'По умолчанию': -1, 'Другое': 1, Debug: 2 }

export const studioCardGroups = Array.from(groups, ([name, cards]) => ({ name, cards }))
  .sort((a, b) => (groupOrder[a.name] ?? 0) - (groupOrder[b.name] ?? 0) || a.name.localeCompare(b.name, 'ru'))
