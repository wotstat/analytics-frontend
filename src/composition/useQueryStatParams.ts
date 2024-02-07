import { dateToDbIndex } from "@/db";
import { customBattleModes } from "@/utils/wot";
import { useRoute } from "vue-router";

export type TankType = 'LT' | 'MT' | 'HT' | 'AT' | 'SPG';
export type TankLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type StatParams = {
  player: string | null;
  level: TankLevel[] | null;
  types: TankType[] | null;
  tanks: string[] | null;
  battleMode: keyof typeof customBattleModes | 'any';
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
};

export function useQueryStatParams() {
  const route = useRoute();

  const result: StatParams = {
    period: 'allTime',
    player: null,
    level: null,
    types: null,
    tanks: null,
    battleMode: 'any',
  }

  if ('nickname' in route.query) result.player = route.query.nickname as string;
  if ('level' in route.query) {
    const level = route.query.level as string;
    const splitted = level.split(',');
    result.level = splitted
      .map(t => parseInt(t))
      .filter(t => !isNaN(t))
      .filter(t => t >= 1 && t <= 10) as TankLevel[];
  }

  if ('mode' in route.query) {
    const battleMode = route.query.mode as string;

    if (battleMode in customBattleModes) {
      result.battleMode = battleMode as keyof typeof customBattleModes;
    }
  }

  if ('type' in route.query) {
    const type = route.query.type as string;
    const splitted = type.split(',');
    result.types = splitted
      .filter(t => ['LT', 'MT', 'HT', 'AT', 'SPG'].includes(t)) as TankType[];
  }

  if ('tank' in route.query) {
    const tank = route.query.tank as string;
    const splitted = tank.split(',');
    result.tanks = splitted;
  }

  if ('lastX' in route.query) {
    const lastX = route.query.lastX as string;
    const count = parseInt(lastX);
    if (!isNaN(count)) {
      result.period = {
        type: 'lastX',
        count
      }
    }
  } else if ('from' in route.query && 'to' in route.query) {
    const from = new Date(route.query.from as string);
    const to = new Date(route.query.to as string);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      result.period = {
        type: 'fromTo',
        from,
        to
      }
    }
  } else if ('from' in route.query) {
    const from = new Date(route.query.from as string);
    if (!isNaN(from.getTime())) {
      result.period = {
        type: 'fromToNow',
        from
      }
    }
  }

  return result;
}

function whereClauseArray(params: StatParams) {
  const result: string[] = [];
  if (params.player) result.push(`playerName = '${params.player}'`);
  if (params.level) result.push(`tankLevel in (${params.level.join(', ')})`);
  if (params.types) result.push(`tankType in ('${params.types.join("', '")}')`);
  if (params.tanks) result.push(`tankTag in ('${params.tanks.join("', '")}')`);
  if (params.battleMode !== 'any') {
    const t = customBattleModes[params.battleMode];
    if ('mode' in t) result.push(`battleMode = '${t.mode}'`);
  }
  if (params.battleMode !== 'any') {
    const t = customBattleModes[params.battleMode];
    if ('gameplay' in t) result.push(`battleGameplay = '${t.gameplay}'`);
  }
  return result;
}

export function whereClause(params: StatParams, { withWhere, isBattleStart }: Partial<{ withWhere: boolean, isBattleStart: boolean }> = { withWhere: true, isBattleStart: false }) {
  const result: string[] = whereClauseArray(params)

  if (params.period !== 'allTime') {
    if (params.period.type == 'fromTo') {
      result.push(`id >= ${dateToDbIndex(params.period.from)}`);
      result.push(`id <= ${dateToDbIndex(params.period.to)}`);
    } else if (params.period.type == 'fromToNow') {
      result.push(`id >= ${dateToDbIndex(params.period.from)}`);
    } else if (params.period.type == 'lastX') {
      const lastIDs = `(select id from Event_OnBattleStart where ${whereClauseArray(params).join(' AND ')} order by id desc limit ${params.period.count})`;
      result.push(`${isBattleStart ? 'id' : 'onBattleStartId'} in ${lastIDs}`);
    }
  }

  return result.length == 0 ? '' : (withWhere === false ? ' and ' : 'where ') + result.join(' AND ');
}