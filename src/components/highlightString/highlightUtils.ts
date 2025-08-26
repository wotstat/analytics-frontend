

export type HighlightedInterval = [start: number, end: number];
export type HighlightedIntervals = HighlightedInterval[];
export type HighlightedString = { text: string, highlight: HighlightedIntervals };

function arrayToIntervaledArray(array: number[]): HighlightedIntervals {
  let result: HighlightedIntervals = []
  let currentInterval: number[] = []
  for (let i = 0; i < array.length; i++) {
    if (currentInterval.length === 0) {
      currentInterval.push(array[i])
    } else if (array[i] === array[i - 1] + 1) {
      currentInterval.push(array[i])
    } else {
      result.push([currentInterval[0], currentInterval[currentInterval.length - 1]])
      currentInterval = [array[i]]
    }
  }
  result.push([currentInterval[0], currentInterval[currentInterval.length - 1]])

  return result
}

export function compareIntervals(a: HighlightedIntervals, b: HighlightedIntervals): number {
  if (a.length == 0 && b.length == 0) return 0
  if (a.length == 0) return -1
  if (b.length == 0) return 1

  const aLengths = a.map(([start, end]) => end - start)
  const bLengths = b.map(([start, end]) => end - start)

  const aMax = Math.max(...aLengths)
  const bMax = Math.max(...bLengths)

  if (aMax < bMax) return 1
  if (aMax > bMax) return -1

  if (a.length < b.length) return 1
  if (a.length > b.length) return -1

  for (let i = 0; i < a.length; i++) {
    const aLength = a[i][1] - a[i][0]
    const bLength = b[i][1] - b[i][0]
    if (aLength < bLength) return 1
    if (aLength > bLength) return -1

    if (a[i][0] < b[i][0]) return -1
    if (a[i][0] > b[i][0]) return 1
  }

  return 0
}

function normalize(string: string) {
  return string.toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('ł', 'l')
}

export class Highlighted {

  private normalizedString: string
  private substring: string = ''
  private normalizedSubstring: string = ''
  private computedIntervals: HighlightedIntervals | null = null

  constructor(public readonly text: string) {
    this.normalizedString = normalize(text)
  }

  setSubstring(substring: string, lazy = true) {
    if (this.substring === substring) return

    this.substring = substring
    this.computedIntervals = null
    this.normalizedSubstring = ''
    if (!lazy) this.compute()
  }

  private compute() {
    this.normalizedSubstring = normalize(this.substring)

    let searchIndex = 0
    let matches: number[] = []
    for (let i = 0; i < this.normalizedString.length; i++) {
      if (this.normalizedString[i] === this.normalizedSubstring[searchIndex]) {
        matches.push(i)
        searchIndex++
        if (searchIndex === this.normalizedSubstring.length) {
          this.computedIntervals = arrayToIntervaledArray(matches)
          return
        }
      }
    }
  }

  get intervals(): HighlightedIntervals {
    if (!this.computedIntervals) this.compute()
    return this.computedIntervals ?? []
  }

  get highlightedString(): HighlightedString {
    return { text: this.text, highlight: this.computedIntervals || [] }
  }
}

export function highlight(string: string, substring: string): HighlightedString {
  if (string.trim().length === 0) return { text: string, highlight: [] }

  const normalizedSubstring = normalize(substring)
  const normalizedString = normalize(string)

  let searchIndex = 0
  let matches: number[] = []
  for (let i = 0; i < normalizedString.length; i++) {
    if (normalizedString[i] === normalizedSubstring[searchIndex]) {
      matches.push(i)
      searchIndex++
      if (searchIndex === normalizedSubstring.length) {
        return { text: string, highlight: arrayToIntervaledArray(matches) }
      }
    }
  }

  return { text: string, highlight: [] }

}

export function compareHighlightedStrings(a: HighlightedString, b: HighlightedString): number {
  const intervals = compareIntervals(a.highlight, b.highlight)
  if (intervals !== 0) return intervals

  return a.text.localeCompare(b.text)
}

export function getHighlightedTextParts(highlightedString: HighlightedString): { text: string, highlight: boolean }[] {
  const parts: { text: string, highlight: boolean }[] = []
  let lastIndex = 0

  for (const [start, end] of highlightedString.highlight) {
    if (start > lastIndex) {
      parts.push({ text: highlightedString.text.slice(lastIndex, start), highlight: false })
    }
    parts.push({ text: highlightedString.text.slice(start, end + 1), highlight: true })
    lastIndex = end + 1
  }

  if (lastIndex < highlightedString.text.length) {
    parts.push({ text: highlightedString.text.slice(lastIndex), highlight: false })
  }

  return parts
}
