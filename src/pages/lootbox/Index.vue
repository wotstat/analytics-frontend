<template>
  <!-- <i>В этом разделе учитывается только фильтр по нику игрока</i> -->
  <LootboxList v-model="selectedContainer" />

  <h2 class="page-title">Награды из коробок</h2>

  <div class="flex ver">
    <div class="card long">
      <GenericInfo :status="total.status" :value="total.data.count" :processor="useFixedSpaceProcessor(0)"
        description="Открытых коробок" color="green" />
    </div>

    <div class="flex hor-ver-small">
      <div class="card flex-1 order-small-3">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.gold" description="Золото" color="orange"
          :processor="useLogProcessor()" />
      </div>
      <div class="card flex-1 order-small-2">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.prem" mini-data="дней" description="Премиум"
          color="yellow" :processor="useLogProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.vehicles" description="Танки" color="gold"
          :processor="useFixedSpaceProcessor(0)" />
      </div>
    </div>

    <div class="flex hor-ver-small">
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.credits" description="Серебро" color="blue"
          :processor="useLogProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.freeXP" description="Свободный опыт"
          color="green" :processor="useLogProcessor()" />
      </div>
    </div>


    <SnowCardWrapper>
      <div class="card long">
        <GenericInfo :status="mainStats.status"
          :value="mainStats.data.mandarin25 + mainStats.data.compensatedMandarin25"
          :processor="useFixedSpaceProcessor(0)" description="Новогодние мандарины на Лесте" color="gold" />
      </div>
    </SnowCardWrapper>
    <i>* С учётом компенсаций. Танки только реально начисленные</i>
    <i>
      <ul class="margin-0">
        <li>k – тысяч</li>
        <li>M – миллионов</li>
        <li>B – миллиардов</li>
        <li>T – триллионов</li>
      </ul>
    </i>
  </div>

  <OpenByTable v-if="openWithStats.status == success && openWithStats.data.length" :localizer="lootboxLocalizer"
    :data="openWithStats.data" />

  <RerollTable v-if="rerollStats.status == success && rerollStats.data.length" :data="rerollStats.data"
    :localizer="lootboxLocalizer" />

  <h3>Вероятности</h3>
  <template
    v-if="goldStats.data.length + creditsStats.data.length + freeXpStats.data.length + premStats.data.length > 0">
    <p>Столбик <b>«На X»</b> означает нормализованный процент. То есть шанс выпадения определённого количества
      ресурсов, а не самого факта выпадения пакета. Позволяет рассчитать сколько коробок нужно открыть для получения
      <b>X</b> ресурсов.
    </p>
  </template>
  <TableSection title="Другие контейнеры" v-bind="lootboxesStats" :localizer="lootboxLocalizer" :showOther />

  <TableSection title="Мандарины" v-bind="mandarin25Stats" :by-number="1000" :showOther />
  <TableSection title="Техника" v-bind="vehiclesStats" :localizer="tankTagLocalizer" :showOther />
  <TableSection title="Золото" v-bind="goldStats" :by-number="1000" :showOther />
  <TableSection title="Серебро" v-bind="creditsStats" :by-number="100000" :showOther />
  <TableSection title="Свободный опыт" v-bind="freeXpStats" :by-number="10000" :showOther />
  <TableSection title="Премиум" v-bind="premStats"
    :localizer="(t) => t + ' ' + countLocalize(Number(t), 'день', 'дня', 'дней')" :by-number="1" :showOther />
  <TableSection title="Менеджмент" v-bind="managementStats" :localizer="managementLocalizer" :showOther />
  <TableSection title="Бустеры" v-bind="boostersStats" :localizer="boostersLocalizer" :showOther />
  <TableSection title="Учебные брошюры" v-bind="crewbooksStats" :localizer="crewbooksLocalizer" :showOther />
  <TableSection title="Расходники" v-bind="itemsStatsSorted" :localizer="itemsLocalizer" :left-align="true"
    :showOther />
  <TableSection title="Кастомизация" v-bind="customizationsStats" :localizer="customizationLocalizer" :left-align="true"
    :showOther />
  <TableSection title="Новогодние игрушни" v-bind="toysStats" :localizer="toysLocalizer" :left-align="true"
    :showOther />

