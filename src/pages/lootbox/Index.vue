<template>
  <i>В этом разделе не учитываются фильтры по танкам, режимам и боям</i>
  <h2 class="page-title">Награды из коробок</h2>

  <div class="select-line flex">
    <p>Вид коробок</p>
    <select v-model="selectedContainer">
      <option value="any">Любой</option>
      <option v-for="tag in containerVariants">{{ tag }}</option>
    </select>
  </div>

  <div class="flex ver">
    <div class="card long">
      <GenericInfo :status="total.status" :value="total.data.count" :processor="useFixedSpaceProcessor(0)"
        description="Открытых коробок" color="green" />
    </div>

    <div class="flex">
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.gold" description="Золото" color="orange"
          :processor="useFixedSpaceProcessor(0)" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.prem" mini-data="дней" description="Премиум"
          color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.vehicles" description="Танки" color="gold" />
      </div>
    </div>

    <div class="flex">
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.credits" description="Серебро" color="blue"
          :processor="useFixedSpaceProcessor(0)" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="mainStats.status" :value="mainStats.data.freeXP" description="Свободный опыт"
          color="green" :processor="useFixedSpaceProcessor(0)" />
      </div>
    </div>
  </div>

  <h3>Вероятности</h3>
  <template
    v-if="goldStats.data.length + creditsStats.data.length + freeXpStats.data.length + premStats.data.length > 0">
    <p>Столбик <b>«На X»</b> означает нормализованный процент. То есть шанс выпадения определённого количества
      ресурсов, а не самого факта выпадения пакета. Позволяет рассчитать сколько коробок нужно открыть для получения
      <b>X</b> ресурсов.
    </p>
  </template>
  <TableSection title="Другие контейнеры" v-bind="lootboxesStats" :localizer="lootboxLocalizer" />
  <TableSection title="Техника" v-bind="vehiclesStats" :localizer="tankTagLocalizer" />
  <TableSection title="Золото" v-bind="goldStats" :by-number="1000" />
  <TableSection title="Серебро" v-bind="creditsStats" :by-number="100000" />
  <TableSection title="Свободный опыт" v-bind="freeXpStats" :by-number="10000" />
  <TableSection title="Премиум" v-bind="premStats"
    :localizer="(t) => t + ' ' + countLocalize(Number(t), 'день', 'дня', 'дней')" :by-number="1" />
  <TableSection title="Менеджмент" v-bind="managementStats" :localizer="managementLocalizer" />
  <TableSection title="Бустеры" v-bind="boostersStats" :localizer="boostersLocalizer" />
  <TableSection title="Учебные брошюры" v-bind="crewbooksStats" :localizer="crewbooksLocalizer" />
  <TableSection title="Расходники" v-bind="itemsStatsSorted" :localizer="itemsLocalizer" />
  <i>Локализация названий появится позже</i>
  <TableSection title="Кастомизация" v-bind="customizationsStats" :localizer="customizationLocalizer" />
  <i>Локализация названий появится позже</i>

</template>

<script lang="ts" setup>
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useQueryStatParams } from '@/composition/useQueryStatParams';
import { Status, dateToDbIndex, queryAsyncFirst, queryComputed, queryComputedFirst } from '@/db';
import { computed, ref } from 'vue';
import TableSection from "./TableSection.vue";
import { countLocalize, getTankName } from '@/utils/i18n';

const params = useQueryStatParams()

const selectedContainer = ref('any')

