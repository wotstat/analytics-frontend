import { LONG_CACHE_SETTINGS, query } from '@/db'
import { STATIC_URL } from '@/shared/external/externalUrl'
import { computed, shallowRef } from 'vue'
import { GameVendor, regionToGame } from '../wot'

export function tagToImageName(tag: string): string {
  return tag.split('/').at(-1)?.toLowerCase() || tag.toLowerCase()
}

export function minimapUrl(tag: string,
  game: GameVendor = 'mt',
  gameplay: null | 'comp7' | (string & {}) = null,
  format: 'webp' | 'png' = 'webp'): string {

  const gamePrefix = game === 'mt' ? 'mt' : 'wot'
  const defaultUrl = `${STATIC_URL}/${gamePrefix}/latest/arenas/minimap/${tag}.${format}`
  if (!gameplay) return defaultUrl

  const meta = getArenaMeta(game, tag, gameplay || 'ctf')
  if (!meta) return defaultUrl

  if (meta.minimap.includes('_comp7')) return `${STATIC_URL}/${gamePrefix}/latest/arenas/minimap/comp7/${tag}.${format}`

  return defaultUrl
}

type Arena = {
  region: string;
  game: GameVendor;
  tag: string;
  gameplay: string;
  season: string;
  winnerIfExtermination: number | null;
  winnerIfTimeout: number | null;
  minimap: string;
  bbox: {
    bottomLeft: { x: number; y: number };
    upperRight: { x: number; y: number };
  };
  bases: {
    team: number;
    positions: { x: number; y: number }[];
  }[];
  spawn: {
    team: number;
    positions: { x: number; y: number }[];
  }[];
  poi: {
    position: { x: number; y: number };
    type: number;
  }[];
  control: Array<{ x: number; y: number }>;
}

type ArenasLatest = {
  region: string;
  gameVersionFull: string;
  gameVersion: string;
  gameVersionHash: string;
  tag: string;
  gameplay: string;
  datetime: string;
  gameVersionComp: string;
  name: string;
  season: string;
  minimap: string;

  winnerIfTimeout: number | null;        // Nullable(UInt8)
  winnerIfExtermination: number | null;  // Nullable(UInt8)

  'bbox.bottomLeft': [number, number];   // Tuple(Float32, Float32)
  'bbox.upperRight': [number, number];   // Tuple(Float32, Float32)

  'base.team': number[];                 // Array(UInt8)
  'base.positions': Array<Array<[number, number]>>;  // Array(Array(Tuple(Float32, Float32)))

  'spawn.team': number[];                // Array(UInt8)
  'spawn.positions': Array<Array<[number, number]>>; // Array(Array(Tuple(Float32, Float32)))

  control: Array<[number, number]>;      // Array(Tuple(Float32, Float32))
  'poi.position': Array<[number, number]>; // Array(Tuple(Float32, Float32))
  'poi.type': number[];                  // Array(UInt8)
};

export const arenas = shallowRef(<Arena[]>([]))
const arenasMap = computed(() => new Map<string, Arena>(
  arenas.value.map((arena) => [arenaKey(arena.game, arena.tag, arena.gameplay), arena])
))

function arenaKey(game: GameVendor, tag: string, gameplay: string): string {
  return `${game}:${tag}:${gameplay}`
}

export function getArenaMeta(game: GameVendor, tag: string, gameplay: string) {
  return arenasMap.value.get(arenaKey(game, tag, gameplay))
}

export function relativeMapPosition(position: { x: number, y: number }, meta: Arena) {
  const bbox = meta.bbox
  const x = (position.x - bbox.bottomLeft.x) / (bbox.upperRight.x - bbox.bottomLeft.x)
  const y = 1 - (position.y - bbox.bottomLeft.y) / (bbox.upperRight.y - bbox.bottomLeft.y)
  return { x, y }
}

async function loadArenas() {
  const response = await query<ArenasLatest>(`
    select region, tag, gameplay, season, winnerIfExtermination, winnerIfTimeout, minimap,
          "bbox.bottomLeft", "bbox.upperRight", "base.team", "base.positions", "spawn.team",
          "spawn.positions", control, "poi.position", "poi.type"
    from ArenasLatest
    where region in ('RU', 'EU');
  `, { settings: LONG_CACHE_SETTINGS })

  arenas.value = response.data.map((arena) => ({
    region: arena.region,
    game: regionToGame(arena.region),
    tag: arena.tag,
    gameplay: arena.gameplay,
    season: arena.season,
    winnerIfExtermination: arena.winnerIfExtermination,
    winnerIfTimeout: arena.winnerIfTimeout,
    minimap: arena.minimap,
    bbox: {
      bottomLeft: { x: arena['bbox.bottomLeft'][0], y: arena['bbox.bottomLeft'][1] },
      upperRight: { x: arena['bbox.upperRight'][0], y: arena['bbox.upperRight'][1] },
    },
    bases: arena['base.team'].map((team, i) => ({
      team,
      positions: arena['base.positions'][i].map(pos => ({ x: pos[0], y: pos[1] })),
    })),
    spawn: arena['spawn.team'].map((team, i) => ({
      team,
      positions: arena['spawn.positions'][i].map(pos => ({ x: pos[0], y: pos[1] })),
    })),
    poi: arena['poi.position'].map((pos, i) => ({ position: { x: pos[0], y: pos[1] }, type: arena['poi.type'][i] })),
    control: arena.control.map(pos => ({ x: pos[0], y: pos[1] })),
  }))
}

loadArenas()