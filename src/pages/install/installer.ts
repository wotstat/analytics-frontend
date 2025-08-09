import { useEventListener } from '@vueuse/core'
import { get, set, del } from 'idb-keyval'
import { ref, shallowRef, watch } from 'vue'

const DIRECTORY_KEY = 'MOD_INSTALLER_DIRECTORY_HANDLE'

export function dotSeparatedCompare(lhs: string, rhs: string) {
  const lhsParts = lhs.split('.').map(Number)
  const rhsParts = rhs.split('.').map(Number)

  for (let i = 0; i < Math.max(lhsParts.length, rhsParts.length); i++) {
    const lhsPart = lhsParts[i] || 0
    const rhsPart = rhsParts[i] || 0

    if (lhsPart < rhsPart) return -1
    if (lhsPart > rhsPart) return 1
  }
  return 0

}

export function gameVendor(realm: string): 'lesta' | 'wargaming' {
  if (realm === 'RU' || realm === 'RPT') return 'lesta'
  return 'wargaming'
}

function browserSupport() {
  return 'showDirectoryPicker' in window
}

async function fromAsync<T>(it: AsyncIterable<T>) {
  const result: T[] = []
  for await (const value of it) result.push(value)
  return result
}

function parseModName(name: string) {
  const match = name.match(/^(.*?)_?((?:\d+\.)*(?:\d+))?(?:\s\(.*\))?\.(mtmod|wotmod)$/)

  if (!match || match.length < 4) return null

  const nameTag = match[1] || ''
  const nameVersion = match[2] || ''
  const game = match[3] as 'mtmod' | 'wotmod'

  return {
    nameTag,
    nameVersion,
    game
  }
}

async function getGameInfo(directoryHandle: FileSystemDirectoryHandle) {
  const files = new Map(await fromAsync(directoryHandle.entries()))

  const versionFile = files.get('version.xml')
  const pathsFile = files.get('paths.xml')
  const gameInfoFile = files.get('game_info.xml')

  if (!versionFile ||
    !pathsFile ||
    !gameInfoFile ||
    versionFile.kind !== 'file' ||
    pathsFile.kind !== 'file' ||
    gameInfoFile.kind !== 'file') return null


  const versionFileContents = await (await versionFile.getFile()).text()
  const version = new DOMParser().parseFromString(versionFileContents, 'application/xml')


  const detectedGameVersion = version.querySelector('version')?.textContent
  const detectedGameRealm = version.querySelector('realm')?.textContent

  if (!detectedGameVersion || !detectedGameRealm) return null
  const realm = detectedGameRealm.trim().toUpperCase()

  const pathsFileContents = await (await pathsFile.getFile()).text()
  const paths = new DOMParser().parseFromString(pathsFileContents, 'application/xml')

  const detectedModPath = [...paths.querySelectorAll('Paths > Path')].find(t => t.textContent?.includes('./mods/'))

  if (!detectedModPath || !detectedModPath.textContent) return null

  const modExtension = detectedModPath.getAttribute('mask')?.replace('*', '') || '.wotmod'


  const modsPath = detectedModPath.textContent.trim().replace('./mods', 'mods')
  const modsSet = new Set<string>()

  try {

    let handle = directoryHandle
    for (const element of modsPath.split('/')) handle = await handle.getDirectoryHandle(element)

    const entries = await fromAsync(handle.values())
    const mods = entries
      .filter(e => e.kind === 'file' && e.name.endsWith(modExtension))
      .map(e => e.name)

    for (const mod of mods) {
      const parsed = parseModName(mod)
      if (!parsed) continue

      modsSet.add(parsed.nameTag)
    }

  } catch (error) { }

  return {
    version: detectedGameVersion.trim(),
    realm,
    modsPath,
    modsSet,
    modExtension
  }

}

async function getAllMods(mods: FileSystemDirectoryHandle) {

  const installedMods = new Map<string, { tag: string, nameVersion: string, handler: FileSystemFileHandle, size: number }>()

  async function checkDirectory(mods: FileSystemDirectoryHandle, path = '') {
    if (!mods) return

    for await (const [name, entry] of mods.entries()) {
      if (entry.kind === 'file') {
        const parsed = parseModName(entry.name)
        if (!parsed) {
          console.warn(`Failed to parse mod name: ${entry.name}`)
          continue
        }

        const file = await entry.getFile()
        installedMods.set(`${path}/${name}`, {
          tag: parsed.nameTag,
          nameVersion: parsed.nameVersion,
          handler: entry,
          size: file.size,
        })
      } else if (entry.kind === 'directory') {
        await checkDirectory(entry, `${path}/${name}`)
      }
    }
  }

  await checkDirectory(mods)


  return installedMods

}


async function checkModsVersion(mods: FileSystemDirectoryHandle, check: string[]) {
  const JSZip = (await import('jszip')).default

  const installedMods = await getAllMods(mods)

  const byTags = new Map<string, { tag: string, nameVersion: string, handler: FileSystemFileHandle, size: number }[]>()
  for (const mod of installedMods.values()) {
    if (!byTags.has(mod.tag)) byTags.set(mod.tag, [])
    byTags.get(mod.tag)?.push(mod)
  }

  const targetMods = check
    .map(tag => byTags.get(tag == 'wotstat.analytics' ? 'mod.wotStat' : tag))
    .filter(t => t != undefined)

  const modLatestVersions = new Map<string, string>()
  for (const mod of targetMods) {
    const versions = await Promise.all(mod.map(async m => {
      const file = await m.handler.getFile()
      const archive = await JSZip.loadAsync(file)

      const meta = archive.file('meta.xml')
      if (!meta) return null
      const content = await meta.async('text')

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(content, 'application/xml')
      const version = xmlDoc.querySelector('version')?.textContent
      if (!version) return null

      return version
    }))

    const latestVersion = versions.filter(v => v !== null).sort(dotSeparatedCompare).pop()
    if (latestVersion) modLatestVersions.set(mod[0].tag, latestVersion)
  }

  return modLatestVersions
}