function whereClause(ignore: ('player' | 'tag' | 'date')[] = []) {
  const result = []

  if (selectedContainer.value != 'any' && !ignore.includes('tag')) {
    result.push(`containerTag = '${selectedContainer.value}'`)
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

const containerTag = queryComputed<{ containerTag: string }>(() => `
select containerTag, toUInt32(count()) as count from Event_OnLootboxOpen
where ${whereClause(['tag'])}
group by containerTag
order by containerTag desc
`)

const containerVariants = computed(() => containerTag.value.data.map((x: any) => x.containerTag))

const total = queryComputedFirst(() => `
select toUInt32(count()) as count
from Event_OnLootboxOpen
where ${whereClause()}
`, { count: 0 })

const mainStats = queryComputedFirst(() => `
select
    sum(premiumPlus) as prem,
    sum(credits) as credits,
    sum(freeXP) as freeXP,
    sum(gold) as gold,
    sum(length(addedVehicles)) as vehicles
from Event_OnLootboxOpen
where ${whereClause()}
`, { prem: 0, credits: 0, freeXP: 0, gold: 0, vehicles: 0 })

type Stats = {
  title: string,
  count: number,
  percent: number,
  other?: number
}


function getQuery(from: string, orderBy: string = '2 desc') {
  let where: string | null = whereClause(['tag'])
  if (where === 'true') {
    where = null
  }


  if (where) {
    return `
    with
      (select count() from Event_OnLootboxOpen) as lootboxesCount,
      (select count() from Event_OnLootboxOpen where ${where}) as personalLootboxesCount
    select title,
           toUInt32(countIf(${where})) as count,
           count / personalLootboxesCount as percent,
           toUInt32(count()) as total,
           total / lootboxesCount as other
    from ${from}
    ${selectedContainer.value == 'any' ? '' : `where containerTag = '${selectedContainer.value}'`}
    group by title
    order by ${orderBy}
    `
  } else {
    return `
    with
      (select count() from Event_OnLootboxOpen) as lootboxesCount
    select title,
           toUInt32(count()) as count,
           count / lootboxesCount as percent
    from ${from}
    ${selectedContainer.value == 'any' ? '' : `where containerTag = '${selectedContainer.value}'`}
    group by title
    order by ${orderBy}
    `
  }
}

const lootboxesStats = queryComputed<Stats>(() => getQuery(`
(select concat(tag, ':', count) as title, playerName, containerTag, id
from Event_OnLootboxOpen
array join lootboxes.tag as tag, lootboxes.count as count)
`, '1'))

const vehiclesStats = queryComputed<Stats>(() => getQuery(`
Event_OnLootboxOpen
array join Event_OnLootboxOpen.addedVehicles as title
`))

const goldStats = queryComputed<Stats>(() => getQuery(`
(select gold as title, playerName, containerTag, id from Event_OnLootboxOpen where gold > 0)
`, '1'))

const creditsStats = queryComputed<Stats>(() => getQuery(`
(select credits as title, playerName, containerTag, id from Event_OnLootboxOpen where credits > 0)
`, '1'))

const freeXpStats = queryComputed<Stats>(() => getQuery(`
(select freeXP as title, playerName, containerTag, id from Event_OnLootboxOpen where freeXP > 0)
`, '1'))

const premStats = queryComputed<Stats>(() => getQuery(`
(select premiumPlus as title, playerName, containerTag, id from Event_OnLootboxOpen where premiumPlus > 0)
`, '1'))

const customizationsStats = queryComputed<Stats>(() => getQuery(`
(select concat(type, '|', tag, '|', count) as title, playerName, containerTag, id
from Event_OnLootboxOpen
array join customizations.type as type, customizations.tag as tag, customizations.count as count)
`, '1'))

const managementStats = queryComputed<Stats>(() => getQuery(`
(select concat(name, ':', count) as title, * from (
    select arrayConcat(array(slots, berths), equip.count) as count,
           arrayConcat(array('slots', 'berths'), equip.tag) as name,
           playerName,
           containerTag,
           id
    from Event_OnLootboxOpen
)
array join count, name
where count > 0)
`, '1'))

const boostersStats = queryComputed<Stats>(() => getQuery(`
(select concat(boosters.tag, ':', boosters.value, ':', boosters.time, ':', boosters.count) as title,
playerName, containerTag, id
from Event_OnLootboxOpen
array join boosters.tag, boosters.value, boosters.time, boosters.count)
`, '1'))

const crewbooksStats = queryComputed<Stats>(() => getQuery(`
(select concat(tag, ':', count) as title, playerName, containerTag, id
from Event_OnLootboxOpen
array join crewBooks.tag as tag, crewBooks.count as count)
`, '1'))

const itemsStats = queryComputed<Stats>(() => getQuery(`
(select concat(items.tag, ':', items.count) as title,
playerName, containerTag, id
from Event_OnLootboxOpen
array join items.tag, items.count)
`, '1'))

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

function customizationLocalizer(title: string) {
  const [type, tag, count] = title.split('|')

  const typeLocal = {
    'projectionDecal': 'Декаль',
    'style': 'Стиль',
    'inscription': 'Надпись',
  }[type] || type


  const tagParts = tag.split('/')
  const tagLocal = tagParts[tagParts.length - 1].split('_').map(x => x[0].toUpperCase() + x.slice(1)).join(' ')

  return `${typeLocal}: ${tagLocal} (x${count})`
}

function tankTagLocalizer(tag: string) {
  return getTankName(tag)
}

function managementLocalizer(tag: string) {
  const [name, count] = tag.split(':')
  return ({
    'slots': 'Слоты',
    'berths': 'Койки',
    'demountKit': 'Демонтажный набор',
  }[name] || name) + ` (x${count})`
}

function boostersLocalizer(tag: string) {
  const [name, value, time, count] = tag.split(':')
  const localName = {
    booster_credits: 'Серебро',
    booster_xp: 'Опыт',
    booster_free_xp_and_crew_xp: 'Свободный и экипаж',
  }[name] || name

  const hours = Math.round(Number(time) / 3600 * 10) / 10

  return `${localName} +${value}% ${hours}ч (x${count})`
}

function crewbooksLocalizer(tag: string) {
  const [name, count] = tag.split(':')
  return `${name} (x${count})`
}

function itemsLocalizer(tag: string) {
  const [name, count] = tag.split(':')
  return `${name} (x${count})`
}

function lootboxLocalizer(tag: string) {
  const [name, count] = tag.split(':')
  return `${name} (x${count})`
}

</script>

<style lang="scss" scoped>
.page-title {}

.select-line {
  margin: 10px 0;
  flex-wrap: wrap;
  gap: 0 1rem;
}
</style>