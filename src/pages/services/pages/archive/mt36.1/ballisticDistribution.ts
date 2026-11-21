export type BallisticDistributionVariant = 'cdf' | 'pdf'

export type BallisticDistributionRow = {
  gameVersion: string
  r: number
  p: number
}

export type BallisticDistributionData = {
  labels: number[]
  left: (number | null)[]
  right: (number | null)[]
}

export function buildBallisticDistributionSeries(
  rows: readonly BallisticDistributionRow[],
  leftVersions: ReadonlySet<string>,
  rightVersions: ReadonlySet<string>,
  variant: BallisticDistributionVariant,
): BallisticDistributionData {
  const visibleRows = rows.filter(row => row.r >= 0 && row.r <= 1)
  const labels = [...new Set(visibleRows.map(row => row.r))].sort((a, b) => a - b)

  function valuesFor(versions: ReadonlySet<string>) {
    const values = new Map(
      visibleRows
        .filter(row => versions.has(row.gameVersion))
        .map(row => [row.r, row.p * 100]),
    )

    if (variant === 'pdf') return labels.map(label => values.get(label) ?? null)

    let sum = 0
    return labels.map(label => {
      const value = values.get(label)
      if (value === undefined) return null

      sum += value
      return sum
    })
  }

  return {
    labels,
    left: valuesFor(leftVersions),
    right: valuesFor(rightVersions),
  }
}
