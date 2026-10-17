import { defineMetaDefinition } from '@/meta/utils'
import DefaultMetaCard from '@/shared/ui/meta/defaultMetaCard/DefaultMetaCard.vue'

export const battleMeta = defineMetaDefinition({
  id: 'infographics-battle',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session',
  name: 'Инфографика/Бои',
  summary: 'Винрейт, время в бою и выживаемость.',
  examples: [
    { name: 'Бои', url: 'https://wotstat.info/session' },
  ],
  meta: {
    title: 'Сессионная инфографика',
    description: 'Серверная статистика по сессии игрока в Мир Танков и World of Tanks',
    keywords: 'инфографика, сессия, игрок, статистика, World of Tanks',
    imageAlt: 'Бои — WotStat Analytics',
  },
  props: {
    title: 'Бои',
    subtitle: 'Винрейт, время в бою и выживаемость',
    label: 'Инфографика',
  },
})

export const coverageMeta = defineMetaDefinition({
  id: 'infographics-coverage',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/players',
  name: 'Инфографика/Охват игроков',
  summary: 'Игроки, с которыми вы встречались в боях.',
  examples: [
    { name: 'Охват игроков', url: 'https://wotstat.info/session/players' },
  ],
  meta: {
    title: 'Охват игроков',
    description: 'Статистика охвата игроков в боях',
    keywords: 'охват игроков, статистика охвата игроков, статистика игроков, статистика игроков в боях',
    imageAlt: 'Охват игроков — WotStat Analytics',
  },
  props: {
    title: 'Охват игроков',
    subtitle: 'Игроки, с которыми вы встречались в боях',
    label: 'Инфографика',
  },
})

export const damageMeta = defineMetaDefinition({
  id: 'infographics-damage',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/damage',
  name: 'Инфографика/Урон',
  summary: 'Нанесённый и полученный урон в деталях.',
  examples: [
    { name: 'Урон', url: 'https://wotstat.info/session/damage' },
  ],
  meta: {
    title: 'Инфографика урона',
    description: 'Инфографика урона в боях',
    keywords: 'инфографика урона, статистика урона, статистика урона в боях',
    imageAlt: 'Урон — WotStat Analytics',
  },
  props: {
    title: 'Урон',
    subtitle: 'Нанесённый и полученный урон в деталях',
    label: 'Инфографика',
  },
})

export const mapsMeta = defineMetaDefinition({
  id: 'infographics-maps',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/maps',
  name: 'Инфографика/Карты',
  summary: 'Результаты боёв на разных картах.',
  examples: [
    { name: 'Карты', url: 'https://wotstat.info/session/maps' },
  ],
  meta: {
    title: 'Статистика карт',
    description: 'Статистика по картам в боях',
    keywords: 'статистика карт, статистика карт в боях, статистика карт в игре, статистика карт в world of tanks',
    imageAlt: 'Карты — WotStat Analytics',
  },
  props: {
    title: 'Карты',
    subtitle: 'Результаты боёв на разных картах',
    label: 'Инфографика',
  },
})

export const resultsMeta = defineMetaDefinition({
  id: 'infographics-results',
  component: DefaultMetaCard,
  priority: 10,
  match: url => url.pathname.replace(/\/$/, '') === '/session/results',
  name: 'Инфографика/Результаты',
  summary: 'Урон, насвет и эффективность в боях.',
  examples: [
    { name: 'Результаты', url: 'https://wotstat.info/session/results' },
  ],
  meta: {
    title: 'Статистика результатов',
    description: 'Статистика результатов боёв',
    keywords: 'статистика результатов, статистика результатов боёв, статистика результатов в игре, статистика результатов в world of tanks',
    imageAlt: 'Результаты — WotStat Analytics',
  },
  props: {
    title: 'Результаты',
    subtitle: 'Урон, насвет и эффективность в боях',
    label: 'Инфографика',
  },
})
