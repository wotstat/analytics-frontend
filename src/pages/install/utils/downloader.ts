import { INSTALL_URL } from '@/shared/external/externalUrl'
import { latestModsMap } from '../mods/mods'
import { ref } from 'vue'

type State = { type: 'begin' } |
{ type: 'downloading', mod: string, index: number, total: number } |
{ type: 'error', error: string } |
{ type: 'aborted' } |
{ type: 'done', mods: { filename: string, blob: Blob }[] };


function getModsUrls(tags: string[], vendor: 'lesta' | 'wargaming') {
  return tags
    .map(tag => latestModsMap.value.get(tag)?.[vendor === 'lesta' ? 'mtmod' : 'wotmod']?.url)
    .filter(t => t !== undefined)
    .map(t => `${INSTALL_URL}/${t}`)
}

export function download(tags: string[], vendor: 'lesta' | 'wargaming') {

  const currentState = ref<State>({ type: 'begin' })

  const urls = getModsUrls(tags, vendor)

  console.log('Downloading mods:', urls)

  const controller = new AbortController()
  const mods: { filename: string, blob: Blob }[] = []

  controller.signal.addEventListener('abort', () => {
    currentState.value = { type: 'aborted' }
    console.log('Download aborted')
  })

  async function download() {

    let errorsCount = 0

    for (let i = 0; i < urls.length; i++) {
      if (controller.signal.aborted) return

      currentState.value = { type: 'downloading', mod: urls[i], index: i, total: urls.length }

      try {
        const response = await fetch(urls[i], { signal: controller.signal })

        if (!response.ok) throw new Error(`Failed to download mod ${i + 1}: ${response.status} ${response.statusText}`)

        const blob = await response.blob()
        mods.push({ filename: urls[i].split('/').pop() || '', blob })

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          currentState.value = { type: 'aborted' }
          console.log('Download aborted by user')
          return
        }

        if (errorsCount > 5) {
          currentState.value = { type: 'error', error: error instanceof Error ? error.message : `${error}` }
          console.error('Too many errors, aborting download')
          return
        }

        errorsCount++
        i--
        console.warn(`Error downloading mod ${i + 1}:`, error)
        continue
      }
    }

    currentState.value = { type: 'done', mods }
    console.log(`Download complete, ${mods.length} mods downloaded`)
  }

  download()


  return { status: currentState, abortController: controller }
}