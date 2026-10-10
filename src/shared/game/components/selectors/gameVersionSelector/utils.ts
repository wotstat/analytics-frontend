
export type Version = { region: string, version: string }
export type OptionalRegionVersion = { region?: string, version: string }

const selectionSeparator = '\u0000'

export function versionToKey(version: OptionalRegionVersion): string {
  return version.region ? `${version.region}${selectionSeparator}${version.version}` : version.version
}

export function keyToVersion(key: string): OptionalRegionVersion {
  const separatorIndex = key.indexOf(selectionSeparator)
  if (separatorIndex === -1) {
    return { version: key }
  }
  return {
    region: key.slice(0, separatorIndex),
    version: key.slice(separatorIndex + selectionSeparator.length)
  }
}