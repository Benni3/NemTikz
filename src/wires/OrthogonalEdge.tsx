import { BaseEdge, type EdgeProps } from '@xyflow/react'

export type Point = {
  x: number
  y: number
}

export type OrthogonalEdgeSegmentStyle = {
  stroke?: string
  strokeWidth?: number
  label?: string
  labelColor?: string
  labelSize?: number
  labelOffsetX?: number
  labelOffsetY?: number
}

export type OrthogonalEdgeData = {
  points?: Point[]
  startAnchor?: Point
  endAnchor?: Point
  stroke?: string
  strokeWidth?: number
  segmentStyles?: Record<number, OrthogonalEdgeSegmentStyle>
}

function segmentMidpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
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

  return (
    <>
      {route.slice(0, -1).map((from, index) => {
        const to = route[index + 1]
        const segmentStyle = edgeData.segmentStyles?.[index] ?? {}

        const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`

        const mid = segmentMidpoint(from, to)
        const label = segmentStyle.label
        const labelColor = segmentStyle.labelColor ?? '#111'
        const labelSize = segmentStyle.labelSize ?? 14
        const labelX = mid.x + (segmentStyle.labelOffsetX ?? 0)
        const labelY = mid.y + (segmentStyle.labelOffsetY ?? -8)

        return (
          <g key={`${id}-seg-${index}`}>
            <BaseEdge
              id={`${id}-seg-${index}`}
              path={path}
              style={{
                ...style,
                stroke: segmentStyle.stroke ?? edgeData.stroke ?? style?.stroke ?? '#111',
                strokeWidth:
                  segmentStyle.strokeWidth ??
                  edgeData.strokeWidth ??
                  style?.strokeWidth ??
                  2,
              }}
            />

            {label ? (
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize={labelSize}
                fill={labelColor}
                pointerEvents="none"
              >
                {label}
              </text>
            ) : null}
          </g>
        )
      })}
    </>
  )
}