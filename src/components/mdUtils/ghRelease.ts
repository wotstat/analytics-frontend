export async function githubRelease(url: string, matcher: (name: string) => boolean) {
  const response = await fetch(url)
  const text = await response.text();
  const json = JSON.parse(text);
  return (json.assets as Record<string, string>[]).find(t => matcher(t.name)) as {
    browser_download_url: string,
    name: string,
  }
}