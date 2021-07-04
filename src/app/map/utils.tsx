export type TPoint = { x: number; y: number }

export type TLine = {
  p1: TPoint
  p2: TPoint
  slope: number | null
  yIntercept: number | null
  f: ((x: number) => number) | null
}

const createPoint = (x: number, y: number): TPoint => ({ x, y })

const createLine = (p1: TPoint, p2: TPoint): TLine => {
  const { x: x1, y: y1 } = p1
  const { x: x2, y: y2 } = p2
  if (x1 === x2) return { slope: null, yIntercept: null, f: null, p1, p2 }
  const slope = (y1 - y2) / (x1 - x2)
  const yIntercept = y1 - slope * x1
  const f = (x: number) => slope * x + yIntercept
  return { slope, yIntercept, f, p1, p2 }
}

const getLinesIntersection = (l1: TLine, l2: TLine): TPoint | null => {
  // https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
  const {
    p1: { x: x1, y: y1 },
    p2: { x: x2, y: y2 },
  } = l1
  const {
    p1: { x: x3, y: y3 },
    p2: { x: x4, y: y4 },
  } = l2
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  const x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d
  const y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d
  return createPoint(x, y)
}

const calcDistance = (p1: TPoint, p2: TPoint) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

export { createPoint, createLine, getLinesIntersection, calcDistance }
