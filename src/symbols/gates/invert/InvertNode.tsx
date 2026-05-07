import { useEffect } from 'react'
import {
  Position,
  type NodeProps,
  useUpdateNodeInternals,
} from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import { getSymbolStyle } from '../../common/symbolStyle'
import {
  INVERT_GEOMETRY,
  getInvertGeometry,
  getInvertPinAnchor,
  type InvertGeometry,
} from './InvertGeometry'

export { INVERT_GEOMETRY, getInvertGeometry, getInvertPinAnchor }
export type { InvertGeometry }

export type InvertNodeData = SymbolNodeData & {
  scale?: number
  rotation?: 0 | 90 | 180 | 270
}

function InputPinVisual({
  geometry,
  occupied,
  showCircle,
  strokeColor,
  strokeWidth,
}: {
  geometry: InvertGeometry
  occupied: boolean
  showCircle: boolean
  strokeColor: string
  strokeWidth: number
}) {
  const startX = occupied
    ? geometry.in.x - geometry.connectedOverlap
    : geometry.in.x

  return (
    <>
      <line
        x1={startX}
        y1={geometry.in.y}
        x2={geometry.inputStubEndX}
        y2={geometry.in.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
      />

      {showCircle && (
        <circle
          cx={geometry.in.x}
          cy={geometry.in.y}
          r={geometry.pinCircleRadius}
          fill={strokeColor}
        />
      )}
    </>
  )
}

function OutputPinVisual({
  geometry,
  occupied,
  showCircle,
  strokeColor,
  fillColor,
  strokeWidth,
}: {
  geometry: InvertGeometry
  occupied: boolean
  showCircle: boolean
  strokeColor: string
  fillColor: string
  strokeWidth: number
}) {
  const endX = occupied
    ? geometry.outputLineEndX + geometry.connectedOverlap
    : geometry.outputLineEndX

  return (
    <>
      <circle
        cx={geometry.bubbleCenterX}
        cy={geometry.bubbleCenterY}
        r={geometry.bubbleRadius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      <line
        x1={geometry.outputLineStartX}
        y1={geometry.out.y}
        x2={endX}
        y2={geometry.out.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
      />

      {showCircle && (
        <circle
          cx={geometry.out.x}
          cy={geometry.out.y}
          r={geometry.pinCircleRadius}
          fill={strokeColor}
        />
      )}
    </>
  )
}

export function InvertNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as InvertNodeData

  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const rotation = nodeData.rotation ?? 0
  const scale = nodeData.scale ?? 1

  const style = getSymbolStyle(nodeData)
  const geometry = getInvertGeometry(scale)
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, scale, geometry.width, geometry.height, updateNodeInternals])

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) =>
    !wireMode && !isOccupied(handleId)

  const bodyPath = `
    M ${geometry.bodyLeftX} ${geometry.bodyTopY}
    L ${geometry.bodyLeftX} ${geometry.bodyBottomY}
    L ${geometry.bodyRightX} ${geometry.bodyMidY}
    Z
  `

  return (
    <div
      style={{
        width: geometry.width,
        height: geometry.height,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${geometry.centerX}px ${geometry.centerY}px`,
          overflow: 'visible',
        }}
      >
        <Pin
          id="in"
          handleType="target"
          position={Position.Left}
          top={`${geometry.in.y}px`}
          left={`${geometry.in.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'in', 'target')
          }}
        />

        <Pin
          id="out"
          handleType="source"
          position={Position.Right}
          top={`${geometry.out.y}px`}
          left={`${geometry.out.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'out', 'source')
          }}
        />

        <svg
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          style={{ overflow: 'visible' }}
        >
          <InputPinVisual
            geometry={geometry}
            occupied={isOccupied('in')}
            showCircle={shouldShowCircle('in')}
            strokeColor={style.strokeColor}
            strokeWidth={style.strokeWidth}
          />

          <path
            d={bodyPath}
            fill={style.fillColor}
            stroke={style.strokeColor}
            strokeWidth={style.strokeWidth}
            strokeLinejoin="miter"
          />

          <OutputPinVisual
            geometry={geometry}
            occupied={isOccupied('out')}
            showCircle={shouldShowCircle('out')}
            strokeColor={style.strokeColor}
            fillColor={style.fillColor}
            strokeWidth={style.strokeWidth}
          />

          {nodeData.label && (
            <text
              x={geometry.labelX + style.labelOffsetX}
              y={geometry.labelY + style.labelOffsetY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={style.labelSize}
              fontWeight="700"
              fill={style.labelColor}
            >
              {nodeData.label}
            </text>
          )}
        </svg>
      </div>
    </div>
  )
}