async function requestDirectory() {
  if (!browserSupport()) return null

  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    await set(DIRECTORY_KEY, handle)
    return handle
  } catch (error) {
    console.warn('Error requesting directory:', error)
    return null
  }
}

async function directoryPermission(directoryHandle: FileSystemDirectoryHandle) {
  const permissions = await directoryHandle.queryPermission({ mode: 'readwrite' })
  return permissions
}

export function useInstaller(detailedCheckMods: string[]) {
  const isInitialized = ref(false)
  const isBrowserSupported = ref(false)
  const rootHandle = shallowRef<FileSystemDirectoryHandle | null>(null)

  const gameInfo = shallowRef<{
    version: string;
    realm: string;
    modsPath: string;
    modsSet: Set<string>;
    modExtension: string;
  } | null>(null)

  const checkedMods = shallowRef(new Map<string, string>())

  let lastGetInfoTime = 0
  async function getGameInfoCached(directoryHandle: FileSystemDirectoryHandle) {
    if (!gameInfo.value || Date.now() - lastGetInfoTime > 1000) {
      gameInfo.value = await getGameInfo(directoryHandle)
      lastGetInfoTime = Date.now()
    }
    return gameInfo.value
  }

  async function init() {
    if (isInitialized.value) return

    isBrowserSupported.value = browserSupport()
    const storedHandle = await get<FileSystemDirectoryHandle>(DIRECTORY_KEY)

    if (storedHandle) {
      const permission = await directoryPermission(storedHandle)
      if (permission === 'granted') rootHandle.value = storedHandle
      else del(DIRECTORY_KEY)
    }

    if (rootHandle.value) {
      await getGameInfoCached(rootHandle.value)
    }

    isInitialized.value = true
  }

  init()


  async function requestGameFolderAccess(onGameInfoOnFound?: (handle: FileSystemDirectoryHandle) => void) {
    if (!browserSupport()) return

    const handle = await requestDirectory()
    if (!handle) return

    const permissions = await handle.queryPermission({ mode: 'readwrite' })
    if (permissions === 'prompt') {
      const result = await handle.requestPermission({ mode: 'readwrite' })
      if (result !== 'granted') return
    }

    gameInfo.value = await getGameInfo(handle)

    if (!gameInfo.value) {
      console.warn('Game info not found or invalid in the selected directory')
      onGameInfoOnFound?.(handle)
    }

    rootHandle.value = handle
  }

  async function reworked(message: string = 'Reworked') {
    gameInfo.value = null
    rootHandle.value = null
    del(DIRECTORY_KEY)
  }

  async function fastVerifyAccess() {
    if (!rootHandle.value) return
    rootHandle.value.values().next().then().catch(() => reworked())
  }

  async function verifyGameInfo() {
    try {
      if (!rootHandle.value) throw new Error('Root handle is not set')
      const permission = await rootHandle.value.queryPermission({ mode: 'readwrite' })

      if (permission == 'granted') {
        const newGameInfo = await (getGameInfoCached(rootHandle.value))
        if (!newGameInfo) throw new Error('Game info not found or invalid')
        return newGameInfo
      }

      throw new Error('Permission not granted')

    } catch (error) {
      console.log('Error verifying game info:', error)
      reworked(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function getModsHandle() {
    await verifyGameInfo()
    if (!gameInfo.value || !rootHandle.value) return

    const modsPath = gameInfo.value.modsPath

    let handle = rootHandle.value
    for (const element of modsPath.split('/')) {
      handle = await handle.getDirectoryHandle(element, { create: true })
    }
    return handle
  }

  let modsHandleCache: FileSystemDirectoryHandle | undefined = undefined
  async function getModsHandleCached() {
    if (!modsHandleCache) modsHandleCache = await getModsHandle()
    return modsHandleCache
  }


  watch(gameInfo, async (info, old) => {
    if (!info) return
    if (old) return

    const modsHandle = await getModsHandleCached()
    if (!modsHandle) return

    checkedMods.value = await checkModsVersion(modsHandle, detailedCheckMods)
  })


  async function installMod(filename: string, mod: Blob) {
    const modsHandle = await getModsHandleCached()
    if (!modsHandle) throw new Error('Failed to get mods directory handle')

    const writable = await (await modsHandle.getFileHandle(filename, { create: true })).createWritable()
    await writable.write(mod)
    await writable.close()

    const parsed = parseModName(filename)
    if (parsed) {
      gameInfo.value?.modsSet.add(parsed.nameTag)
      const version = (await checkModsVersion(modsHandle, [parsed.nameTag])).get(parsed.nameTag)
      if (version) checkedMods.value.set(parsed.nameTag, version)
    }
  }

  function close() {
    gameInfo.value = null
    rootHandle.value = null
    checkedMods.value.clear()
    modsHandleCache = undefined
    del(DIRECTORY_KEY)
  }

  useEventListener(window, 'focus', () => fastVerifyAccess())

  return {
    isInitialized,
    isBrowserSupported,
    gameInfo,
    checkedMods,
    requestDirectory,
    requestGameFolderAccess,
    installMod,
    close
  }
}