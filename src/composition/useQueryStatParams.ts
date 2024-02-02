import { useRoute } from "vue-router";

export type TankType = 'LT' | 'MT' | 'HT' | 'AT' | 'SPG';
export type TankLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type StatParams = {
  player: string | null;
  level: TankLevel[] | null;
  types: TankType[] | null;
  tanks: string[] | null;
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
    tanks: null
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