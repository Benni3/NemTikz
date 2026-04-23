import type { Point } from '../../wires/OrthogonalEdge'

const GRID = 20
const TIKZ_UNIT_PER_GRID = 0.5

export function toTikzPoint(x: number, y: number): Point {
  return {
    x: (x / GRID) * TIKZ_UNIT_PER_GRID,
    y: -(y / GRID) * TIKZ_UNIT_PER_GRID,
  }
}

export function formatNum(value: number): string {
  return Number(value.toFixed(3)).toString()
}

export function formatPoint(point: Point): string {
  const p = toTikzPoint(point.x, point.y)
  return `(${formatNum(p.x)}, ${formatNum(p.y)})`
}