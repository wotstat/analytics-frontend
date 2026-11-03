import { defineMetaDefinition } from '@/meta/utils'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

export const marksMeta = defineMetaDefinition({
  id: 'vehicle-marks',
  priority: 10,
  match: url => {
    const pathname = url.pathname.replace(/\/$/, '')
    return pathname === '/session/marks' || pathname === '/services/marks'
  },
  component: MetaCard,
  name: 'Техника/Отметки на стволах',
  summary: 'Планки первой, второй, третьей отметок и 100%.',
  examples: [
    { name: 'Отметки', url: 'https://wotstat.info/services/marks' },
    { name: 'Отметки в инфографике', url: 'https://wotstat.info/session/marks' },
  ],
  meta: {
    title: 'Отметки на стволах — WotStat',
    description: 'Актуальные планки отметок на стволах по танкам и регионам, история изменений и сравнение техники.',
    imageAlt: 'Отметки на стволах — WotStat',
  },
  props: {
    title: 'Отметки на стволах',
    subtitle: 'Первая · Вторая · Третья · 100%',
    label: 'Планки техники',
    footer: 'Мир танков · World of Tanks',
  },
})

export const masteryMeta = defineMetaDefinition({
  id: 'vehicle-mastery',
  priority: 10,
  match: url => {
    const pathname = url.pathname.replace(/\/$/, '')
    return pathname === '/session/mastery' || pathname === '/services/mastery'
  },
  component: MetaCard,
  name: 'Техника/Знаки классности',
  summary: 'Планки трёх степеней классности и мастера.',
  examples: [
    { name: 'Знаки классности', url: 'https://wotstat.info/services/mastery' },
    { name: 'Знаки классности в инфографике', url: 'https://wotstat.info/session/mastery' },
  ],
  meta: {
    title: 'Знаки классности — WotStat',
    description: 'Актуальные планки знаков классности по танкам и регионам, история изменений и сравнение техники.',
    imageAlt: 'Знаки классности — WotStat',
  },
  props: {
    title: 'Знаки классности',
    subtitle: 'III степень · II степень · I степень · Мастер',
    label: 'Планки техники',
    footer: 'Мир танков · World of Tanks',
  },
})
