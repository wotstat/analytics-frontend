

export function blur(array: number[][], radius: number) {
  const result = new Array(array.length).fill(null).map(() => new Array(array[0].length).fill(0));

  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      let sum = 0;
      let count = 0;

      for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
          if (i + x >= 0 && i + x < array.length && j + y >= 0 && j + y < array[i].length) {
            sum += array[i + x][j + y];
            count++;
          }
        }
      }

      result[i][j] = sum / count;
    }
  }

  return result;
}

class ArrayMap<Key, T> {
  map: Map<Key, T[]> = new Map()

  getFirst(key: Key): T | undefined {
    const values = this.map.get(key)
    return values?.[0]
  }

  remove(key: Key, value: T) {
    const values = this.map.get(key)
    if (values) {
      const index = values.indexOf(value)
      if (index > -1) {
        values.splice(index, 1)
      }
    }
  }

  removeFirst(key: Key): T | undefined {
    const values = this.map.get(key)
    if (values) {
      const value = values.shift()
      if (values.length === 0) {
        this.map.delete(key)
      }
      return value
    }
  }

  add(key: Key, value: T) {
    const values = this.map.get(key)
    if (values) {
      values.push(value)
    } else {
      this.map.set(key, [value])
    }
  }
}

type Point = { x: number, y: number };
type LineSegment = {
  nodes: { from: Point, to: Point }[]
  start: Point
  end: Point
}

export class Island {
  points: Point[] = [];
  totalValue = 0;

  constructor(points: Point[] = []) {
    this.points = points;
  }

  addCell(point: Point) {
    this.points.push(point);
  }

  traceOutline() {
    const ekey = (x1: number, y1: number, x2: number, y2: number) => `${x1},${y1};${x2},${y2}`;
    const edges = new Map<string, number>();

    for (const point of this.points) {
      const { x, y } = point;

      const e1 = ekey(x, y, x + 1, y);
      const e2 = ekey(x, y, x, y + 1);
      const e3 = ekey(x + 1, y, x + 1, y + 1);
      const e4 = ekey(x, y + 1, x + 1, y + 1);

      edges.set(e1, (edges.get(e1) ?? 0) + 1)
      edges.set(e2, (edges.get(e2) ?? 0) + 1)
      edges.set(e3, (edges.get(e3) ?? 0) + 1)
      edges.set(e4, (edges.get(e4) ?? 0) + 1)
    }

    const outline: [Point, Point][] = [];

    for (const [edge, count] of edges) {
      if (count === 1) {
        const [p1, p2] = edge.split(';').map(p => p.split(',').map(Number));
        outline.push([{ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] }]);
      }
    }

    const result: LineSegment[] = []

    const startsMap = new ArrayMap<string, LineSegment>()
    const endsMap = new ArrayMap<string, LineSegment>()

    const segments = outline.map(([from, to]) => ({
      nodes: [{ from, to }],
      start: from,
      end: to
    }))

    const key = (p: Point) => `${p.x},${p.y}`
    segments.forEach(s => {
      startsMap.add(key(s.start), s)
      endsMap.add(key(s.end), s)
    })

    const working = segments

    while (working.length > 0) {
      const seg = working.pop() as LineSegment

      startsMap.remove(key(seg.start), seg)
      endsMap.remove(key(seg.end), seg)

      if (seg.start.x == seg.end.x && seg.start.y == seg.end.y) {
        result.push(seg)
        continue
      }

      const k = key(seg.end)

      const next = startsMap.getFirst(k)
      if (next) {
        next.start = seg.start
        next.nodes.unshift(...seg.nodes)
        startsMap.remove(k, next)
        startsMap.add(key(next.start), next)
        continue
      }

      const prev = endsMap.getFirst(k)
      if (prev) {
        prev.end = seg.start
        prev.nodes.push(...seg.nodes.reverse().map(t => ({ ...t, from: t.to, to: t.from })))
        endsMap.remove(k, prev)
        endsMap.add(key(prev.end), prev)
        continue
      }

      working.push(seg)
      startsMap.add(key(seg.start), seg)
      endsMap.add(key(seg.end), seg)
    }

    return result.map(t => t.nodes.map(n => n.from))
  }

  processGrid(grid: { value: number }[][]) {
    this.totalValue = 0;
    for (const point of this.points) {
      const { x, y } = point;
      this.totalValue += grid[x][y].value;
    }
  }


}

export function findIslands(grid: (0 | 1)[][]) {
  const islands: Island[] = [];

  const xSize = grid.length;
  const ySize = grid[0].length;

  function dfs(x: number, y: number, island: Island) {
    if (x < 0 || x >= xSize || y < 0 || y >= ySize || grid[x][y] === 0) return;

    grid[x][y] = 0;
    island.addCell({ x, y });

    dfs(x + 1, y, island);
    dfs(x - 1, y, island);
    dfs(x, y + 1, island);
    dfs(x, y - 1, island);

    dfs(x - 1, y - 1, island);
    dfs(x + 1, y + 1, island);
    dfs(x - 1, y + 1, island);
    dfs(x + 1, y - 1, island);
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === 1) {
        const newIsland = new Island();
        dfs(i, j, newIsland);
        islands.push(newIsland);
      }
    }
  }

  return islands;
}