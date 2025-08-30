export function normalizeArray(arr: number[]) {
  let sum = 0
  for (let i = 0; i < arr.length; i++) sum += arr[i]
  return arr.map(t => sum == 0 ? 0 : t / sum)
}
