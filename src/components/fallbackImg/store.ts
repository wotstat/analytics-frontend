

const errorUrlSet = new Set<string>();

export function onErrorWithUrl(url: string) {
  errorUrlSet.add(url);
}

export function onErrorRemoveUrl(url: string) {
  errorUrlSet.delete(url);
}

export function isUrlMayValidImage(url: string) {
  return !errorUrlSet.has(url);
}


console.log(errorUrlSet);