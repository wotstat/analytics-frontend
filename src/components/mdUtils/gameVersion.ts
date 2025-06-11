import { computedAsync } from "@vueuse/core";

async function parseGameVersion(url: string, extension: '.wotmod' | '.mtmod' = '.wotmod') {
  const response = await fetch(url)
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  return doc.documentElement.querySelector(`Path[mask='*${extension}']`)?.textContent?.replace('./mods/', '') ?? 'GAME_VERSION';
}

export const gameVersionRU = computedAsync(async () => await parseGameVersion("https://raw.githubusercontent.com/IzeBerg/wot-src/RU/sources/paths.xml", '.mtmod'), './mods/1.20.0.0');
export const gameVersionEU = computedAsync(async () => await parseGameVersion("https://raw.githubusercontent.com/IzeBerg/wot-src/EU/sources/paths.xml"), './mods/1.20.0.0');