</template>

<script lang="ts" setup>
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { useFixedSpaceProcessor, useLogProcessor } from '@/composition/usePercentProcessor';
import { useQueryStatParams, useQueryStatParamsCache } from '@/composition/useQueryStatParams';
import { Status, dateToDbIndex, queryComputed, queryComputedFirst, success } from '@/db';
import { computed, ref } from 'vue';
import TableSection from "./TableSection.vue";
import OpenByTable from "./OpenByTable.vue";
import RerollTable from './RerollTable.vue';
import { countLocalize, crewBookName, getBestLocalization, getTankName, LocalizedName } from '@/utils/i18n';
import SnowCardWrapper from '@/components/shared/SnowCardWrapper.vue';
import LootboxList from './LootboxList/Index.vue';
import { useRoute } from 'vue-router';


const params = useQueryStatParams()
const settings = useQueryStatParamsCache(params)

function localeFor(table: 'Lootboxes' | 'Customizations' | 'Artefacts') {
  return `select tag, arrayZip(groupArray(name), groupArray(region)) as locale from (select tag, region, argMax(name, gameVersion) as name from ${table} group by tag, region order by region) group by tag`
}

const route = useRoute()
const selectedContainer = ref<string[]>((route.query.selectedLootbox as string)?.split(',') || [])

function whereClause(ignore: ('player' | 'tag' | 'date')[] = []) {
  const result = []

  if (selectedContainer.value.length != 0 && !ignore.includes('tag')) {
    result.push(`containerTag in (${selectedContainer.value.map(x => `'${x}'`).join(', ')})`)
  }

  if (params.value.player && !ignore.includes('player')) {
    result.push(`playerName = '${params.value.player}'`)
  }

  const valueParams = params.value

  if (valueParams.period !== 'allTime' && !ignore.includes('date')) {
    if (valueParams.period.type == 'fromTo') {
      result.push(`id >= ${dateToDbIndex(valueParams.period.from)}`);
      result.push(`id <= ${dateToDbIndex(valueParams.period.to)}`);
    } else if (valueParams.period.type == 'fromToNow') {
      result.push(`id >= ${dateToDbIndex(valueParams.period.from)}`);
    }
  }

  return result.join(' and ') || 'true'
}

const total = queryComputedFirst(() => `
select toUInt32(count()) as count
from Event_OnLootboxOpen
where ${whereClause()} and isOpenSuccess
`, { count: 0 })

const openWithStats = queryComputed<{ tag: string, locale: LocalizedName, count: number, successCount: number, totalCount?: number, totalSuccess?: number }>(() => {
  let where: string | null = whereClause(['tag'])
  if (where === 'true') where = null

  return where ? `
    with locales as (${localeFor('Lootboxes')})
    select tag, locale, count, successCount, totalCount, totalSuccess
    from (
        select tag, count, successCount, P2.count as totalCount, P2.successCount as totalSuccess
        from (
            select openByTag as tag, toUInt32(count()) as count, toUInt32(countIf(isOpenSuccess)) as successCount
            from Event_OnLootboxOpen
            where ${whereClause()} and openByTag != Event_OnLootboxOpen.containerTag
            group by tag
        ) as P
        join (
            select openByTag as tag, toUInt32(count()) as count, toUInt32(countIf(isOpenSuccess)) as successCount
            from Event_OnLootboxOpen
            where openByTag != Event_OnLootboxOpen.containerTag and ${whereClause(['date', 'player'])}
            group by tag
        ) as P2
        using tag
    ) as M
    left join locales using tag
  ` : `
    with locales as (${localeFor('Lootboxes')})
    select tag, locale, count, successCount
    from (
        select openByTag as tag, toUInt32(count()) as count, toUInt32(countIf(isOpenSuccess)) as successCount
        from Event_OnLootboxOpen
        where ${whereClause()} and openByTag != Event_OnLootboxOpen.containerTag
        group by openByTag
    ) as M
    left join locales using tag
`})

