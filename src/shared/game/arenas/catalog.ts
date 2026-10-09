import { computed } from 'vue'
import { DAILY_CACHE, queryAsync } from '@/db'
import { LOCALE, localizationRegionsSql, localizationRegionPrioritySql } from '@/shared/i18n/localization'

export type CatalogArena = { region: string, tag: string, name: string }

const catalogQuery = `
with locales as (
  select tag, argMax(name, ${localizationRegionPrioritySql}) as name
  from ArenasLocalizationDictionary
  where region in (${localizationRegionsSql}) and locale = '${LOCALE}'
  group by tag
)
select region, tag, name
from (select distinct region, tag from Arenas) as arenas
left any join locales using tag
order by ${localizationRegionPrioritySql} desc, region, tag
`

export const arenaCatalog = queryAsync<CatalogArena>(catalogQuery, {
  cache: DAILY_CACHE, proxyCache: true, format: 'JSONCompact',
})

export const arenasByTag = computed(() => new Map(arenaCatalog.value.data.map(arena => [arena.tag, arena])))
