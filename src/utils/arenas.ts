
const REGION = 'RU'

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