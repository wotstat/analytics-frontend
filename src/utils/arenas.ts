
const REGION = 'RU'

export type ArenaMeta = {
  name: string,
  boundingBox: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  gameplayTypes: {
    [key: string]: {
      teamBasePositions: { x: number, y: number }[][],
      teamSpawnPoints: { x: number, y: number }[][],
      controlPoint: { x: number, y: number },
    }
  }
}

const tagByArenaID: Map<string, string> = new Map()
const arenaIDByTag: Map<string, string> = new Map()

let loadingArenasList: Promise<void> | boolean = false
function loadArenasList() {
  if (typeof loadingArenasList == 'object') return loadingArenasList
  if (loadingArenasList === true) return

  loadingArenasList = (async () => {
    console.log('loading arenas list');

    const response = await (await fetch(`https://raw.githubusercontent.com/IzeBerg/wot-src/${REGION}/sources/res/scripts/arena_defs/_list_.xml`)).text()
    const parser = new DOMParser();
    const doc = parser.parseFromString(response, "text/xml");

    doc.querySelectorAll('map').forEach(map => {
      const tag = map.querySelector('name')?.textContent
      const id = map.querySelector('id')?.textContent

      if (tag && id) {
        tagByArenaID.set(id, tag)
        arenaIDByTag.set(tag, id)
      }
    })

    loadingArenasList = true
  })()

  return loadingArenasList
}

export async function getArenaID(arenaTag: string) {
  await loadArenasList()
  return arenaIDByTag.get(arenaTag.split('spaces/')[1])
}

export async function aranaMinimapUrl(arenaTag: string) {
  const id = await getArenaID(arenaTag)
  return `https://static.armorinspector.com/mi/pc1.21.1/img-${id}-1024.jpg`
}

const arenasMeta: Map<string, ArenaMeta | Promise<ArenaMeta>> = new Map()
export async function loadArenaMeta(tag: string): Promise<ArenaMeta> {
  if (arenasMeta.has(tag)) return arenasMeta.get(tag) as Promise<ArenaMeta> | ArenaMeta

  const url = `https://raw.githubusercontent.com/IzeBerg/wot-src/${REGION}/sources/res/scripts/arena_defs/${tag}.xml`

  arenasMeta.set(tag, (async () => {
    console.log(`loading arena ${tag} meta`);
    const response = await (await fetch(url)).text()
    const parser = new DOMParser();
    const doc = parser.parseFromString(response, "text/xml");

    const parseV2 = (str: string) => {
      const [x, y] = str.split(' ')
      return { x: parseFloat(x), y: parseFloat(y) }
    }

    console.log(doc);

    const name = doc.querySelector('name')!.textContent!
    const boundingBox = doc.querySelector('boundingBox')!
    const bottomLeft = parseV2(boundingBox.querySelector('bottomLeft')!.textContent!)
    const upperRight = parseV2(boundingBox.querySelector('upperRight')!.textContent!)
    const gameplayTypes = doc.querySelector('gameplayTypes')!

    const parsedGameplay: Record<string, any> = {}

    for (const gameplay of ['ctf', 'domination', 'assault', 'maps_training', 'assault2', 'ctf30x30']) {
      const gameplayType = gameplayTypes.querySelector(gameplay)
      if (!gameplayType) continue

      const teamBasePositions = Array.from(gameplayType.querySelectorAll('teamBasePositions > *'))
        .map(item => [item.querySelector('position1'), item.querySelector('position2')]
          .filter(t => t)
          .map(pos => parseV2(pos!.textContent!)))

      const teamSpawnPoints = Array.from(gameplayType.querySelectorAll('teamSpawnPoints > *'))
        .map(item => Array.from(item.querySelectorAll('position'))
          .map(pos => parseV2(pos.textContent!)))

      const cp = gameplayType.querySelector('controlPoint')
      const controlPoint = cp ? parseV2(cp.textContent!) : undefined

      parsedGameplay[gameplay] = { teamBasePositions, teamSpawnPoints, controlPoint }
    }

    const res = {
      name,
      boundingBox: {
        x: bottomLeft.x,
        y: bottomLeft.y,
        width: upperRight.x - bottomLeft.x,
        height: upperRight.y - bottomLeft.y
      },
      gameplayTypes: parsedGameplay
    }

    arenasMeta.set(tag, res)

    return res
  })())

  return arenasMeta.get(tag) as Promise<ArenaMeta>
}

export function convertCoordinate(v: { x: number, y: number }, bbox: { x: number, y: number, width: number, height: number }) {
  return {
    x: (v.x - bbox.x) / bbox.width,
    y: (1 - v.y - bbox.y) / bbox.height
  }

}
