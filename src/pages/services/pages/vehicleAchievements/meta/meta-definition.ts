import { defineMetaDefinition, everyDays } from '@/meta/utils'
import { vehiclesMetaCatalog, type VehiclesMetaCatalog } from '../../vehicles/meta/utils/catalog'
import { selectionLabels } from '../../vehicles/meta/utils/selectionLabels'
import { summarize, vehicleLabel, vehicleMetaTitle } from '../../vehicles/meta/utils/tags'
import { achievementLabel } from '../utils/achievementSeries'
import type { AchievementKind } from '../utils/achievements'
import AchievementTableMetaCard from './AchievementTableMetaCard.vue'
import AchievementCompareMetaCard from './AchievementCompareMetaCard.vue'
import { readAchievementMetaParams } from './utils/params'

const copy = {
  marks: { heading: 'Отметки на стволах', description: 'Планки суммарного урона для первой, второй, третьей отметок и 100%.' },
  mastery: { heading: 'Знаки классности', description: 'Планки чистого опыта для III, II, I степени и знака «Мастер».' },
}

const cache = { htmlSeconds: 10, imageSeconds: 3600 }
const revisionKey = () => everyDays(1)

function matches(url: URL, kind: AchievementKind) {
  const path = url.pathname.replace(/\/$/, '')
  return path === `/services/${kind}` || path === `/session/${kind}`
}

function tableDefinition(kind: AchievementKind) {
  const { heading, description } = copy[kind]
  return {
    id: `vehicle-${kind}`, name: `Техника/${heading}`, priority: 10,
    component: AchievementTableMetaCard, props: { kind, heading },
    match: (url: URL) => matches(url, kind),
    summary: description, cache, revisionKey,
    examples: [
      { name: 'Планки · RU', url: `https://wotstat.info/services/${kind}` },
      { name: 'EU · тяжёлые танки X уровня', url: `https://wotstat.info/session/${kind}?region=EU&level=10&type=HT` },
      { name: 'По приросту за неделю', url: `https://wotstat.info/services/${kind}?delta=week&delta-sort=1` },
    ],
    meta: (url: URL) => {
      const { region, filters } = readAchievementMetaParams(kind, url)
      const details = selectionLabels(filters)
      if (filters.search) details.push(`Поиск: «${filters.search.slice(0, 60)}»`)

      const subject = [heading, region, ...details].join(' · ')
      return {
        title: vehicleMetaTitle(heading, region, details.join(' · ')),
        description,
        imageAlt: `Таблица планок: ${subject}`,
      }
    },
  }
}

function compareDefinition(kind: AchievementKind) {
  const { heading } = copy[kind]
  const base = `https://wotstat.info/services/${kind}`
  const metric = kind === 'marks' ? 'marks-p95' : 'mastery-p99'

  return {
    id: `vehicle-${kind}-compare`, name: `Техника/${heading} · сравнение`, priority: 100,
    component: AchievementCompareMetaCard, props: { kind, heading },
    match: (url: URL) => matches(url, kind) && Boolean(url.searchParams.get('compare')?.trim()),
    contexts: { vehiclesMetaCatalog }, cache, revisionKey,
    summary: 'Динамика выбранных планок по танкам и регионам.',
    examples: [
      { name: 'ИС-7 · все планки', url: `${base}?compare=HpeZ` },
      { name: 'Два танка · одна планка', url: `${base}?compare=4u2COGR&metric=${metric}` },
      { name: 'ИС-7 · RU и EU · по неделям', url: `${base}?compare=I6lztDPPLRlKi2EFqmqVPtLaZL4ZGpVq7IO&step=week` },
    ],
    meta: (url: URL, { vehiclesMetaCatalog: catalog }: { vehiclesMetaCatalog?: VehiclesMetaCatalog }) => {
      const params = readAchievementMetaParams(kind, url)
      const sources = params.compare.filter(source => source.enabled)
      const regions = [...new Set(sources.flatMap(source => source.filters.regions))]

      const names = sources.flatMap(({ target, filters }) => {
        if (!('tank' in target)) return []
        const name = vehicleLabel(target.tank, filters, catalog)
        return name ? [name] : []
      })
      let details = 'Сравнение'
      if (names.length && names.length === sources.length) details = summarize([...new Set(names)])

      const region = regions.join(' / ') || params.region
      const metrics = params.metrics.map(achievementLabel).join(', ')
      const metricSuffix = metrics ? `: ${metrics}` : ''
      return {
        title: vehicleMetaTitle(heading, details, region),
        description: `Динамика планок по выбранным танкам${metricSuffix}.`,
        imageAlt: `График: ${[heading, details, region].join(' · ')}`,
      }
    },
  }
}

export const marksMeta = defineMetaDefinition(tableDefinition('marks'))
export const masteryMeta = defineMetaDefinition(tableDefinition('mastery'))
export const marksCompareMeta = defineMetaDefinition(compareDefinition('marks'))
export const masteryCompareMeta = defineMetaDefinition(compareDefinition('mastery'))
