import { BaseEdge, type EdgeProps } from '@xyflow/react'

export type Point = {
  x: number
  y: number
}

export type OrthogonalEdgeData = {
  points?: Point[]
  startAnchor?: Point
  endAnchor?: Point
  stroke?: string
  strokeWidth?: number
}

export function OrthogonalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}: EdgeProps) {
  const edgeData = (data ?? {}) as OrthogonalEdgeData

  const start = edgeData.startAnchor ?? { x: sourceX, y: sourceY }
  const end = edgeData.endAnchor ?? { x: targetX, y: targetY }
  const middle = edgeData.points ?? []

  const route: Point[] = [start, ...middle, end]

  let path = `M ${route[0].x} ${route[0].y}`
  for (let i = 1; i < route.length; i += 1) {
    path += ` L ${route[i].x} ${route[i].y}`
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        ...style,
        stroke: edgeData.stroke ?? style?.stroke ?? '#111',
        strokeWidth: edgeData.strokeWidth ?? style?.strokeWidth ?? 2,
      }}
    />
  )
}