const rerollStats = queryComputed<{ tag: string, locale: LocalizedName, count: number, rerollCount: number, totalCount?: number, totalReroll?: number }>(() => {
  let where: string | null = whereClause(['tag'])
  if (where === 'true') where = null

  return where ? `
    with lacale as (${localeFor('Lootboxes')})
    select tag, locale, count, rerollCount, totalCount, totalReroll
    from (
        select tag, count, rerollCount, P2.count as totalCount, P2.rerollCount as totalReroll
        from (
            select openByTag as tag, toUInt32(count()) as count, toUInt32(countIf(not claimed)) as rerollCount
            from Event_OnLootboxOpen
            where ${whereClause()}
            group by tag
        ) as P
        join (
            select openByTag as tag, toUInt32(count()) as count, toUInt32(countIf(not claimed)) as rerollCount
            from Event_OnLootboxOpen
            where ${whereClause(['date', 'player'])}
            group by tag
        ) as P2
        using tag
    ) as M
    left join lacale using tag
    having rerollCount > 0 and totalReroll > 0
  ` : `
    with locales as (${localeFor('Lootboxes')})
    select tag, locale, count, rerollCount
    from (
        select containerTag as tag, count() as count, countIf(not claimed) as rerollCount
        from Event_OnLootboxOpen
        where ${whereClause()}
        group by containerTag
        having rerollCount > 0
    ) as M
    left join locales using tag
  `
})

const mainStats = queryComputedFirst(() => `
select
    sum(premiumPlus) as prem,
    sum(credits) as credits,
    sum(freeXP) as freeXP,
    sum(gold) + sum(arraySum(compensatedVehicles.gold)) as gold,
    toUInt32(sum(length(addedVehicles))) as vehicles,
    toUInt32(sum(arraySum(arrayFilter(t -> t.1 == 'ny25_mandarin', arrayZip(extra.tag, extra.count)).2))) as mandarin25,
    toUInt32(sum(arraySum(arrayFilter(t -> t.1 == 'ny25_mandarin', arrayZip(compensatedToys.currency, compensatedToys.count)).2))) as compensatedMandarin25
from Event_OnLootboxOpen
where ${whereClause()}
  `, { prem: 0, credits: 0, freeXP: 0, gold: 0, vehicles: 0, mandarin25: 0, compensatedMandarin25: 0 })

type Stats = {
  title: string,
  count: number,
  percent: number,
  other?: number
}

const showOther = computed(() => whereClause(['tag', 'date']) !== 'true')

function getQuery(select: string, arrayJoin: string, materialized: string, tagProcessor?: string, localizeTable?: string) {
  let where: string | null = whereClause(['tag'])
  if (where === 'true') where = null

  const whereTag = selectedContainer.value.length == 0 ? '' : `containerTag in (${selectedContainer.value.map(x => `'${x}'`).join(', ')})`

  const whereWhereTag = whereTag ? `where ${whereTag} and isOpenSuccess` : 'where isOpenSuccess'
  const andWhereTag = whereTag ? `and ${whereTag} ` : ''

  const groupBy = 'title' + (select.includes('tag') ? ', tag' : '')


  const prefix = localizeTable ? 'select title, count, percent, total, other, locale as titleName from (' : ''
  const simplePrefix = localizeTable ? 'select title, count, percent, locale as titleName from (' : ''
  const postfix = localizeTable ? `) as M left join
(select tag, arrayZip(groupArray(name), groupArray(region)) as locale from ${localizeTable} group by tag)
  as L using tag` : ''

  return where ? `
with
  (select count() from Event_OnLootboxOpen where ${where} ${andWhereTag}) as personalLootboxesCount,
  (select count() from Event_OnLootboxOpen ${whereWhereTag}) as lootboxesCount
    ${prefix}
    select title,
  ${tagProcessor ? tagProcessor + ' as tag' : 'tag'},
toUInt32(playerCount) as count,
  playerCount / personalLootboxesCount as percent,
  toUInt32(total) as total,
  total / lootboxesCount as other
from
  (
    select ${select}, count() as playerCount
        from Event_OnLootboxOpen
        ${arrayJoin} and ${where} ${andWhereTag}
        group by ${groupBy}
        having playerCount > 0
  ) as T

join

  (
    select title, countMerge(count) as total
        from ${materialized}
        ${whereWhereTag}
        group by title
  ) as T2
using title
    order by title
    ${postfix}
` : `
with
(select count() from Event_OnLootboxOpen ${whereWhereTag}) as lootboxesCount
    ${simplePrefix}
    select title,
  ${tagProcessor ? tagProcessor + ' as tag' : 'tag'},
toUInt32(countMerge(count)) as count,
  count / lootboxesCount as percent
    from ${materialized}
    ${whereWhereTag}
    group by ${groupBy}
    order by title
    ${postfix}
`

}

