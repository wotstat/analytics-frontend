import { useEventListener } from '@vueuse/core';
import { get, set, del } from 'idb-keyval';
import { ref, shallowRef } from 'vue';

const DIRECTORY_KEY = 'MOD_INSTALLER_DIRECTORY_HAndle';

function browserSupport() {
  return 'showDirectoryPicker' in window;
}

async function fromAsync<T>(it: AsyncIterable<T>) {
  const result: T[] = [];
  for await (const value of it) result.push(value);
  return result;
}

async function getGameInfo(directoryHandle: FileSystemDirectoryHandle) {
  const files = new Map(await fromAsync(directoryHandle.entries()))

  const versionFile = files.get('version.xml');
  const pathsFile = files.get('paths.xml');

  if (!versionFile || !pathsFile || versionFile.kind !== 'file' || pathsFile.kind !== 'file') return null;


  const versionFileContents = await (await versionFile.getFile()).text();
  const version = new DOMParser().parseFromString(versionFileContents, 'application/xml');


  const detectedGameVersion = version.querySelector('version')?.textContent;
  const detectedGameRealm = version.querySelector('realm')?.textContent;

  if (!detectedGameVersion || !detectedGameRealm) return null;

  const pathsFileContents = await (await pathsFile.getFile()).text();
  const paths = new DOMParser().parseFromString(pathsFileContents, 'application/xml');

  const detectedModPath = [...paths.querySelectorAll('Paths > Path')].find(t => t.textContent?.includes('./mods/'))?.textContent;

  if (!detectedModPath) return null;

  return {
    version: detectedGameVersion,
    realm: detectedGameRealm,
    modsPath: detectedModPath,
  }

}


async function requestDirectory() {
  if (!browserSupport()) return null

  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await set(DIRECTORY_KEY, handle);
    return handle;
  } catch (error) {
    return null
  }
}

async function directoryPermission(directoryHandle: FileSystemDirectoryHandle) {
  const permissions = await directoryHandle.queryPermission({ mode: 'readwrite' });
  return permissions;
}

export function useInstaller() {
  const isInitialized = ref(false);
  const isBrowserSupported = ref(false)
  const rootHandle = shallowRef<FileSystemDirectoryHandle | null>(null);

  const gameInfo = shallowRef<{
    version: string;
    realm: string;
    modsPath: string;
  } | null>(null);

  async function init() {
    if (isInitialized.value) return;

    isBrowserSupported.value = browserSupport();
    const storedHandle = await get<FileSystemDirectoryHandle>(DIRECTORY_KEY);

    if (storedHandle) {
      const permission = await directoryPermission(storedHandle)
      if (permission === 'granted') rootHandle.value = storedHandle;
      else del(DIRECTORY_KEY);
    }

    if (rootHandle.value) {
      gameInfo.value = await getGameInfo(rootHandle.value)
    }

    isInitialized.value = true;
  }

  init()


  async function requestGameFolderAccess() {
    if (!browserSupport()) return

    const handle = await requestDirectory();
    if (!handle) return;

    const permissions = await handle.queryPermission({ mode: 'readwrite' });
    if (permissions === 'prompt') {
      const result = await handle.requestPermission({ mode: 'readwrite' });
      if (result !== 'granted') return;
    }

    gameInfo.value = await getGameInfo(handle)
    rootHandle.value = handle;
  }

  async function reworked(message: string = 'Reworked') {
    console.log('Reworked:', message);

    gameInfo.value = null;
    rootHandle.value = null;
    del(DIRECTORY_KEY);
  }

  async function fastVerifyAccess() {
    if (!rootHandle.value) return
    rootHandle.value.values().next().then().catch(() => reworked())
  }

  async function verifyGameInfo() {
    try {
      if (!rootHandle.value) throw new Error("Root handle is not set");
      const permission = await rootHandle.value.queryPermission({ mode: 'readwrite' });

      if (permission == 'granted') {
        const newGameInfo = await getGameInfo(rootHandle.value);
        if (newGameInfo) return gameInfo.value = newGameInfo
        else throw new Error("Game info not found or invalid");
      }

      throw new Error("Permission not granted");

    } catch (error) {
      console.log('Error verifying game info:', error);
      reworked(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async function installMods() {
    await verifyGameInfo()
    if (!gameInfo.value || !rootHandle.value) return

    const modsPath = gameInfo.value.modsPath;

    let handle = rootHandle.value;
    for (const element of modsPath.replace('./mods', 'mods').split('/')) {
      handle = await handle.getDirectoryHandle(element, { create: true });
    }

    const writable = await (await handle.getFileHandle('test.txt', { create: true })).createWritable()
    await writable.write('This is a test file to verify write access.');
    await writable.close()

  }

  useEventListener(window, 'focus', () => fastVerifyAccess());

  return {
    isInitialized,
    isBrowserSupported,
    gameInfo,
    requestDirectory,
    requestGameFolderAccess,
    installMods
  }
}