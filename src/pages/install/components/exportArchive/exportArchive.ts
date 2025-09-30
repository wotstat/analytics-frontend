import { latestGameVersion } from '@/shared/game/gameVersion'
import { GameVendor } from '@/shared/game/wot'


export async function exportArchive(mods: { filename: string, blob: Blob }[], vendor: GameVendor) {
  const JSZip = (await import('jszip')).default

  const zip = new JSZip()

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
  zip.file('ИНСТРУКЦИЯ.txt', instructionText)

  const targetFolder = zip
    .folder('mods')!
    .folder(modsPath)!

  mods.forEach(mod => {
    targetFolder.file(mod.filename, mod.blob, { binary: true })
  })


  try {
    const content = await zip.generateAsync({ type: 'blob' })
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