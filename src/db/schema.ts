
// drop table player_coverage_mv;
// drop table player_coverage_mv_tankLevel;
// drop table player_coverage_mv_tankLevel_tankType;
// drop table player_coverage_mv_tankType;

import { StatParams, whereClauseColumns } from "@/composition/useQueryStatParams";
import { MaybeRefOrGetter } from "vue";

const player_coverage = {
  'player_coverage_mv': ['battleMode', 'battleGameplay'],
  'player_coverage_mv_tankLevel': ['battleMode', 'battleGameplay', 'tankLevel'],
  'player_coverage_mv_tankType': ['battleMode', 'battleGameplay', 'tankType'],
  'player_coverage_mv_tankLevel_tankType': ['battleMode', 'battleGameplay', 'tankLevel', 'tankType'],
} as const;

const team_results = {
  'team_results_mv': ['battleMode', 'battleGameplay', 'tankLevel', 'tankType', 'tankTag', 'result', 'playersCount'],
} as const;

const accuracy_hit_points = {
  'accuracy_hit_points_mv': ['battleMode', 'battleGameplay', 'tankLevel', 'tankType', 'tankTag']
}

const event_OnShot_health_damage = {
  'Event_OnShot_health_damage_mv': ['battleMode', 'battleGameplay', 'tankLevel', 'tankType', 'tankTag']
}

const event_OnShot_safe_damage_count_by_base_mv = {
  'Event_OnShot_safe_damage_count_by_base_mv': ['battleMode', 'battleGameplay', 'tankLevel', 'tankType', 'tankTag']
}


const schemas = {
  player_coverage,
  team_results,
  accuracy_hit_points,
  event_OnShot_health_damage,
  event_OnShot_safe_damage_count_by_base_mv
} as const;

function bestMvWithColumns(target: keyof typeof schemas, columns: string[]) {
  const schema = schemas[target];
  const keys = Object.keys(schema);

  for (const key of keys) {
    const tables = schema[key as keyof typeof schema] as string[];
    if (columns.some(t => !tables.includes(t))) continue;
    return key;
  }

  return null;
}

export function bestMV(target: keyof typeof schemas, options: string[] | MaybeRefOrGetter<StatParams>) {
  const columns = Array.isArray(options) ? options : whereClauseColumns(options);
  return bestMvWithColumns(target, columns);
}



export type ChuckResult = {
  id: string;
  onBattleStartId: string;
  dateTime: string;
  arena: string;
  result: string;
  duration: number;
  spgCount: number;
  enemyTeamMaxHealth: number;
  players: [string, string, number, number, number][];
  totalScore: number;
}
