import { Position, type NodeProps } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import {
  BUFFER_GEOMETRY,
  getBufferGeometry,
  getBufferPinAnchor,
  type BufferGeometry,
} from './BufferGeometry'

export { BUFFER_GEOMETRY, getBufferGeometry, getBufferPinAnchor }
export type { BufferGeometry }

export type BufferNodeData = SymbolNodeData & {
    rotation?: 0 | 90 | 180 | 270
}

function InputPinVisual({
  geometry,
  occupied,
  showCircle,
}: {
  geometry: BufferGeometry
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
  geometry: BufferGeometry
  occupied: boolean
  showCircle: boolean
}) {
  const endX = occupied
    ? geometry.outputStubEndX + geometry.connectedOverlap
    : geometry.outputStubEndX

  return (
    <>
      <line
        x1={geometry.outputStubStartX}
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

export function BufferNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as BufferNodeData
  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const rotation = nodeData.rotation ?? 0

  const geometry = getBufferGeometry()

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
        overflow: 'visible'
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

        <OutputPinVisual
          geometry={geometry}
          occupied={isOccupied('out')}
          showCircle={shouldShowCircle('out')}
        />

        <path
          d={bodyPath}
          fill="white"
          stroke="#111"
          strokeWidth="2"
          strokeLinejoin="miter"
        />
      </svg>
      </div>
    </div>
  )
}