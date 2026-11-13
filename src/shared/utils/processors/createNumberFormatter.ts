type NumberFormatterOptions = Pick<Intl.NumberFormatOptions,
  'minimumFractionDigits' | 'maximumFractionDigits' | 'useGrouping'> & {
  decimalSeparator?: string
  groupSeparator?: string
}

export function createNumberFormatter({
  decimalSeparator = '.',
  groupSeparator = ' ',
  ...options
}: NumberFormatterOptions = {}) {
  const formatter = new Intl.NumberFormat('en-US', options)

  return (value: number) => formatter.formatToParts(value).map(part => {
    if (part.type === 'decimal') return decimalSeparator
    if (part.type === 'group') return groupSeparator
    return part.value
  }).join('')
}
