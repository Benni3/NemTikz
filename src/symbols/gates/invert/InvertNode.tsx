import { Position, type NodeProps } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import {
  INVERT_GEOMETRY,
  getInvertGeometry,
  getInvertPinAnchor,
  type InvertGeometry,
} from './InvertGeometry'

export { INVERT_GEOMETRY, getInvertGeometry, getInvertPinAnchor }
export type { InvertGeometry }

export type InvertNodeData = SymbolNodeData

function InputPinVisual({
  geometry,
  occupied,
  showCircle,
}: {
  geometry: InvertGeometry
  occupied: boolean
  showCircle: boolean
}) {
  const startX = occupied ? geometry.in.x - geometry.connectedOverlap : geometry.in.x

  return (
    <>
      <line
        x1={startX}
        y1={geometry.in.y}
        x2={geometry.inputStubEndX}
        y2={geometry.in.y}
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {showCircle && (
        <circle
          cx={geometry.in.x}
          cy={geometry.in.y}
          r={geometry.pinCircleRadius}
          fill="#111"
        />
      )}
    </>
  )
}

function OutputPinVisual({
  geometry,
  occupied,
  showCircle,
}: {
  geometry: InvertGeometry
  occupied: boolean
  showCircle: boolean
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
        fill="white"
        stroke="#111"
        strokeWidth="2"
      />
      <line
        x1={geometry.outputLineStartX}
        y1={geometry.out.y}
        x2={endX}
        y2={geometry.out.y}
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {showCircle && (
        <circle
          cx={geometry.out.x}
          cy={geometry.out.y}
          r={geometry.pinCircleRadius}
          fill="#111"
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

  const geometry = getInvertGeometry()

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
          />

          <path
            d={bodyPath}
            fill="white"
            stroke="#111"
            strokeWidth="2"
            strokeLinejoin="miter"
          />

          <OutputPinVisual
            geometry={geometry}
            occupied={isOccupied('out')}
            showCircle={shouldShowCircle('out')}
          />
        </svg>
      </div>
    </div>
  )
}