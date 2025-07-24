import { INSTALL_URL } from "@/utils/externalUrl";
import { latestModsMap } from "./mods";


export async function download(tags: string[], vendor: 'lesta' | 'wargaming') {

  const JSZip = (await import('jszip')).default;

  const urls = tags
    .map(tag => latestModsMap.value.get(tag)?.[vendor === 'lesta' ? 'mtmod' : 'wotmod']?.url)
    .filter(t => t !== undefined)
    .map(t => `${INSTALL_URL}/${t}`)

  console.log(`Downloading mods: ${urls.join(', ')}`);

  const zip = new JSZip();

  zip.file('README.txt', `Instruction text`);
  zip.file('ИНСТРУКЦИЯ.txt', `Текст инструкции`);

  const targetFolder = zip
    .folder('mods')!
    .folder('1.36.0.0')!

  urls.forEach(url => {
    const filename = url.split('/').pop() || '';
    targetFolder.file(filename, fetch(url).then(res => res.blob()));
  });

  zip.generateAsync({ type: 'blob' })
    .then(content => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `wotstat-mods-${vendor}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
    .catch(err => {
      console.error('Error downloading mods:', err);
      alert('Failed to download mods. Please try again later.');
    });
}