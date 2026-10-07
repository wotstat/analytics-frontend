import type { OptionalRegionVersion } from '@/shared/game/selectors/gameVersionSelector/utils'
import { defineParams } from '@/shared/ui/queryStorage/useQueryStorage'

function deserialize(raw: string): Set<OptionalRegionVersion> {
  const versions = new Map<string, OptionalRegionVersion>()
  for (const value of raw.split(',').filter(Boolean)) {
    const match = value.match(/^([a-z]+)_(\d+(?:-\d+)*)$/i)
    if (!match) throw new Error('Некорректная версия')
    const region = match[1].toUpperCase()
    const version = match[2].replaceAll('-', '.')
    versions.set(`${region}:${version}`, { region, version })
  }
  return new Set(versions.values())
}

function serialize(versions: Set<OptionalRegionVersion>): string {
  return [...new Set([...versions]
    .filter(version => version.region)
    .map(version => `${version.region!.toLowerCase()}_${version.version.replaceAll('.', '-')}`))]
    .sort().join(',')
}

export const compareQueryParams = defineParams({
  leftVersions: {
    label: 'versions-left',
    default: () => new Set<OptionalRegionVersion>([{ region: 'RU', version: '1.36.0' }]),
    serialize,
    deserialize
  },
  rightVersions: {
    label: 'versions-right',
    default: () => new Set<OptionalRegionVersion>([{ region: 'RU', version: '1.36.1' }]),
    serialize,
    deserialize
  }
})
