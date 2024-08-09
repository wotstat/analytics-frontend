import { queryAsync } from "@/db";
import { computed, shallowRef } from "vue";

class Parser {

  private transitions: Map<string, string>

  constructor(po: string) {
    const translations = po.split('msgid');

    const parsed = translations
      .filter(t => t.includes('msgstr'))
      .map(t => {
        const splitted = t.split('msgstr');
        const msgid = splitted[0].trim().slice(1, -1);

        const lines = splitted[1]
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => l.slice(1, -1))
          .filter(l => l.length > 0);

        const msgstr = lines.join('\n');

        return {
          msgid,
          msgstr
        }
      })

    this.transitions = new Map(parsed.map(t => [t.msgid, t.msgstr]))
  }

  public getTranslation(msg: string) {
    return this.transitions.get(msg) ?? msg
  }
}

export const arenas: Parser | null = null

const LANGUAGE = 'RU'

const parsers: { [key in 'arena']?: Parser | Promise<Parser> } = {}

function isGetText(obj: Parser | Promise<Parser>): obj is Parser {
  return obj instanceof Parser
}

export function getArenaName(tag: string) {
  const arenaName = shallowRef<string>(tag)

  if (!parsers.arena) {
    parsers.arena = new Promise((resolve, reject) => {
      fetch(`https://raw.githubusercontent.com/IzeBerg/wot-src/${LANGUAGE}/sources/res/text/lc_messages/arenas.po`)
        .then(res => res.text())
        .then(text => {
          resolve(new Parser(text))
        })
        .catch(reject)
    })

    parsers.arena
      .then(t => {
        parsers.arena = t
      })
      .catch(() => {
        parsers.arena = undefined
      })

  }

  if (isGetText(parsers.arena)) {
    arenaName.value = parsers.arena.getTranslation(tag)
  } else {
    parsers.arena.then(arena => {
      arenaName.value = arena.getTranslation(tag)
    })
  }

  return arenaName
}

export function countLocalize(count: number, one: string, two: string, five: string = two) {
  if (count % 10 == 1 && count % 100 != 11) return one
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return two
  return five
}


const tankNames = queryAsync<{ tag: string, shortNameRU: string, nameRU: string }>(`select tag, shortNameRU, nameRU from TankList;`);
const tankNamesMap = computed(() => {
  const map = new Map<string, { short: string, full: string }>();
  for (const tank of tankNames.value.data) {
    map.set(tank.tag, { short: tank.shortNameRU, full: tank.nameRU });
  }
  return map;
});

export function getTankName(tag: string, short: boolean = false) {
  const name = short ? tankNamesMap.value.get(tag)?.short : tankNamesMap.value.get(tag)?.full
  if (name) return name

  const idName = tag.split(':')[1];

  if (!idName) return tag

  const splitted = idName.split('_').slice(1).join(' ')

  if (splitted) return splitted

  return idName
}

export function crewBookName(tag: string) {
  return {
    'universalBrochure': 'Универсальная брошюра',
    'universalBook': 'Универсальное пособие',
    'personalBook': 'Персональное учебное пособие',
    'brochure': 'Учебная брошюра',
    'universalGuide': 'Универсальное руководство',
  }[tag] ?? tag
}