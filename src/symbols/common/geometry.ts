import type { Point } from '../../wires/OrthogonalEdge'

export function rotatePoint(
  p: Point,
  center: Point,
  rotation: 0 | 90 | 180 | 270
): Point {
  const dx = p.x - center.x
  const dy = p.y - center.y

  switch (rotation) {
    case 90:
      return { x: center.x - dy, y: center.y + dx }
    case 180:
      return { x: center.x - dx, y: center.y - dy }
    case 270:
      return { x: center.x + dy, y: center.y - dx }
    default:
      return p
  }
}