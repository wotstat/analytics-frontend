export const lebwa = 'LeBwa';
export const jove = 'Jove';
export const nearyou = 'Near_You';
export const yusha = 'Yusha';


export const bloggerNames = {
  lebwa,
  jove,
  nearyou,
  yusha
};

export const bloggerNamesArray = [
  nearyou,
  jove,
  yusha,
  lebwa
];

export const bloggerGameIdToIndex = {
  1: 1,
  2: 3,
  3: 0,
  4: 2
}

export const bloggerGameIdToName = {
  1: bloggerNamesArray[bloggerGameIdToIndex[1]],
  2: bloggerNamesArray[bloggerGameIdToIndex[2]],
  3: bloggerNamesArray[bloggerGameIdToIndex[3]],
  4: bloggerNamesArray[bloggerGameIdToIndex[4]]
};

export function bloggerNameByGameId(id: number) {
  return id in bloggerGameIdToName ? bloggerGameIdToName[id as keyof typeof bloggerGameIdToName] : '?';
}

export function bloggerRecordToArray<T>(record: Record<string, T>): T[] {
  return bloggerNamesArray.map(name => record[name]) as T[];
}

export function bloggerGameIdArrayToArray<T>(t: T[]): T[] {
  let res = new Array(4);

  for (let i = 0; i < t.length; i++) {
    res[bloggerGameIdToIndex[(i + 1) as 1 | 2 | 3 | 4]] = t[i] ?? null;
  }

  return res as T[];
}

export function bloggerTimeSeriesProcess<T>(data: { bloggerId: number, t: number, value: number }[], fill?: {
  from: number,
  to: number
  step: number
}) {

  const labels = !fill ?
    Array.from(new Set(data.map(t => t.t))).sort((a, b) => a - b) :
    Array.from({ length: (fill.to - fill.from) / fill.step + 1 }, (_, i) => fill.from + i * fill.step);
  const byBlogger = Object.groupBy(data, t => bloggerNameByGameId(t.bloggerId)) as Record<number, T[]>;

  const tt = bloggerRecordToArray(byBlogger).map(t => new Map(t?.map((t: any) => [t.t, t.value])));

  return {
    labels,
    data: tt.map(blog => labels.map(t => (blog.get(t) || undefined)))
  }

}