function load(queryString: () => string) {
  return queryComputed<Stats>(queryString, { settings: settings.value })
}

const lootboxesStats = load(() => getQuery(
  `concat(tag, ':', count) as title, tag`,
  `array join lootboxes.tag as tag, lootboxes.count as count where true`,
  `lootbox_lootbox_mv`,
  undefined,
  'Lootboxes'
))

const vehiclesStats = computed(() => {
  const data =
    load(() => getQuery(
      `title`,
      `array join arrayConcat(addedVehicles, compensatedVehicles.tag) as title where true`,
      `lootbox_vehicle_mv`,
      'title'
    ))

  return {
    data: data.value.data.sort((a, b) => a.count - b.count),
    status: data.value.status as Status
  }
})

const mandarin25Stats = load(() => getQuery(
  `title`,
  `array join arrayFilter(t -> t.1 == 'ny25_mandarin', arrayZip(extra.tag, extra.count)).2 as title where title > 0`,
  `lootbox_ny25mandarin_mv`,
  'title'
))

const toysStats = load(() => getQuery(
  `concat(tag, '|', toys.count) as title, tag`,
  `array join toys.tag as tag, toys.count where tag != ''`,
  `lootbox_toys_mv`,
  `splitByChar('|', tag)[1]`,
  `Toys`
))

const goldStats = load(() => getQuery(
  `(gold - arraySum(compensatedVehicles.gold)) as title`,
  `where title > 0`,
  `lootbox_gold_mv`,
  'title'
))

const creditsStats = load(() => getQuery(
  `credits as title`,
  `where credits > 0`,
  `lootbox_credits_mv`,
  'title'
))

const freeXpStats = load(() => getQuery(
  `freeXP as title`,
  `where freeXP > 0`,
  `lootbox_free_xp_mv`,
  'title'
))

const premStats = load(() => getQuery(
  `premiumPlus as title`,
  `where premiumPlus > 0`,
  `lootbox_premium_mv`,
  'title'
))

const customizationsStats = load(() => getQuery(
  `concat(customizations.type, '|', tag, '|', customizations.count) as title, tag`,
  `array join customizations.type, customizations.tag as tag, customizations.count where true`,
  `lootbox_customizations_mv`,
  `splitByChar(':', tag)[2]`,
  `Customizations`
))

const managementStats = load(() => getQuery(
  `concat(tag, ':', count) as title, tag`,
  `array join arrayConcat(array(slots, berths), equip.count) as count,
  arrayConcat(array('slots', 'berths'), equip.tag) as tag
     where count > 0`,
  `lootbox_equipment_mv`
))

const boostersStats = load(() => getQuery(
  `concat(tag, ':', boosters.value, ':', boosters.time, ':', boosters.count) as title, tag`,
  `array join boosters.tag as tag, boosters.value, boosters.time, boosters.count where true`,
  `lootbox_boosters_mv`
))

const crewbooksStats = load(() => getQuery(
  `concat(tag, ':', count) as title, tag`,
  `array join crewBooks.tag as tag, crewBooks.count as count where true`,
  `lootbox_crewbook_mv`
))

