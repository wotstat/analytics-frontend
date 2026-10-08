import { DEFAULT_CACHE, MEDIUM_CACHE, SHORT_CACHE, dateToDbDate, dateToDbIndex, type CachePolicy } from '@/db'
import type { BattleModeSelectionKey } from '@/shared/game/battleModes/battleModeSelection'
import { battleModeColumns, battleModeConditions } from './battleModeFilter'
import { type MaybeRefOrGetter, type Ref, computed, toValue } from 'vue'
import { useStatQueryStorage } from './statQueryParams'

export type TankType = 'LT' | 'MT' | 'HT' | 'AT' | 'SPG';
export type TankLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type StatParams = {
  player: string | null
  level: TankLevel[] | null
  types: TankType[] | null
  tanks: string[] | null
  battleModes: BattleModeSelectionKey[]
  period: 'allTime' | {
    type: 'lastX'
    count: number
  } | {
    type: 'fromTo',
    from: Date,
    to: Date
  } | {
    type: 'fromToNow',
    from: Date
  }
  battleId: string[] | null
};

export function useQueryStatParams() {
  const { params } = useStatQueryStorage()
  return computed<StatParams>(() => {
    const { nickname, level, types, tanks, battleModes, battleId, lastX, from, to } = params
    const result: StatParams = {
      player: nickname.value || null,
      level: level.value.length ? [...level.value] : null,
      types: types.value.length ? [...types.value] : null,
      tanks: tanks.value.length ? [...tanks.value] : null,
      battleModes: [...battleModes.value],
      battleId: battleId.value.length ? [...battleId.value] : null,
      period: 'allTime'
    }

    if (result.battleId) return result
    if (from.value && to.value) result.period = { type: 'fromTo', from: from.value, to: to.value }
    else if (from.value) result.period = { type: 'fromToNow', from: from.value }
    else if (lastX.value !== undefined) result.period = { type: 'lastX', count: lastX.value }
    return result
  })
}

export function getQueryStatParamsCache(params: StatParams) {
  if (params.player) return undefined
  if (params.period === 'allTime') return MEDIUM_CACHE
  if (params.period.type == 'lastX') return SHORT_CACHE
  return DEFAULT_CACHE
}

export function useQueryStatParamsCache(params: Ref<StatParams>) {
  return computed<CachePolicy | undefined>(() => {
    return getQueryStatParamsCache(params.value)
  })
}

function whereClauseArray(params: StatParams, ignore: ('player' | 'level' | 'types' | 'tanks' | 'id' | 'battleModes')[] = []) {
  const result: string[] = []
  if (!ignore.includes('player') && params.player) result.push(`playerName = '${params.player}'`)
  if (!ignore.includes('level') && params.level) result.push(`tankLevel in (${params.level.sort().join(', ')})`)
  if (!ignore.includes('types') && params.types) result.push(`tankType in ('${params.types.sort().join("', '")}')`)
  if (!ignore.includes('tanks') && params.tanks) result.push(`tankTag in ('${params.tanks.sort().join("', '")}')`)
  if (!ignore.includes('battleModes') && params.battleId === null) {
    result.push(...battleModeConditions(params.battleModes))
  }
  return result
}

function whereClauseArrayColumns(params: StatParams, ignore: ('player' | 'level' | 'types' | 'tanks' | 'id' | 'battleModes')[] = []) {
  const result: string[] = []
  if (!ignore.includes('player') && params.player) result.push('playerName')
  if (!ignore.includes('level') && params.level) result.push('tankLevel')
  if (!ignore.includes('types') && params.types) result.push('tankType')
  if (!ignore.includes('tanks') && params.tanks) result.push('tankTag')
  if (!ignore.includes('battleModes') && params.battleId === null) {
    result.push(...battleModeColumns(params.battleModes))
  }
  return result
}

type Options = Partial<{
  withWhere: boolean,
  isBattleStart: boolean,
  ignore: ('player' | 'level' | 'types' | 'tanks' | 'id' | 'battleModes')[],
  additional: string[] | string
}>

export function whereClause(params: MaybeRefOrGetter<StatParams>, options: Options = { withWhere: true, isBattleStart: false, ignore: [], additional: [] }) {
  const { withWhere, isBattleStart, ignore } = options

  const valueParams = toValue(params)
  const result: string[] = whereClauseArray(valueParams, ignore)

  if (!ignore?.includes('id')) {
    if (valueParams.battleId && valueParams.battleId.length > 0) {
      result.push(`${isBattleStart ? 'id' : 'onBattleStartId'} in (${valueParams.battleId.map(t => `'${t}'`).join(', ')})`)
    } else if (valueParams.period !== 'allTime') {
      if (valueParams.period.type == 'fromTo') {
        result.push(`id >= '${dateToDbIndex(valueParams.period.from)}'`)
        result.push(`id <= '${dateToDbIndex(valueParams.period.to)}'`)

        result.push(`dateTime >= '${dateToDbDate(valueParams.period.from)}'`)
        const toDate = new Date(valueParams.period.to.getTime() + 24 * 60 * 60 * 1000)
        result.push(`dateTime <= '${dateToDbDate(toDate)}'`)

      } else if (valueParams.period.type == 'fromToNow') {
        result.push(`id >= '${dateToDbIndex(valueParams.period.from)}'`)
        result.push(`dateTime >= '${dateToDbDate(valueParams.period.from)}'`)
      } else if (valueParams.period.type == 'lastX') {
        const whereClause = whereClauseArray(valueParams, ignore)
        const lastIDs = `(select id from Event_OnBattleStart ${whereClause.length == 0 ? '' : `where ${whereClause.join(' AND ')}`} order by id desc limit ${valueParams.period.count})`
        result.push(`${isBattleStart ? 'id' : 'onBattleStartId'} in ${lastIDs}`)
      }
    }
  }

  if (Array.isArray(options.additional))
    result.push(...options.additional)
  else if (typeof options.additional === 'string' && options.additional.trim().length > 0)
    result.push(options.additional)

  return result.length == 0 ? '' : (withWhere === false ? ' and ' : 'where ') + result.join(' AND ')
}

export function whereClauseColumns(params: MaybeRefOrGetter<StatParams>, options: Options = { withWhere: true, isBattleStart: false, ignore: [] }) {
  const { isBattleStart, ignore } = options
  const valueParams = toValue(params)

  const result: string[] = whereClauseArrayColumns(valueParams, ignore)

  if (valueParams.battleId && valueParams.battleId.length > 0) {
    result.push(isBattleStart ? 'id' : 'onBattleStartId')
  } else if (valueParams.period !== 'allTime') {
    if (['fromTo', 'fromToNow'].includes(valueParams.period.type)) {
      result.push('id')
    } else if (valueParams.period.type == 'lastX') {
      result.push(isBattleStart ? 'id' : 'onBattleStartId')
    }
  }

  return result
}
