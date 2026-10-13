import { latestGameVersion } from '@/shared/game/domain/gameVersion'
import { GameVendor } from '@/shared/game/domain/wot'
import type { AsyncZippable } from 'fflate'

export async function exportArchive(mods: { filename: string, blob: Blob }[], vendor: GameVendor) {
  const { zip, strToU8 } = await import('fflate')

  const modsPath = (vendor == 'mt' ? latestGameVersion.value?.lesta.modsFolder : latestGameVersion.value?.wargaming.modsFolder) ?? '1.36.0.0'

  const instructionText = `Инструкция по установке модов WotStat

${vendor == 'mt' ? 'ТОЛЬКО МИР ТАНКОВ (LESTA)' : 'ТОЛЬКО WORLD OF TANKS (WARGAMING)'}
  
- Распакуйте этот архив в корневую папку игры.
  Папку игры можно найти через лаунчер:
  - Нажмите кнопку "Настройки игры" (слева сверху)
  - Выберите пункт "Показать в папке"

После распаковки, у вас в папке mods/${modsPath} должны появиться файлы с расширением .${vendor == 'mt' ? 'mtmod' : 'wotmod'}:
${mods.map(mod => `- ${mod.filename}`).join('\n')}
  `
  try {
    const files: AsyncZippable = {
      'ИНСТРУКЦИЯ.txt': strToU8(instructionText),
      'mods/': [new Uint8Array(), { attrs: 0x10 }], // каталог
      [`mods/${modsPath}/`]: [new Uint8Array(), { attrs: 0x10 }], // каталог
    }

    for (const mod of mods) {
      files[`mods/${modsPath}/${mod.filename}`] = new Uint8Array(await mod.blob.arrayBuffer())
    }

    const archive = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
      zip(files, { level: 0 }, (error, data) => {
        if (error) return reject(error)
        resolve(data)
      })
    })
    const content = new Blob([archive], { type: 'application/zip' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(content)
    a.download = `wotstat-mods-${vendor}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error downloading mods:', error)
    alert('Failed to download mods. Please try again later.')
  }
}