const itemsStats = load(() => getQuery(
  `concat(tag, ':', itemCount) as title, tag`,
  `array join items.tag as tag, items.count as itemCount where true`,
  `lootbox_item_mv`,
  undefined,
  `Artefacts`
))

const itemsStatsSorted = computed(() => {

  const data = itemsStats.value.data

  const sorted = data.sort((a: any, b: any) => {
    const aName = a.title.split(':')[0]
    const bName = b.title.split(':')[0]

    function compareBy(part: string) {
      if (aName.includes(part) && !bName.includes(part)) {
        return 1
      } else if (!aName.includes(part) && bName.includes(part)) {
        return -1
      }

      return null
    }

    const boosterCompare = compareBy('Booster')
    if (boosterCompare) return boosterCompare

    const modernizedCompare = compareBy('modernized')
    if (modernizedCompare) return modernizedCompare

    return aName.localeCompare(bName)
  })

  return {
    data: sorted,
    status: itemsStats.value.status as Status
  }

})


function customizationLocalizer(title: string, titleName?: LocalizedName) {
  const [type, tag, count] = title.split('|')

  const typeLocal = {
    'camouflage': 'Камуфляж',
    'projectionDecal': 'Декаль',
    'style': 'Стиль',
    'inscription': 'Надпись',
  }[type] || type


  const tagParts = tag.split('/')
  const tagLocal = tagParts[tagParts.length - 1].split('_').map(x => x[0].toUpperCase() + x.slice(1)).join(' ')

  return {
    prefix: `${typeLocal}: `,
    value: `${titleName ? getBestLocalization(titleName) : tagLocal} `,
    postfix: `(x${count})`
  }
}

function toysLocalizer(title: string, titleName?: LocalizedName) {
  const [tag, count] = title.split('|')
  return {
    value: titleName ? getBestLocalization(titleName) ?? title : title,
    postfix: `(x${count})`
  }
}

function tankTagLocalizer(tag: string) {
  return getTankName(tag)
}

function managementLocalizer(tag: string) {
  const [name, count] = tag.split(':')

  const localName = {
    'slots': 'Слоты',
    'berths': 'Койки',
    'demountKit': 'Демонтажный набор',
    'recertificationForm': 'Бланк переподготовки',
  }[name] || name

  return {
    value: localName,
    postfix: count != '1' ? `(x${count})` : undefined
  }
}

function boostersLocalizer(tag: string) {
  const [name, value, time, count] = tag.split(':')
  const localName = {
    booster_credits: 'Серебро',
    booster_xp: 'Опыт',
    booster_free_xp_and_crew_xp: 'Свободный и экипаж',
  }[name] || name

  const hours = Math.round(Number(time) / 3600 * 10) / 10

  return {
    value: `${localName} +${value}% ${hours} ч`,
    postfix: count != '1' ? `(x${count})` : undefined
  }
}

function crewbooksLocalizer(tag: string) {
  const [name, count] = tag.split(':')

  const postfix = parseInt(count) ? count != '1' ? `(x${count})` : undefined : `(${count})`

  return {
    value: `${crewBookName(name)} `,
    postfix
  }
}

function itemsLocalizer(tag: string, titleName?: LocalizedName) {
  const [name, count] = tag.split(':')


  let prefix = ''
  if (name.includes('BattleBooster')) {
    prefix = 'Инструкция:'
  }


  return {
    prefix: prefix,
    value: titleName ? getBestLocalization(titleName) ?? name : name,
    postfix: count != '1' ? `(x${count})` : undefined
  }
}

function lootboxLocalizer(tag: string, titleName?: LocalizedName) {
  const [name, count] = tag.split(':')
  return {
    value: titleName ? getBestLocalization(titleName) ?? name : name,
    postfix: count != '1' ? `(x${count})` : undefined
  }
}

</script>

<style lang="scss" scoped>
@use '/src/styles/mixins.scss' as *;

.select-line {
  margin: 10px 0;
  flex-wrap: wrap;
  gap: 0 1rem;
}

.order-small-2 {
  @include less-small {
    order: 2;
  }
}

.order-small-3 {
  @include less-small {
    order: 3;
  }
}
</style>