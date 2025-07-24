

export async function exportArchive(mods: { filename: string, blob: Blob }[], vendor: 'lesta' | 'wargaming') {
  const JSZip = (await import('jszip')).default;

  const zip = new JSZip();

  zip.file('README.txt', `Instruction text`);
  zip.file('ИНСТРУКЦИЯ.txt', `Текст инструкции`);

  const targetFolder = zip
    .folder('mods')!
    .folder('1.36.0.0')!

  mods.forEach(mod => {
    targetFolder.file(mod.filename, mod.blob, { binary: true });
  });


  try {
    const content = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `wotstat-mods-${vendor}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading mods:', error);
    alert('Failed to download mods. Please try again later.');
  }
}